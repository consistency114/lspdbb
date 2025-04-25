(function () {
  /* =======================================================================
     DOM handles
  ======================================================================= */
  const builderElement  = document.getElementById('builder');
  const saveButton      = document.getElementById('saveFormButton');
  const templateInput   = document.getElementById('formTemplate');
  const wildcardList    = document.getElementById('wildcard-list');
  const formNameInput   = document.getElementById('formName');

  let componentCounter = 0;
  let builderInstance;
  let predefinedKeys   = new Set();

  /* =======================================================================
     1 · Add “Preserve Key” checkbox to every component edit dialog
  ======================================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    Formio.Components.components.component.editForm = () => {
      const editForm = Formio.Components.components.component.baseEditForm();
      const apiTab   = editForm.components.find(tab => tab.key === 'api');
      if (apiTab && apiTab.components) {
        const keyIdx = apiTab.components.findIndex(c => c.key === 'key');
        if (keyIdx !== -1) {
          apiTab.components.splice(keyIdx + 1, 0, {
            type        : 'checkbox',
            input       : true,
            key         : 'uniqueKey',
            weight      : apiTab.components[keyIdx].weight + 1,
            label       : 'Preserve Key',
            tooltip     : 'When enabled, the key will not be regenerated when the label changes.',
            customClass : 'preserve-key-checkbox',
            defaultValue: false
          });
        }
      }
      return editForm;
    };
  });

  /* =======================================================================
     2 · Helper for legacy “pre-defined” keys
  ======================================================================= */
  function collectKeys(schema, set) {
    if (schema.key && schema.uniqueKey === true) set.add(schema.key);
    if (schema.components) schema.components.forEach(c => collectKeys(c, set));
    if (schema.columns)    schema.columns.forEach(col =>
      col.components && col.components.forEach(c => collectKeys(c, set)));
  }

  /* =======================================================================
     3 · Form.io builder palette options
  ======================================================================= */
  const builderOptions = {
    builder: {
      resource: true,
      premium : true,
      advanced: {
        weight: 20,
        components: {
          email: false, url: true, phoneNumber: false, tags: false, address: false,
          currency: false, survey: true, signature: false
        }
      },
      basic: {
        weight: 10,
        components: { password: false, number: false }
      },
      data: { components: { container: false, datamap: false, editgrid: false } }
    }
  };

  /* =======================================================================
     4 · Launch the builder after ComponentRegistry loads
  ======================================================================= */
  function initializeBuilderWithRegistry () {
    Object.assign(builderOptions.builder, ComponentRegistry.getBuilderGroups());
    Formio.builder(
      builderElement,
      existingFormData,
      {
        builderOptions,
        noeval      : false,
        allowEval   : true,
        allowScripts: true
      }
    )
    .then(b => {
      builderInstance = b;
      initializeBuilder();
      if (existingFormNamePHP) formNameInput.value  = existingFormNamePHP;
      if (existingTemplatePHP) templateInput.value = existingTemplatePHP;
    })
    .catch(err => {
      console.error('Error initializing builder:', err);
      alert('Error initializing form builder.');
    });
  }

  function getAssetBasePath() {
    return typeof ASSETS_BASE_PATH !== 'undefined' ? ASSETS_BASE_PATH : '';
  }

  function startBuilderInitialization () {
    if (!window.ComponentRegistry) {
      alert('ComponentRegistry.js must load before builder.js.');
      return;
    }
    ComponentRegistry.init(getAssetBasePath())
      .then(initializeBuilderWithRegistry)
      .catch(err => {
        console.error('Error initializing ComponentRegistry:', err);
        alert('Error loading components.');
      });
  }
  startBuilderInitialization();

  /* =======================================================================
     5 · Once the builder is ready, wire up all UI helpers
  ======================================================================= */
  function initializeBuilder () {
    builderInstance.on('change',         updateWildcards);
    builderInstance.on('updateComponent',handleComponentUpdate);
    saveButton.addEventListener('click', saveForm);

    try { setupTemplateListener(); } catch (err) {
      console.error('Error in setupTemplateListener:', err);
    }

    updateWildcards();
    enhanceBuilderInit();   // toggles, sliders, etc.
  }

  /* =======================================================================
     6 · Unique-key generation helpers
  ======================================================================= */
  function generateUniqueId () {
    componentCounter++;
    return `${componentCounter}${Math.random().toString(36).substr(2,4).toUpperCase()}`;
  }

  function generateKey (label, component) {
    if (component.type === 'button' && component.action === 'submit') {
      return component.key || '';
    }
    const raw = (label || component.label || component.key || 'FIELD').toString();
    const cleanLabel = raw
      .trim()
      .toUpperCase()
      .replace(/ /g, '_')
      .replace(/[^A-Z0-9_]/g, '');
    return `${cleanLabel}_${generateUniqueId()}`;
  }

  /* =======================================================================
     7 · Wildcard helper functions
  ======================================================================= */
  function getComponentKeys(component) {
    if (component.type === 'button' && component.action === 'submit') return [];

    const keys = [];

    if (component.type === 'datagrid' && component.key) {
      keys.push(`@START_${component.key}@`, `@END_${component.key}@`);
    }

    if (component.type === 'survey' && component.key && Array.isArray(component.questions)) {
      component.questions.forEach((q,i)=>{
        if (q.value) {
          const short = q.value.substring(0,15).replace(/[^A-Za-z0-9]/g,'');
          keys.push(`${component.key}_${short}${i+1}`);
        }
      });
    }

    if (component.type === 'selectboxes' && component.key && Array.isArray(component.values)) {
      component.values.forEach(opt=>{
        if (opt.value) {
          const v = String(opt.value).substring(0,15).replace(/[^A-Za-z0-9_]/g,'');
          keys.push(`${component.key}_${v}`);
        }
      });
    }

    if ([
          'textfield','textarea','checkbox','select','radio','hidden',
          'datetime','day','time','file','image'
        ].includes(component.type) && component.key) {
      keys.push(component.key);
    }

    if (component.components) keys.push(...component.components.flatMap(getComponentKeys));
    if (component.columns)    keys.push(...component.columns.flatMap(col =>
                               col.components?.flatMap(getComponentKeys) || []));
    return keys;
  }

  function updateWildcards() {
    const components   = builderInstance?.form?.components || [];
    const wildcardKeys = components.flatMap(getComponentKeys);

    const helpText = document.getElementById('dataset-help-text');
    if (helpText) {
      const hasDS = wildcardKeys.some(k=>k.startsWith('@START_')||k.startsWith('@END_'));
      helpText.style.display = hasDS ? 'block' : 'none';
    }

    wildcardList.innerHTML = wildcardKeys.map(k=>{
      const ds    = k.startsWith('@START_')||k.startsWith('@END_');
      const cls   = ['wildcard', ds?'wildcard-dataset':'' , ds?'wildcard-danger':'']
                    .join(' ').trim();
      const mark  = `{${k}}`;
      return `
        <span class="${cls}" data-wildcard="${k}">
          ${mark}
          <button class="copy-btn" data-clipboard="${mark}" title="Copy">
            <i class="bi bi-clipboard"></i>
          </button>
        </span>`;
    }).join('');

    document.querySelectorAll('.copy-btn').forEach(btn=>{
      btn.onclick = e=>{
        e.stopPropagation();
        copyToClipboard(btn.dataset.clipboard).then(()=>{
          const old = btn.innerHTML;
          btn.innerHTML = '<i class="bi bi-check-lg"></i>';
          setTimeout(()=>btn.innerHTML=old,1e3);
        });
      };
    });

    checkUsedWildcards();
  }

  function copyToClipboard(text) {
    if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);
    return new Promise((res,rej)=>{
      try{
        const ta=document.createElement('textarea');
        ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        const ok=document.execCommand('copy');
        document.body.removeChild(ta);
        ok?res():rej(new Error('execCommand copy failed'));
      }catch(e){rej(e);}
    });
  }

  function checkUsedWildcards() {
    const tmpl = templateInput.value;
    document.querySelectorAll('.wildcard').forEach(el=>{
      const key = el.dataset.wildcard;
      const re  = new RegExp(`\\{${key}\\}`,'g');
      const used= re.test(tmpl);
      el.classList.toggle('wildcard-used', used);
      if (el.classList.contains('wildcard-dataset')) {
        el.classList.toggle('wildcard-danger', !used);
      }
    });
    updateSaveButtonState();
  }

  function checkAllDatasetWildcardsUsed() {
    const ds = document.querySelectorAll('.wildcard-dataset');
    return [...ds].every(el=>el.classList.contains('wildcard-used'));
  }

  function updateSaveButtonState() {
    const ok = checkAllDatasetWildcardsUsed();
    saveButton.disabled = !ok;
    saveButton.title = ok
      ? 'Save form'
      : 'All dataset wildcards must be used in the template before saving';
  }

  function setupTemplateListener() {
    templateInput.addEventListener('input', checkUsedWildcards);
    setTimeout(updateSaveButtonState, 500);
  }

  /* =======================================================================
     8 · Component update handler
  ======================================================================= */
  function handleComponentUpdate (comp) {
    if (comp.action === 'submit') return;
    if (comp.uniqueKey === true)  return;

    if (comp.uniqueKey === false) {
      const newKey = generateKey(comp.label, comp);
      if (comp.key !== newKey) { comp.key = newKey; builderInstance.redraw(); }
      return;
    }
    if (predefinedKeys.has(comp.key)) return;

    const newKey = generateKey(comp.label, comp);
    if (comp.key !== newKey) { comp.key = newKey; builderInstance.redraw(); }

    fetch('ajax',{
      method :'POST',
      headers:{'Content-Type':'application/json'},
      body   : JSON.stringify({type:'analytics',action:'track_component',component:comp.type})
    }).catch(()=>{});
  }

  /* =======================================================================
     9 · saveForm (original full body)
  ======================================================================= */
  async function saveForm () {
    const formSchema = builderInstance?.form;
    if (!formSchema) return alert('No form schema found');

    const formName  = formNameInput.value;
    const formStyle = document.querySelector('input[name="formStyle"]:checked').value;

    const templateTitleToggle  = document.getElementById('templateTitleToggle');
    const templateLinkToggle   = document.getElementById('templateLinkToggle');
    const templatePublicToggle = document.getElementById('templatePublicToggle');

    const enableTemplateTitle = templateTitleToggle ? templateTitleToggle.checked : false;
    const enableTemplateLink  = templateLinkToggle  ? templateLinkToggle.checked  : false;
    const enablePublicLink    = templatePublicToggle? templatePublicToggle.checked: false;

    const templateTitle = enableTemplateTitle ? (document.getElementById('templateTitle').value || '') : '';
    const templateLink  = enableTemplateLink  ? (document.getElementById('templateLink').value  || '') : '';

    /* analytics: theme */
    fetch('ajax',{
      method :'POST',
      headers:{'Content-Type':'application/json'},
      body   : JSON.stringify({type:'analytics',action:'track_theme',theme:formStyle})
    }).catch(()=>{});

    isEditMode   = typeof isEditMode !== 'undefined' && isEditMode;
    const editingForm = document.getElementById('editingForm')?.value;
    const formWidth   = parseInt(document.getElementById('formWidthInput').value,10);

    try {
      const resp = await fetch('ajax',{
        method :'POST',
        headers:{'Content-Type':'application/json'},
        body   : JSON.stringify({
          type:'schema',
          schema:formSchema,
          template:templateInput.value,
          templateTitle,
          templateLink,
          enableTemplateTitle,
          enableTemplateLink,
          enablePublicLink,
          formName,
          formWidth,
          formStyle,
          editMode:isEditMode,
          editingForm,
          builder:'standard'
        })
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error);

      let formId = data.formId ||
                   data.filename.replace('forms/','').replace('_schema.json','');
      if (formId.includes('/')||formId.includes('\\'))
        formId = formId.split(/[\\/]/).pop();

      const shareUrl = siteURL + `form?f=${formId}`;
      document.getElementById('shareable-link').textContent = shareUrl;
      document.getElementById('shareable-link').href        = shareUrl;
      document.getElementById('go-to-form-button').href     = shareUrl;
      document.getElementById('success-message').style.display = 'block';
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving form: ' + (err.message || 'Unknown error'));
    }
  }

  /* =======================================================================
     10 · Misc UX helpers
  ======================================================================= */
  function initFormStyle() {
    if (typeof existingFormStyle !== 'undefined' && existingFormStyle) {
      const radio = document.querySelector(`input[name="formStyle"][value="${existingFormStyle}"]`);
      if (radio) radio.checked = true;
    }
  }

  function enhanceBuilderInit() {
    document.querySelectorAll('.style-option').forEach(card=>{
      card.addEventListener('click', e=>{
        if (e.target.type !== 'radio') {
          const radio = card.querySelector('input[type="radio"]');
          if (radio) {
            document.querySelectorAll('input[name="formStyle"]').forEach(r=>r.checked=false);
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }
      });
    });
    initFormStyle();
  }

  document.getElementById('formWidthSlider').addEventListener('input', e => {
    document.getElementById('formWidthInput').value = e.target.value;
  });
  document.getElementById('formWidthInput').addEventListener('input', e => {
    document.getElementById('formWidthSlider').value = e.target.value;
  });
})();
