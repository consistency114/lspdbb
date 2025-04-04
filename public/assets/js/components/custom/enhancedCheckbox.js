/**
 * Enhanced Checkbox Component
 * Extends the standard checkbox to include positive and negative value options
 */
(function() {
    // Get the base CheckBoxComponent class from Form.io
    const CheckBoxComponent = Formio.Components.components.checkbox;
  
    // Define our component class using ES6 class syntax
    class EnhancedCheckboxComponent extends CheckBoxComponent {
      // Define the builder info as a static getter
      static get builderInfo() {
        return {
          title: 'Enhanced Checkbox',
          group: 'custom',
          icon: 'check-square',
          weight: 40,
          schema: EnhancedCheckboxComponent.schema()
        };
      }
  
      // Define the schema factory method
      static schema() {
        return CheckBoxComponent.schema({
          type: 'enhancedCheckbox',
          label: 'Enhanced Checkbox',
          key: 'enhancedCheckbox',
          positiveValue: 'true',
          negativeValue: 'false',
          tableView: true,
          input: true,
          defaultValue: false
        });
      }
  
      // Override the baseEditForm to add our custom fields
      static editForm() {
        // Get the original edit form
        let editForm = CheckBoxComponent.editForm();
        
        // Find the data tab
        const dataTab = editForm.components.find(tab => 
          tab.key === 'tabs' && 
          tab.components.find(c => c.key === 'data')
        );
        
        if (dataTab) {
          // Get the data tab panel
          const dataPanel = dataTab.components.find(c => c.key === 'data');
          
          if (dataPanel && dataPanel.components) {
            // Find the default value field to position our new fields after it
            const defaultValueIndex = dataPanel.components.findIndex(c => c.key === 'defaultValue');
            
            if (defaultValueIndex !== -1) {
              // Create the Positive Value field
              const positiveValueField = {
                type: 'textfield',
                input: true,
                key: 'positiveValue',
                label: 'Positive Value',
                tooltip: 'The value when the checkbox is checked.',
                weight: dataPanel.components[defaultValueIndex].weight + 1,
                defaultValue: 'true',
                validate: {
                  required: true
                }
              };
              
              // Create the Negative Value field
              const negativeValueField = {
                type: 'textfield',
                input: true,
                key: 'negativeValue',
                label: 'Negative Value',
                tooltip: 'The value when the checkbox is unchecked.',
                weight: dataPanel.components[defaultValueIndex].weight + 2,
                defaultValue: 'false',
                validate: {
                  required: true
                }
              };
              
              // Insert our new fields after the default value field
              dataPanel.components.splice(defaultValueIndex + 1, 0, positiveValueField, negativeValueField);
            }
          }
        }
        
        return editForm;
      }
  
      // Constructor to initialize the component
      constructor(component, options, data) {
        super(component, options, data);
        
        // Set default values for positive and negative values if not provided
        if (this.component.positiveValue === undefined) {
          this.component.positiveValue = 'true';
        }
        if (this.component.negativeValue === undefined) {
          this.component.negativeValue = 'false';
        }
      }
  
      // Override the getValue method to return the custom values
      getValue() {
        const value = super.getValue();
        return value ? this.component.positiveValue : this.component.negativeValue;
      }
  
      // Override the setValue method to handle custom values
      setValue(value, flags) {
        // Convert the value to a boolean based on matching positive value
        const isChecked = value === this.component.positiveValue;
        return super.setValue(isChecked, flags);
      }
    }
  
    // Register the component
    if (window.ComponentRegistry) {
      window.ComponentRegistry.register('enhancedCheckbox', EnhancedCheckboxComponent);
    } else {
      // Fallback to direct registration if ComponentRegistry is unavailable
      Formio.Components.addComponent('enhancedCheckbox', EnhancedCheckboxComponent);
    }
  
    // Make it available globally for debugging and manual usage
    window.EnhancedCheckboxComponent = EnhancedCheckboxComponent;
  })();