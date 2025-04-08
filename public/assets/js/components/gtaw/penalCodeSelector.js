/**
 * Penal Code Search Component
 * A dropdown component with penal code options loaded from JSON
 * and formatted with color-coded badges
 */
(function() {
    // Get the base SelectComponent class from Form.io
    const SelectComponent = Formio.Components.components.select;
  
    // Define our component class using ES6 class syntax
    class PenalSearchComponent extends SelectComponent {
      // Define the builder info as a static getter
      static get builderInfo() {
        return {
          title: 'Penal Code Search',
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
          template: '<span class="mr-2 badge badge-{{item.badgeType}}">{{item.value}}</span>{{item.label}}',
          searchEnabled: true,
          searchField: 'label'
        });
      }
  
      // Inherit the edit form from the parent
      static editForm() {
        return SelectComponent.editForm();
      }
  
      // Initialize the component after it's created
      init() {
        // Call parent init
        super.init();
        
        // Load the penal codes from the JSON file
        this.loadPenalCodes();
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
                
                options.push({
                  value: item.id,
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
      
      // Custom render method to ensure the component displays correctly
      render() {
        return super.render();
      }
      
      // Attach element
      attach(element) {
        // Call the parent method
        const superAttach = super.attach(element);
        
        // Return the result
        return superAttach;
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