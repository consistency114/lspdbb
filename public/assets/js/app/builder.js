(function () {
    const builderElement  = document.getElementById('builder');
    const saveButton      = document.getElementById('saveFormButton');
    const templateInput   = document.getElementById('formTemplate');
    const wildcardList    = document.getElementById('wildcard-list');
    const formNameInput   = document.getElementById('formName');
  
    let componentCounter = 0;
    let builderInstance;
    let predefinedKeys   = new Set();
  
    /* ------------------------------------------------------------------
     * 1.  Form.io “Preserve Key” checkbox injection (unchanged)
     * ------------------------------------------------------------------*/
    document.addEventListener('DOMContentLoaded', () => {
      Formio.Components.components.component.editForm = () => {
        const editForm = Formio.Components.components.component.baseEditForm();
        const apiTab   = editForm.components.find(tab => tab.key === 'api');
        if (apiTab && apiTab.components) {
          const keyIndex = apiTab.components.findIndex(c => c.key === 'key');
          if (keyIndex !== -1) {
            apiTab.components.splice(keyIndex + 1, 0, {
              type        : 'checkbox',
              input       : true,
              key         : 'uniqueKey',
              weight      : apiTab.components[keyIndex].weight + 1,
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
  
    /* ------------------------------------------------------------------
     * 2.  Utility — collectKeys (unchanged)
     * ------------------------------------------------------------------*/
    function collectKeys(schema, set) {
      if (schema.key && schema.uniqueKey === true) set.add(schema.key);
      if (schema.components) schema.components.forEach(c => collectKeys(c, set));
      if (schema.columns)    schema.columns.forEach(col =>
        col.components && col.components.forEach(c => collectKeys(c, set)));
    }
  
    /* ------------------------------------------------------------------
     * 3.  Builder options (unchanged)
     * ------------------------------------------------------------------*/
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
  
    /* ------------------------------------------------------------------
     * 4.  Builder initialisation (unchanged)
     * ------------------------------------------------------------------*/
    function initializeBuilderWithRegistry() {
      try {
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
          if (existingFormNamePHP)  formNameInput.value = existingFormNamePHP;
          if (existingTemplatePHP)  templateInput.value = existingTemplatePHP;
        })
        .catch(err => {
          console.error('Error initializing builder:', err);
          alert('Error initializing form builder.');
        });
      } catch (err) {
        console.error('Error setting up form builder:', err);
        alert('There was an error setting up the form builder.');
      }
    }
  
    function getAssetBasePath() {
      return typeof ASSETS_BASE_PATH !== 'undefined' ? ASSETS_BASE_PATH : '';
    }
  
    function startBuilderInitialization() {
      if (window.ComponentRegistry) {
        ComponentRegistry.init(getAssetBasePath())
          .then(initializeBuilderWithRegistry)
          .catch(err => {
            console.error('Error initializing ComponentRegistry:', err);
            alert('Error loading components.');
          });
      } else {
        alert('ComponentRegistry.js must load before builder.js.');
      }
    }
    startBuilderInitialization();
  
    /* ------------------------------------------------------------------
     * 5.  Builder-level event hooks & UI helpers (unchanged)
     * ------------------------------------------------------------------*/
    function initializeBuilder() {
      builderInstance.on('change',         updateWildcards);
      builderInstance.on('updateComponent',handleComponentUpdate);
      saveButton.addEventListener('click', saveForm);
      setupTemplateListener();
      updateWildcards();
      // … (all your existing toggle / UI code stays unchanged) …
      enhanceBuilderInit();
    }
  
    /* ------------------------------------------------------------------
     * 6.  Key helpers
     * ------------------------------------------------------------------*/
    function generateUniqueId() {
      componentCounter++;
      return `${componentCounter}${Math.random().toString(36).substr(2,4).toUpperCase()}`;
    }
  
    /* ★★★ FIXED FUNCTION ★★★
       Safely handles undefined / empty label */
    function generateKey(label, component) {
      if (component.type === 'button' && component.action === 'submit') {
        return component.key || '';
      }
      // Fallback chain: explicit label -> component.label -> component.key -> 'FIELD'
      const raw = (label || component.label || component.key || 'FIELD').toString();
      const cleanLabel = raw
        .trim()
        .toUpperCase()
        .replace(/ /g, '_')
        .replace(/[^A-Z0-9_]/g, '');
      return `${cleanLabel}_${generateUniqueId()}`;
    }
  
    /* ------------------------------------------------------------------
     * 7.  Wildcard / template helpers (unchanged)
     * ------------------------------------------------------------------*/
    // … everything from updateWildcards(), copyToClipboard(), getComponentKeys(),
    //    checkUsedWildcards(), etc. remains exactly as in your original file …
  
    /* ------------------------------------------------------------------
     * 8.  Component update & save logic (unchanged)
     * ------------------------------------------------------------------*/
    // … handleComponentUpdate(), saveForm(), etc. remain identical …
  
    /* ------------------------------------------------------------------
     * 9.  Misc UX (unchanged)
     * ------------------------------------------------------------------*/
    // … enhanceBuilderInit(), slider sync, etc. remain identical …
  
  })();
  