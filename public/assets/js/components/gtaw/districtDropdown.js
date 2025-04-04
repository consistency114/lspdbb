/**
 * GTAW District Dropdown Component
 * A dropdown component with Los Santos/Blaine County district names
 * Fetches data from gtaw_locations.json
 */
(function() {
    // Get the base SelectComponent class from Form.io
    const SelectComponent = Formio.Components.components.select;
  
    // Define our component class using ES6 class syntax
    class DistrictDropdownComponent extends SelectComponent {
      // Define the builder info as a static getter
      static get builderInfo() {
        return {
          title: 'District Dropdown',
          group: 'gtaw',
          icon: 'pin-map',
          weight: 10,
          schema: DistrictDropdownComponent.schema()
        };
      }
  
      // Define the schema factory method
      static schema() {
        return SelectComponent.schema({
          type: 'districtDropdown',
          label: 'District',
          key: 'district',
          placeholder: 'Select a district',
          dataSrc: 'url',
          data: {
            url: siteURL + '/assets/json/gtaw_locations.json',
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
          selectValues: 'districts'
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
      window.ComponentRegistry.register('districtDropdown', DistrictDropdownComponent);
    } else {
      // Fallback to direct registration if ComponentRegistry is unavailable
      Formio.Components.addComponent('districtDropdown', DistrictDropdownComponent);
    }
  
    // Make it available globally for debugging and manual usage
    window.DistrictDropdownComponent = DistrictDropdownComponent;
})();