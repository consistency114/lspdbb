/**
 * reBB Component Registry
 * A system for registering and organizing Form.io components with dynamic loading
 */
var ComponentRegistry = (function() {
  // Private variables
  var _components = {};
  var _loadedScripts = [];
  var _loading = false;
  var _onComponentsLoadedCallbacks = [];
  
  // Component groups for the builder
  var _groups = {
    gtaw: {
      title: 'Pre-Built (GTAW)',
      weight: 0,
      default: false,
      components: {}
    },
    custom: {
      title: 'Custom',
      weight: 100,
      default: false,
      components: {}
    }
  };

  // Component definitions - define your components here
  var _componentDefinitions = [
    {
      name: 'UnitSection',
      type: 'unitSection',
      group: 'gtaw',
      path: 'components/gtaw/unitSection.js'
    },
    {
      name: 'TextfieldCookies',
      type: 'textfieldCookies',
      group: 'custom',
      path: 'components/custom/TextfieldCookies.js'
    },
    {
      name: 'TextareaCookies',
      type: 'textareaCookies',
      group: 'custom',
      path: 'components/custom/TextareaCookies.js'
    },
    {
      name: 'ToggleSwitch',
      type: 'toggleSwitch',
      group: 'custom',
      path: 'components/custom/ToggleSwitch.js'
    },
    {
      name: 'EnhancedCheckbox',
      type: 'enhancedCheckbox',
      group: 'custom',
      path: 'components/custom/EnhancedCheckbox.js'
    },
    {
      name: 'PortraitImageComponent',
      type: 'portraitImage',
      group: 'custom',
      path: 'components/custom/portraitimagecomponent.js'
    },
    {
      name: 'DistrictDropdown',
      type: 'districtDropdown',
      group: 'gtaw',
      path: 'components/gtaw/districtDropdown.js'
    },
    {
      name: 'StreetDropdown',
      type: 'streetDropdown',
      group: 'gtaw',
      path: 'components/gtaw/streetDropdown.js'
    },
    {
      name: 'PenalCodeSelector',
      type: 'penalCodeSelector',
      group: 'gtaw',
      path: 'components/gtaw/penalCodeSelector.js'
    }
  ];
   
  /**
   * Load a JavaScript file dynamically
   */
  function _loadScript(src) {
    return new Promise(function(resolve, reject) {
      if (_loadedScripts.includes(src)) {
        resolve(src + ' already loaded');
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function() {
        _loadedScripts.push(src);
        resolve(src + ' loaded successfully');
      };
      script.onerror = function() {
        reject(new Error('Failed to load script: ' + src));
      };
      document.head.appendChild(script);
    });
  }
  
  /**
   * Load all component scripts defined in _componentDefinitions
   */
  function _loadAllComponents(basePath) {
    _loading = true;
    var pathPrefix = basePath || '';
    var version = window.APP_VERSION ? '?v=' + window.APP_VERSION : '';

    function tryVariants(variants) {
      return variants.reduce(function(prev, src) {
        return prev.catch(function() {
          return _loadScript(src);
        });
      }, Promise.reject())
      .catch(function(err) {
        console.error('All variant loads failed for:', variants, err);
        return err;
      });
    }

    var promises = _componentDefinitions.map(function(def) {
      var base = pathPrefix + def.path + version;
      var lowerAll = pathPrefix + def.path.toLowerCase() + version;
      var name = def.name || def.type;
      var pascalFile = pathPrefix + def.path.replace(/[^\/]+$/, name + '.js') + version;
      var lowerFile = pathPrefix + def.path.replace(/[^\/]+$/, name.toLowerCase() + '.js') + version;
      return tryVariants([base, lowerAll, pascalFile, lowerFile]);
    });

    return Promise.all(promises)
      .then(function(results) {
        _loading = false;
        _onComponentsLoadedCallbacks.forEach(function(cb) { cb(); });
        _onComponentsLoadedCallbacks = [];
        return results;
      });
  }
  
  // Public API
  return {
    register: function(type, comp) {
      if (!Formio) { console.error('Formio not loaded'); return false; }
      try {
        Formio.Components.addComponent(type, comp);
        _components[type] = comp;
        return true;
      } catch (e) {
        console.error('Error registering component', type, e);
        return false;
      }
    },
    getBuilderGroups: function() {
      return _groups;
    },
    loadComponents: function(basePath) {
      return _loadAllComponents(basePath);
    },
    init: function(basePath) {
      console.log('Component Registry initializing...');
      return this.loadComponents(basePath)
        .then(function() {
          // Populate groups with their component types
          _componentDefinitions.forEach(function(def) {
            if (_groups[def.group]) {
              _groups[def.group].components[def.type] = true;
            }
          });
          console.log('Component Registry initialized');
          return _groups;
        });
    },
    onComponentsLoaded: function(cb) {
      if (!_loading && _loadedScripts.length === _componentDefinitions.length) {
        cb();
      } else {
        _onComponentsLoadedCallbacks.push(cb);
      }
    }
  };
})();

// Expose globally
window.ComponentRegistry = ComponentRegistry;