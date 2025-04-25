(function () {
    const builderElement  = document.getElementById('builder');
    const saveButton      = document.getElementById('saveFormButton');
    const templateInput   = document.getElementById('formTemplate');
    const wildcardList    = document.getElementById('wildcard-list');
    const formNameInput   = document.getElementById('formName');
  
    let componentCounter = 0;
    let builderInstance;
    let predefinedKeys   = new Set();
  
    /*───────────────────────────────────────────────────────────────────
      1 · “Preserve Key” checkbox added to each component edit dialog
    ───────────────────────────────────────────────────────────────────*/
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
  
    /*───────────────────────────────────────────────────────────────────*/
    function collectKeys(schema, set) {
      if (schema.key && schema.uniqueKey === true) set.add(schema.key);
      if (schema.components) schema.components.forEach(c => collectKeys(c, set));
      if (schema.columns)    schema.columns.forEach(col =>
        col.components && col.components.forEach(c => collectKeys(c, set)));
    }
  
    /*───────────────────────────────────────────────────────────────────
      2 · Initial builder palette options
    ───────────────────────────────────────────────────────────────────*/
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
  
    /*───────────────────────────────────────────────────────────────────
      3 · Registry-driven builder initialisation
    ───────────────────────────────────────────────────────────────────*/
    function initializeBuilderWithRegistry() {
      Object.assign(builderOptions.builder, ComponentRegistry.getBuilderGroups());
      Formio.builder(
        builderElement,
        existingFormData,
        {
          builderOptions,
          noeval: false,
          allowEval: true,
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
  
    function startBuilderInitialization() {
      if (!window.ComponentRegistry)
        return alert('ComponentRegistry.js must load before builder.js.');
      ComponentRegistry.init(getAssetBasePath())
        .then(initializeBuilderWithRegistry)
        .catch(err => {
          console.error('Error initializing ComponentRegistry:', err);
          alert('Error loading components.');
        });
    }
    startBuilderInitialization();
  
    /*───────────────────────────────────────────────────────────────────
      4 · Once builder ready, wire UI
    ───────────────────────────────────────────────────────────────────*/
    function initializeBuilder() {
      builderInstance.on('change',         updateWildcards);
      builderInstance.on('updateComponent',handleComponentUpdate);
      saveButton.addEventListener('click', saveForm);
      setupTemplateListener();
      updateWildcards();
      // (all toggle / UX helpers remain unchanged)
      enhanceBuilderInit();
    }
  
    /*───────────────────────────────────────────────────────────────────
      5 · Helpers for keys / wildcards
    ───────────────────────────────────────────────────────────────────*/
    function generateUniqueId() {
      componentCounter++;
      return `${componentCounter}${Math.random().toString(36).substr(2,4).toUpperCase()}`;
    }
  
    /* ★ FIXED: defend against undefined label → always string */
    function generateKey(label, component) {
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
  
    /*──────────────────────────────────────────────────────────────
      updateWildcards, copyToClipboard, getComponentKeys,
      checkUsedWildcards, etc. –– UNCHANGED
    ──────────────────────────────────────────────────────────────*/
    function updateWildcards() {
      const comps = builderInstance?.form?.components || [];
      const wildcardArray = comps.flatMap(getComponentKeys);
  
      const helpText = document.getElementById('dataset-help-text');
      if (helpText) {
        const hasDS = wildcardArray.some(k => k.startsWith('@START_') || k.startsWith('@END_'));
        helpText.style.display = hasDS ? 'block' : 'none';
      }
  
      wildcardList.innerHTML = wildcardArray.map(key => {
        const wild = `{${key}}`;
        const isDS = key.startsWith('@START_') || key.startsWith('@END_');
        return `
          <span class="wildcard ${isDS?'wildcard-dataset wildcard-danger':''}"
                data-wildcard="${key}">
            ${wild}
            <button class="copy-btn" data-clipboard="${wild}" title="Copy to clipboard">
              <i class="bi bi-clipboard"></i>
            </button>
          </span>`;
      }).join('');
  
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = e => {
          e.stopPropagation();
          copyToClipboard(btn.dataset.clipboard).then(() => {
            const old = btn.innerHTML; btn.innerHTML = '<i class="bi bi-check-lg"></i>';
            setTimeout(() => btn.innerHTML = old, 1000);
          }).catch(err => {
            console.error('Copy failed:', err);
            alert('Clipboard copy failed.');
          });
        };
      });
      checkUsedWildcards();
    }
  
    function copyToClipboard(text) {
      if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);
      return new Promise((res, rej) => {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
          document.body.appendChild(ta); ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          ok ? res() : rej(new Error('execCommand copy failed'));
        } catch (e){ rej(e);}
      });
    }
  
    /* … getComponentKeys(), checkUsedWildcards(), etc. – unchanged … */
  
    /*───────────────────────────────────────────────────────────────────
      6 · Component update logic (unchanged except generateKey fix)
    ───────────────────────────────────────────────────────────────────*/
    function handleComponentUpdate(comp) {
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
  
      fetch('ajax',{ method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({type:'analytics',action:'track_component',component:comp.type})
      }).catch(()=>{});
    }
  
    /*───────────────────────────────────────────────────────────────────
      7 · saveForm, enhanceBuilderInit, etc. – all UNCHANGED
    ───────────────────────────────────────────────────────────────────*/
    /* (code continues exactly as in your original) */
  
  })();
  