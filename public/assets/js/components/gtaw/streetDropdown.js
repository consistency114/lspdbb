/**
 * GTAW Street Dropdown Component
 * A dropdown component with Los Santos/Blaine County street names
 * Fetches data from gtaw_locations.json
 */
(function() {
    // Get the base SelectComponent class from Form.io
    const SelectComponent = Formio.Components.components.select;
  
    // Define our component class using ES6 class syntax
    class StreetDropdownComponent extends SelectComponent {
      // Define the builder info as a static getter
      static get builderInfo() {
        return {
          title: 'Street Dropdown',
          group: 'gtaw',
          icon: 'compass',
          weight: 20,
          schema: StreetDropdownComponent.schema()
        };
      }
  
      // Define the schema factory method
      static schema() {
        return SelectComponent.schema({
          type: 'streetDropdown',
          label: 'Street',
          key: 'street',
          placeholder: 'Select a street',
          dataSrc: 'url',
          data: {
            url: jsonURL + 'gtaw_locations.json',
            headers: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ]
          },
          valueProperty: '', // Value equals the item from the data source
          template: '{{ item }}',
          refreshOn: 'mounted',
          selectValues: 'streets'
        });
      }
  
      // Inherit the edit form from the parent
      static editForm() {
        return SelectComponent.editForm();
      }
  
      // Constructor to initialize the component
      constructor(component, options, data) {
        super(component, options, data);
      }
      
      // Override the getValueAsString method to handle the special data format
      getValueAsString(value) {
        if (!value) {
          return '';
        }
        return value;
      }
    }
  
    // Register the component
    if (window.ComponentRegistry) {
      window.ComponentRegistry.register('streetDropdown', StreetDropdownComponent);
    } else {
      // Fallback to direct registration if ComponentRegistry is unavailable
      Formio.Components.addComponent('streetDropdown', StreetDropdownComponent);
    }
  
    // Make it available globally for debugging and manual usage
    window.StreetDropdownComponent = StreetDropdownComponent;
})();