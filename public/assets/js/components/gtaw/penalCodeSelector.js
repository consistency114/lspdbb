/**
 * Penal Code Search Component
 * A dropdown component with penal code options loaded from JSON
 * and formatted with color-coded badges
 * Now with support for multiple selection
 */
(function() {
  // Get the base SelectComponent class from Form.io
  const SelectComponent = Formio.Components.components.select;

  // Define our component class using ES6 class syntax
  class PenalSearchComponent extends SelectComponent {
    // Define the builder info as a static getter
    static get builderInfo() {
      return {
        title: 'Penal Code Selector (Simple)',
        group: 'gtaw',
        icon: 'search',
        weight: 50,
        schema: PenalSearchComponent.schema()
      };
    }

    // Define the schema factory method
    static schema() {
      return SelectComponent.schema({
        type: 'penalSearch',
        label: 'Penal Code Charge',
        key: 'charge',
        placeholder: 'Select a charge',
        dataSrc: 'values',
        data: {
          values: []  // We'll populate this programmatically
        },
        template: '<span class="mr-2 badge badge-{{item.badgeType}}">{{item.charge_id}}</span>{{item.label}}',
        searchEnabled: true,
        multiple: false,
        defaultValue: '' // Will be set to [] if multiple is true
      });
    }

    // Override the default value based on multiple selection setting
    constructor(component, options, data) {
      // Ensure the default value is appropriate for the multiple selection mode
      if (component.multiple && component.defaultValue === '') {
        component.defaultValue = [];
      }
      
      super(component, options, data);
    }

    // Inherit the edit form from the parent with some modifications
    static editForm() {
      const form = SelectComponent.editForm();
      
      // Find the 'multiple' checkbox component in the data section
      const dataTab = form.components.find(tab => 
        tab.key === 'tabs' && 
        tab.components.find(c => c.key === 'data')
      );
      
      if (dataTab) {
        const dataPanel = dataTab.components.find(c => c.key === 'data');
        if (dataPanel) {
          // Find the multiple checkbox
          const multipleComp = dataPanel.components.find(c => c.key === 'multiple');
          if (multipleComp) {
            // Add a custom change event handler
            multipleComp.customConditional = function(context) {
              // If multiple is checked, ensure defaultValue is an array
              if (context.value) {
                const defaultValueComp = dataPanel.components.find(c => c.key === 'defaultValue');
                if (defaultValueComp && typeof context.data.defaultValue !== 'object') {
                  context.data.defaultValue = [];
                }
              }
              return true;
            };
          }
        }
      }
      
      return form;
    }

    // Initialize the component after it's created
    init() {
      // Ensure defaultValue is appropriate for selection mode before init
      if (this.component.multiple && !Array.isArray(this.component.defaultValue)) {
        this.component.defaultValue = [];
      }
      
      // Call parent init
      super.init();
      
      // Load the penal codes from the JSON file
      this.loadPenalCodes();
    }
    
    // Override the filtering method to search in both ID and charge name
    setItems(items, fromSearch) {
      if (this.component.searchEnabled && this.searchInput && this.searchInput.value) {
        const searchValue = this.searchInput.value.toLowerCase();
        
        // Custom filter to search in both value (ID) and label (charge name)
        items = items.filter(item => {
          // Check if the search term appears in either value or label
          return (
            (item.value && item.value.toString().toLowerCase().indexOf(searchValue) !== -1) ||
            (item.label && item.label.toLowerCase().indexOf(searchValue) !== -1)
          );
        });
      }
      
      // Call the parent method to set the filtered items
      return super.setItems(items, fromSearch);
    }
    
    // Function to load and process the penal codes
    loadPenalCodes() {
      const url = jsonURL + 'gtaw_penal_code.json';
      
      fetch(url)
        .then(response => response.json())
        .then(data => {
          const options = [];
          
          // Process the data into the format needed for the select
          Object.keys(data).forEach(key => {
            try {
              const item = data[key];
              if (!item || !item.id || !item.charge) {
                return; // Skip invalid entries
              }
              
              // Map type value to badge class
              let badgeType = 'dark'; // Default
              if (item.type === 'F') badgeType = 'danger';
              if (item.type === 'M') badgeType = 'warning';
              if (item.type === 'I') badgeType = 'success';
              
              var combinedCharge = item.id + '. ' + item.charge;

              options.push({
                value: combinedCharge,
                charge_id: item.id,
                label: item.charge,
                badgeType: badgeType
              });
            } catch (err) {
              console.warn('Error processing penal code:', key, err);
            }
          });
          
          // Set the options directly
          this.component.data.values = options;
          
          // Redraw the component
          this.redraw();
          
          // If we have a default value, set it
          if (this.dataValue) {
            this.setValue(this.dataValue);
          }
        })
        .catch(err => {
          console.error('Error loading penal codes:', err);
          this.component.data.values = [{
            value: '000',
            label: 'Error loading charges',
            badgeType: 'dark'
          }];
          this.redraw();
        });
    }
    
    // Override setValue to handle array values properly for multiple selection
    setValue(value, flags) {
      // Ensure value is an array when multiple is enabled
      if (this.component.multiple && value && !Array.isArray(value)) {
        value = [value];
      }
      
      return super.setValue(value, flags);
    }
    
    // Properly handle different value formats
    normalizeValue(value) {
      if (this.component.multiple && !Array.isArray(value)) {
        if (value === '' || value === null || value === undefined) {
          return [];
        }
        return [value];
      }
      
      return super.normalizeValue(value);
    }
  }

  // Register the component
  if (window.ComponentRegistry) {
    window.ComponentRegistry.register('penalSearch', PenalSearchComponent);
  } else {
    // Fallback to direct registration if ComponentRegistry is unavailable
    Formio.Components.addComponent('penalSearch', PenalSearchComponent);
  }

  // Make it available globally for debugging and manual usage
  window.PenalSearchComponent = PenalSearchComponent;
})();