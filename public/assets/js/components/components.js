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
      path: 'components/custom/PortraitImageComponent.js'
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
   * @param {string} src - Path to the JavaScript file
   * @returns {Promise} - Resolves when script is loaded
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
   * @param {string} basePath - Base path prefix for all component paths
   * @returns {Promise} - Resolves when all components are loaded
   */
  function _loadAllComponents(basePath) {
    _loading = true;
    var pathPrefix = basePath || '';
    var version = window.APP_VERSION ? '?v=' + window.APP_VERSION : '';

    // Helper: try multiple URL variants in sequence
    function tryVariants(variants) {
      return variants.reduce(function(prevPromise, src) {
        return prevPromise.catch(function() {
          return _loadScript(src);
        });
      }, Promise.reject())
      .catch(function(err) {
        console.error('All variant loads failed for:', variants, err);
        return err;
      });
    }

    var loadPromises = _componentDefinitions.map(function(component) {
      var base = pathPrefix + component.path + version;
      var lowerAll = pathPrefix + component.path.toLowerCase() + version;
      var name = component.name || component.type;
      var filenamePascal = pathPrefix + component.path.replace(/[^\/]+$/, name + '.js') + version;
      var filenameLower = pathPrefix + component.path.replace(/[^\/]+$/, name.toLowerCase() + '.js') + version;
      var variants = [ base, lowerAll, filenamePascal, filenameLower ];
      return tryVariants(variants);
    });

    return Promise.all(loadPromises)
      .then(function(results) {
        _loading = false;
        _onComponentsLoadedCallbacks.forEach(function(cb) { cb(); });
        _onComponentsLoadedCallbacks = [];
        return results;
      });
  }
  
  // Public API
  return {
    register: function(type, component) {
      if (!Formio) {
        console.error('Formio not loaded');
        return false;
      }
      try {
        Formio.Components.addComponent(type, component);
        _components[type] = component;
        return true;
      } catch (e) {
        console.error('Error registering component', type, e);
        return false;
      }
    },
    getBuilderGroups: function() {
      return _groups;
    },
    getComponent: function(type) {
      return _components[type] || null;
    },
    getAllComponents: function() {
      return _components;
    },
    hasComponent: function(type) {
      return !!_components[type];
    },
    addComponentDefinition: function(def) {
      _componentDefinitions.push(def);
    },
    getComponentDefinitions: function() {
      return _componentDefinitions;
    },
    loadComponents: function(basePath) {
      return _loadAllComponents(basePath);
    },
    onComponentsLoaded: function(cb) {
      if (!_loading && _loadedScripts.length === _componentDefinitions.length) {
        cb();
      } else {
        _onComponentsLoadedCallbacks.push(cb);
      }
    },
    init: function(basePath) {
      console.log('Component Registry initializing...');
      return this.loadComponents(basePath)
        .then(function() {
          console.log('Component Registry initialized');
          return _groups;
        });
    }
  };
})();

// Expose globally
window.ComponentRegistry = ComponentRegistry;