/**
 * builder-basic.js - Simplified Form Builder
 * 
 * Enhanced version with field removal and drag-and-drop reordering capabilities
 */

(function() {
    // DOM Elements
    let formPreview = document.querySelector('.preview-container form') || document.querySelector('form');
    let formItemsList = formPreview.querySelector('ul');

    // Make sure we have the necessary structure
    if (!formItemsList) {
        formItemsList = document.createElement('ul');
        formItemsList.style.listStyleType = 'none'; // Ensure no list bullets
        formItemsList.style.padding = '0px';
        formPreview.appendChild(formItemsList);
    }

    // Check if we're using the basic builder via query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isBasicBuilder = urlParams.get('b') === 'basic' || (typeof window.useBasicBuilder !== 'undefined' && window.useBasicBuilder);

    // State to track the form being built
    let formState = {
        components: [],
        title: 'My Form',
        display: 'form',
        type: 'form'
    };

    // Load existing form data if available
    if (typeof existingFormData !== 'undefined' && existingFormData) {
        try {
            // If the existing data is already an object, use it directly
            if (typeof existingFormData === 'object') {
                formState = existingFormData;
            }
            // Otherwise, try to parse it (in case it's a JSON string)
            else if (typeof existingFormData === 'string') {
                formState = JSON.parse(existingFormData);
            }

            // If we have components from existing data, render them in the preview
            if (formState.components && Array.isArray(formState.components)) {
                // Clear the list first
                formItemsList.innerHTML = '';

                // Add each component to the preview
                formState.components.forEach(component => {
                    // Skip the submit button if it already exists
                    if (component.type === 'button' && component.action === 'submit') {
                        return;
                    }
                    addFieldToPreview(component);
                });
            }
        } catch (error) {
            console.error('Error loading existing form data:', error);
        }
    }

    // Counter for generating unique IDs
    let componentCounter = 0;

    // Setup field type buttons
    function setupFieldTypeButtons() {
        const inputTypesContainer = document.querySelector('.input-types'); // Get the container
        const fieldTypeButtons = document.querySelectorAll('.input-types button.field-type'); // Select only buttons directly

        if (inputTypesContainer && fieldTypeButtons.length > 0) {
             // Clear existing btn-col divs if they exist
             const btnCols = inputTypesContainer.querySelectorAll('.btn-col');
             btnCols.forEach(col => col.remove());

            fieldTypeButtons.forEach(button => {
                // Updated field type button classes and structure
                button.classList.remove('btn-primary', 'field-type'); // Remove original specific class if needed
                button.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'mb-2', 'w-100', 'd-flex', 'justify-content-start', 'align-items-center'); // Add width 100% and flex for alignment
                inputTypesContainer.appendChild(button); // Append button directly to the container
                 // Ensure icon is first
                 const icon = button.querySelector('i');
                 const text = button.querySelector('span');
                 if (icon && text) {
                     button.insertBefore(icon, text); // Ensure icon is before text
                     icon.classList.add('me-2'); // Keep margin
                 }
                button.addEventListener('click', function() {
                    // Get the data-field-type attribute for field type
                    const fieldType = this.dataset.fieldType || 'textfield';
                    openFieldModal(fieldType);
                });
            });
        }
    }

    // Function to open the field configuration modal
    function openFieldModal(fieldType, existingField = null) {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal fade show';
        modalContainer.style.display = 'block';
        modalContainer.style.paddingRight = '15px';
        document.body.appendChild(modalContainer);
    
        // Create modal dialog
        const modalDialog = document.createElement('div');
        modalDialog.className = 'modal-dialog';
        modalContainer.appendChild(modalDialog);
    
        // Field type label
        let fieldTypeLabel = 'Text Field';
        if (fieldType === 'textarea') fieldTypeLabel = 'Text Area';
        if (fieldType === 'select') fieldTypeLabel = 'Dropdown';
        if (fieldType === 'checkbox') fieldTypeLabel = 'Checkbox';
        if (fieldType === 'datetime') fieldTypeLabel = 'Date & Time';
        if (fieldType === 'date') fieldTypeLabel = 'Date';
        if (fieldType === 'time') fieldTypeLabel = 'Time';
        if (fieldType === 'url') fieldTypeLabel = 'URL';
    
        // Prepare select options HTML if it's a select field
        let selectOptionsHtml = '';
        if (fieldType === 'select') {
            selectOptionsHtml = `
                <div class="form-group mt-3">
                    <label class="form-label" style="display: flex; align-items: center;">
                        Options
                        <span class="ms-2" style="cursor: help;" title="Add options for your dropdown menu">
                            <i class="bi bi-question-circle text-muted"></i>
                        </span>
                    </label>
                    <div id="select-options-container" class="border rounded p-3 mb-2">
                        <div id="select-options-list">
                            <!-- Options will be inserted here -->
                        </div>
                        <button type="button" class="btn btn-sm btn-primary mt-2" id="add-select-option">
                            <i class="bi bi-plus-circle me-1"></i> Add Option
                        </button>
                    </div>
                </div>
            `;
        }
    
        // Prepare checkbox values HTML if it's a checkbox field
        let checkboxValuesHtml = '';
        if (fieldType === 'checkbox') {
            checkboxValuesHtml = `
                <div class="form-group mt-3">
                    <label class="form-label" style="display: flex; align-items: center;">
                        Values
                        <span class="ms-2" style="cursor: help;" title="Define what values to use when the checkbox is checked or unchecked">
                            <i class="bi bi-question-circle text-muted"></i>
                        </span>
                    </label>
                    <div class="row g-2">
                        <div class="col">
                            <label class="form-label small">Checked Value</label>
                            <input type="text" class="form-control" id="checkbox-positive-value" value="${existingField && (existingField.positiveValue || existingField.trueValue) ? (existingField.positiveValue || existingField.trueValue) : 'true'}">
                        </div>
                        <div class="col">
                            <label class="form-label small">Unchecked Value</label>
                            <input type="text" class="form-control" id="checkbox-negative-value" value="${existingField && (existingField.negativeValue || existingField.falseValue) ? (existingField.negativeValue || existingField.falseValue) : 'false'}">
                        </div>
                    </div>
                </div>
            `;
        }
    
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <div class="modal-header" style="display: flex;">
                <div style="margin-bottom: 1rem;">
                    <h6 class="text-muted"> Type: ${fieldTypeLabel} </h6>
                </div>
            </div>
            <div class="modal-body">
                <form class="">
                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center;">
                            <span>Name *</span>
                        </label>
                        <input type="text" class="form-control" id="field-name" value="${existingField ? existingField.label : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center;">
                            Description
                            <span class="ms-2" style="cursor: help;" title="Additional information about this field">
                                <i class="bi bi-question-circle text-muted"></i>
                            </span>
                        </label>
                        <input type="text" class="form-control" id="field-description" value="${existingField && existingField.description ? existingField.description : ''}">
                    </div>
                    ${fieldType === 'textfield' || fieldType === 'textarea' ? `
                    <div class="form-group">
                        <div style="display: flex; align-items: center;">
                            <div class="form-check form-switch me-3">
                                <input type="checkbox" id="isMulti" class="form-check-input" ${existingField?.isMulti ? 'checked' : ''}>
                                <label title="Allows multiple entries of this field" for="isMulti" class="form-check-label">Multi</label>
                            </div>
                            <span style="cursor: help;" title="Enable to create a repeatable section in templates with START/END tags">
                                <i class="bi bi-question-circle text-muted"></i>
                            </span>
                        </div>
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center;">
                            Default
                            <span class="ms-2" style="cursor: help;" title="The default value for this field">
                                <i class="bi bi-question-circle text-muted"></i>
                            </span>
                        </label>
                        <input autocomplete="off" type="text" class="form-control" id="field-default" value="${existingField && existingField.defaultValue ? existingField.defaultValue : ''}" style="padding-right: 2.5rem;">
                    </div>
                    ${fieldType === 'checkbox' ? `
                    <div class="form-group mt-3">
                        <div class="form-check">
                            <input type="checkbox" id="default-checked" class="form-check-input" ${existingField && existingField.defaultValue === (existingField.positiveValue || existingField.trueValue || 'true') ? 'checked' : ''}>
                            <label class="form-check-label" for="default-checked">Checked by default</label>
                        </div>
                    </div>
                    ` : ''}
                    ${selectOptionsHtml}
                    ${checkboxValuesHtml}
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-warning" id="cancel-field" style="margin-right: auto;">Cancel</button>
                <button type="button" class="btn btn-success" id="add-field">${existingField ? 'Update' : 'Add'}</button>
            </div>
        `;
        modalDialog.appendChild(modalContent);
    
        // Handle cancel button
        const cancelButton = modalContent.querySelector('#cancel-field');
        cancelButton.addEventListener('click', function() {
            closeModal(modalContainer, backdrop);
        });
    
        // Set up select options if this is a select field
        if (fieldType === 'select') {
            const optionsList = modalContent.querySelector('#select-options-list');
            const addOptionButton = modalContent.querySelector('#add-select-option');
            
            // Function to add an option row
            function addOptionRow(label = '', value = '') {
                const optionId = Date.now() + Math.floor(Math.random() * 1000);
                const optionRow = document.createElement('div');
                optionRow.className = 'select-option-row d-flex align-items-center mb-2';
                optionRow.dataset.optionId = optionId;
                
                optionRow.innerHTML = `
                    <div class="col me-2">
                        <input type="text" class="form-control form-control-sm option-label" placeholder="Label" value="${label}">
                    </div>
                    <div class="col me-2">
                        <input type="text" class="form-control form-control-sm option-value" placeholder="Value" value="${value}">
                    </div>
                    <button type="button" class="btn btn-sm btn-danger remove-option">
                        <i class="bi bi-trash"></i>
                    </button>
                `;
                
                // Add remove button event listener
                const removeButton = optionRow.querySelector('.remove-option');
                removeButton.addEventListener('click', function() {
                    optionRow.remove();
                });
                
                optionsList.appendChild(optionRow);
            }
            
            // Add event listener for adding new options
            addOptionButton.addEventListener('click', function() {
                addOptionRow();
            });
            
            // If editing an existing select field, populate its options
            if (existingField && existingField.data && existingField.data.values) {
                existingField.data.values.forEach(option => {
                    // Handle different option formats
                    if (typeof option === 'object' && option.label && option.value !== undefined) {
                        addOptionRow(option.label, option.value);
                    } else if (typeof option === 'string') {
                        addOptionRow(option, option);
                    }
                });
            } else {
                // Add a couple of empty option rows for new select fields
                addOptionRow('Option 1', 'option1');
                addOptionRow('Option 2', 'option2');
            }
        }
    
        // Handle add/update button
        const addButton = modalContent.querySelector('#add-field');
        addButton.addEventListener('click', function() {
            const nameInput = modalContent.querySelector('#field-name');
            const descriptionInput = modalContent.querySelector('#field-description');
            const defaultInput = modalContent.querySelector('#field-default');
    
            // Basic validation
            if (!nameInput.value.trim()) {
                nameInput.classList.add('is-invalid');
                return;
            }
    
            // Get multi options if applicable
            let isMulti = false;
    
            if (fieldType === 'textfield' || fieldType === 'textarea') {
                const multiCheckbox = modalContent.querySelector('#isMulti');
                isMulti = multiCheckbox?.checked || false;
            }
    
            // Prepare component data - IMPORTANT: Keep the original field type!
            const componentData = {
                type: fieldType, // We'll update this right below for checkbox special case
                label: nameInput.value.trim(),
                key: existingField ? existingField.key : generateKey(nameInput.value.trim()),
                description: descriptionInput.value.trim() || '',
                defaultValue: defaultInput.value || '',
                input: true,
                tableView: true,
                id: existingField ? existingField.id : generateUniqueId(),
                isMulti: isMulti, // Just store the multi flag
                values: existingField?.values || [] // For storing multiple values
            };
    
            // For checkbox, get the positive/negative values and convert to enhancedCheckbox
            if (fieldType === 'checkbox') {
                // Convert checkbox to enhancedCheckbox
                componentData.type = 'enhancedCheckbox';
                
                const positiveValueInput = modalContent.querySelector('#checkbox-positive-value');
                const negativeValueInput = modalContent.querySelector('#checkbox-negative-value');
                const defaultCheckedInput = modalContent.querySelector('#default-checked');
                
                componentData.positiveValue = positiveValueInput.value || 'true';
                componentData.negativeValue = negativeValueInput.value || 'false';
                
                // Set default value based on the checkbox state
                componentData.defaultValue = defaultCheckedInput.checked ? 
                    componentData.positiveValue : componentData.negativeValue;
            }
    
            // If it's a select field, gather options
            if (fieldType === 'select') {
                const optionRows = modalContent.querySelectorAll('.select-option-row');
                const options = [];
                
                optionRows.forEach(row => {
                    const labelInput = row.querySelector('.option-label');
                    const valueInput = row.querySelector('.option-value');
                    
                    if (labelInput && valueInput && (labelInput.value.trim() || valueInput.value.trim())) {
                        options.push({
                            label: labelInput.value.trim(),
                            value: valueInput.value.trim() || labelInput.value.trim()
                        });
                    }
                });
                
                // Add the options to the component data
                componentData.data = {
                    values: options
                };
                
                // Set placeholder text
                componentData.placeholder = 'Select an option';
            }
    
            // If updating an existing field
            if (existingField) {
                // Find and update the field in formState
                const index = formState.components.findIndex(c => c.id === existingField.id);
                if (index !== -1) {
                    formState.components[index] = componentData;
                }
    
                // Update the preview
                updateFieldPreview(componentData, existingField.id);
            } else {
                // Add the field to formState
                formState.components.push(componentData);
    
                // Add to the preview
                addFieldToPreview(componentData);
            }
    
            // Close the modal
            closeModal(modalContainer, backdrop);
    
            // Update wildcards
            updateWildcards();
        });
    }

    // Function to close the modal
    function closeModal(modal, backdrop) {
        document.body.removeChild(modal);
        document.body.removeChild(backdrop);
    }

    // Function to generate a unique ID
    function generateUniqueId() {
        componentCounter++;
        return `${componentCounter}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    // Function to generate a key from label
    function generateKey(label) {
        const cleanLabel = label.trim().replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        return cleanLabel + '_' + generateUniqueId();
    }

    // Function to add a submit button to the form
    function addSubmitButtonToForm() {
        // First, remove any existing submit button container
        const existingSubmitButton = document.querySelector('.submit-button-container');
        if (existingSubmitButton) {
            existingSubmitButton.remove();
        }
    
        // Create a submit button element
        const submitButtonContainer = document.createElement('div');
        submitButtonContainer.className = 'submit-button-container mt-4 mb-2 text-center';
        submitButtonContainer.innerHTML = `
            <button type="button" class="btn btn-primary submit-button">
                Submit
            </button>
            <div class="small text-muted mt-1">This submit button is automatically added to all forms.</div>
        `;
    
        // Add it after the list of form items
        formItemsList.parentNode.appendChild(submitButtonContainer);
    
        // Remove any existing submit button from the components array
        formState.components = formState.components.filter(c => !(c.type === 'button' && c.action === 'submit'));
        
        // We won't add the submit button to formState.components here
        // It will be added just before saving the form
    }

    function ensureSubmitButtonIsLast() {
        // Remove any existing submit button
        formState.components = formState.components.filter(c => !(c.type === 'button' && c.action === 'submit'));
        
        // Create the submit button component
        const submitButtonComponent = {
            type: 'button',
            label: 'Submit',
            key: 'submit',
            action: 'submit',
            theme: 'primary',
            id: 'submit_button',
            input: true,
            tableView: false,
            isSubmitButton: true
        };
        
        // Add it to the end of the array
        formState.components.push(submitButtonComponent);
    }

    // Function to add a field to the preview
    function addFieldToPreview(field) {
        // Skip submit button from being added to the field list
        if (field.type === 'button' && field.action === 'submit') {
            return;
        }

        const fieldItem = document.createElement('div');
        // --- MODIFICATION START: Removed align-items-center from row ---
        fieldItem.className = 'preview-input-component row mb-3';
        // --- MODIFICATION END ---
        fieldItem.dataset.fieldId = field.id;

        // Base HTML structure for the field
        let inputHtml = createInputHtml(field, 0);

        // --- MODIFICATION START: Added delete button and modified button layout ---
        fieldItem.innerHTML = `
            <div class="col"> <div class="form-group">
                    <label class="form-label mb-1"> <span style="font-weight: bold;">${field.label}</span>
                        <div class="small text-muted">${field.description}</div>
                    </label>
                    <div class="field-inputs" data-field-key="${field.key}">
                        ${inputHtml}
                    </div>
                </div>
            </div>
            <div class="col-auto d-flex align-items-center pt-4"> 
                <button type="button" class="btn btn-sm btn-outline-warning edit-field me-2" data-field-id="${field.id}"> 
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger delete-field me-2" data-field-id="${field.id}"> 
                    <i class="bi bi-trash"></i>
                </button>
                <div class="drag-handle" style="cursor: grab; color: var(--bs-secondary);"> 
                    <i class="bi bi-grip-vertical"></i>
                </div>
            </div>
        `;
        // --- MODIFICATION END ---

        // Add the field to the form
        formItemsList.appendChild(fieldItem);

        // Add event listener to edit button
        const editButton = fieldItem.querySelector('.edit-field');
        editButton.addEventListener('click', function() {
            const fieldId = this.dataset.fieldId;
            const field = formState.components.find(c => c.id === fieldId);
            if (field) {
                // For enhancedCheckbox, pass 'checkbox' as the field type to edit it
                const editType = (field.type === 'enhancedCheckbox') ? 'checkbox' : field.type;
                openFieldModal(editType, field);
            }
        });

        // --- MODIFICATION START: Add event listener to delete button ---
        const deleteButton = fieldItem.querySelector('.delete-field');
        deleteButton.addEventListener('click', function() {
            const fieldId = this.dataset.fieldId;
            removeField(fieldId);
        });
        // --- MODIFICATION END ---

        // Add event listeners for the Add/Remove buttons if this is a multi field
        if (field.isMulti) {
            setupMultiButtons(fieldItem, field);

            // Render any existing additional values
            if (field.values && field.values.length > 0) {
                const fieldInputs = fieldItem.querySelector('.field-inputs');
                field.values.forEach((value, idx) => {
                    // Skip the first one as it's already there
                    if (idx === 0) return;

                    // Add additional input fields
                    const newInputHtml = createInputHtml(field, idx, value, true);
                    fieldInputs.insertAdjacentHTML('beforeend', newInputHtml);
                });

                // Re-setup the buttons for newly added fields
                setupMultiButtons(fieldItem, field);
            }
        }
    }

    // --- MODIFICATION START: Add function to remove a field ---
    function removeField(fieldId) {
        // Remove from DOM
        const fieldItem = document.querySelector(`.preview-input-component[data-field-id="${fieldId}"]`);
        if (fieldItem) {
            // Optional: Add a simple fade-out animation before removal
            fieldItem.style.transition = 'opacity 0.3s';
            fieldItem.style.opacity = '0';
            
            // Remove after transition
            setTimeout(() => {
                formItemsList.removeChild(fieldItem);
            }, 300);
        }
        
        // Remove from formState
        const index = formState.components.findIndex(c => c.id === fieldId);
        if (index !== -1) {
            formState.components.splice(index, 1);
        }
        
        // Update wildcards
        setTimeout(updateWildcards, 300); // Wait for animation to complete
    }
    // --- MODIFICATION END ---

    // Helper to create input HTML
    function createInputHtml(field, index, value = '', isRemovable = false) {
        const inputId = `{{${field.key}_input_${index}}}`;
        const fieldValue = value || (index === 0 ? field.defaultValue : '');
    
        let addRemoveButton = '';
        if (field.isMulti) {
            if (isRemovable) {
                // Remove button for additional fields
                addRemoveButton = `
                    <button type="button" class="btn btn-sm btn-danger remove-field" data-field-key="${field.key}" data-index="${index}" style="${field.type === 'textarea' ? 'height: 100%;' : ''}">
                        <i class="bi bi-dash-circle"></i>
                    </button>
                `;
            } else {
                // Add button for the first field
                addRemoveButton = `
                    <button type="button" class="btn btn-sm btn-success add-field" data-field-key="${field.key}" style="${field.type === 'textarea' ? 'height: 100%;' : ''}">
                        <i class="bi bi-plus-circle"></i>
                    </button>
                `;
            }
        }
    
        // Different input types based on field type
        if (field.type === 'textarea') {
            return `
                <div class="input-group mb-2" data-index="${index}" style="flex-wrap: nowrap;">
                    <textarea autocomplete="off" id="${inputId}" class="form-control" rows="3">${fieldValue}</textarea>
                    <div class="input-group-append" style="display: flex;">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else if (field.type === 'select') {
            // Create select options
            const options = field.data?.values || [];
            let optionsHtml = '';
            
            // Add placeholder option
            optionsHtml += `<option value="" ${!fieldValue ? 'selected' : ''}>Select an option</option>`;
            
            // Add each option
            options.forEach(option => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const isSelected = fieldValue === optionValue;
                
                optionsHtml += `<option value="${optionValue}" ${isSelected ? 'selected' : ''}>${optionLabel}</option>`;
            });
            
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <select id="${inputId}" class="form-control">
                        ${optionsHtml}
                    </select>
                    <div class="input-group-append">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else if (field.type === 'checkbox' || field.type === 'enhancedCheckbox') {
            // Determine if checkbox should be checked
            const positiveValue = field.positiveValue || 'true';
            const isChecked = fieldValue === positiveValue;
            
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <div class="form-check ps-0 d-flex align-items-center">
                        <input type="checkbox" id="${inputId}" class="form-check-input ms-2" 
                            ${isChecked ? 'checked' : ''} 
                            data-positive-value="${field.positiveValue || 'true'}" 
                            data-negative-value="${field.negativeValue || 'false'}">
                        <label class="form-check-label ms-2" for="${inputId}">
                            ${field.description || ''}
                        </label>
                    </div>
                    <div class="input-group-append ms-auto">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else if (field.type === 'datetime') {
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <input type="datetime-local" id="${inputId}" class="form-control" value="${fieldValue}">
                    <div class="input-group-append">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else if (field.type === 'date') {
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <input type="date" id="${inputId}" class="form-control" value="${fieldValue}">
                    <div class="input-group-append">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else if (field.type === 'time') {
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <input type="time" id="${inputId}" class="form-control" value="${fieldValue}">
                    <div class="input-group-append">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else if (field.type === 'url') {
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <span class="input-group-text">
                        <i class="bi bi-link"></i>
                    </span>
                    <input type="url" id="${inputId}" class="form-control" value="${fieldValue}" placeholder="https://example.com">
                    <div class="input-group-append">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <input type="text" id="${inputId}" class="form-control" value="${fieldValue}">
                    <div class="input-group-append">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        }
    }

    // Setup Multi add/remove buttons
    function setupMultiButtons(fieldItem, field) {
        if (!field.isMulti) return;

        // Setup add buttons
        const addButtons = fieldItem.querySelectorAll('.add-field');
        addButtons.forEach(btn => {
            // Remove existing listeners to avoid duplicates
            btn.removeEventListener('click', handleAddField);
            // Add new listener
            btn.addEventListener('click', handleAddField);
        });

        // Setup remove buttons
        const removeButtons = fieldItem.querySelectorAll('.remove-field');
        removeButtons.forEach(btn => {
            // Remove existing listeners to avoid duplicates
            btn.removeEventListener('click', handleRemoveField);
            // Add new listener
            btn.addEventListener('click', handleRemoveField);
        });
    }

    // Handler for adding a new field
    function handleAddField() {
        const fieldKey = this.dataset.fieldKey;
        const fieldContainer = this.closest('.field-inputs');
        const fieldComponent = formState.components.find(c => c.key === fieldKey);

        if (!fieldComponent || !fieldContainer) return;

        // Get the current number of inputs
        const existingInputs = fieldContainer.querySelectorAll('.input-group');
        const newIndex = existingInputs.length;

        // Create a new empty input
        const newInputHtml = createInputHtml(fieldComponent, newIndex, '', true);

        // Add it to the DOM
        fieldContainer.insertAdjacentHTML('beforeend', newInputHtml);

        // Update component values in state
        if (!fieldComponent.values) fieldComponent.values = [];
        fieldComponent.values[newIndex] = '';

        // Setup remove button for the new field
        setupMultiButtons(fieldContainer.closest('.preview-input-component'), fieldComponent);
    }

    // Handler for removing a field
    function handleRemoveField() {
        const fieldKey = this.dataset.fieldKey;
        const index = parseInt(this.dataset.index);
        const fieldContainer = this.closest('.field-inputs');
        const inputGroup = this.closest('.input-group');
        const fieldComponent = formState.components.find(c => c.key === fieldKey);

        if (!fieldComponent || !fieldContainer || !inputGroup) return;

        // Remove the input group from DOM
        inputGroup.remove();

        // Remove from component values
        if (fieldComponent.values && fieldComponent.values.length > index) {
            fieldComponent.values.splice(index, 1);
        }

        // Renumber the remaining inputs
        const remainingInputs = fieldContainer.querySelectorAll('.input-group');
        remainingInputs.forEach((input, idx) => {
            input.dataset.index = idx;

            // Update the input ID
            const fieldInput = input.querySelector('input, textarea, select');
            if (fieldInput) {
                fieldInput.id = `{{${fieldKey}_input_${idx}}}`;
            }

            // Update remove button index if present
            const removeBtn = input.querySelector('.remove-field');
            if (removeBtn) {
                removeBtn.dataset.index = idx;
            }
        });

        // Update wildcards after removing a field
        updateWildcards();
    }

    // Function to update an existing field preview
    function updateFieldPreview(field, fieldId) {
        const fieldItem = document.querySelector(`.preview-input-component[data-field-id="${fieldId}"]`);
        if (!fieldItem) return;

        // Update the label and description
        const labelSpan = fieldItem.querySelector('label span');
        const descriptionDiv = fieldItem.querySelector('label .small');

        labelSpan.textContent = field.label;
        descriptionDiv.textContent = field.description;

        // Update field container
        const fieldInputs = fieldItem.querySelector('.field-inputs');
        fieldInputs.dataset.fieldKey = field.key;

        // Clear existing fields and rebuild them
        fieldInputs.innerHTML = '';

        // Add the main input
        const mainInputHtml = createInputHtml(field, 0, field.defaultValue);
        fieldInputs.insertAdjacentHTML('beforeend', mainInputHtml);

        // Add any additional fields if this is multi field
        if (field.isMulti && field.values && field.values.length > 0) {
            field.values.forEach((value, idx) => {
                // Skip the first one as it's already there
                if (idx === 0) return;

                const additionalInput = createInputHtml(field, idx, value, true);
                fieldInputs.insertAdjacentHTML('beforeend', additionalInput);
            });
        }

        // Set up buttons
        setupMultiButtons(fieldItem, field);

        // Update input types if needed
        const inputs = fieldInputs.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            updateInputType(input, field);
        });
    }

    // Helper function to update input type
    function updateInputType(input, field) {
        const inputGroup = input.closest('.input-group');
        
        if (!inputGroup) return;
        
        // Completely rebuild the input based on field type
        inputGroup.innerHTML = '';
        
        const index = parseInt(inputGroup.dataset.index || 0);
        const value = input.value || field.values?.[index] || '';
        
        // Get the add/remove button HTML with appropriate styling for textareas
        let buttonHtml = '';
        if (field.isMulti) {
            const buttonStyle = field.type === 'textarea' ? ' style="height: 100%;"' : '';
            
            if (index === 0) {
                buttonHtml = `
                    <div class="input-group-append" style="${field.type === 'textarea' ? 'display: flex;' : ''}">
                        <button type="button" class="btn btn-sm btn-success add-field" data-field-key="${field.key}"${buttonStyle}>
                            <i class="bi bi-plus-circle"></i>
                        </button>
                    </div>
                `;
            } else {
                buttonHtml = `
                    <div class="input-group-append" style="${field.type === 'textarea' ? 'display: flex;' : ''}">
                        <button type="button" class="btn btn-sm btn-danger remove-field" data-field-key="${field.key}" data-index="${index}"${buttonStyle}>
                            <i class="bi bi-dash-circle"></i>
                        </button>
                    </div>
                `;
            }
        }
        
        // Create the appropriate input based on field type
        const inputId = `{{${field.key}_input_${index}}}`;
        
        if (field.type === 'textarea') {
            // Set flex-wrap: nowrap to prevent button wrapping below the textarea
            inputGroup.style.flexWrap = 'nowrap';
            
            inputGroup.innerHTML = `
                <textarea autocomplete="off" id="${inputId}" class="form-control" rows="3">${value}</textarea>
                ${buttonHtml}
            `;
        } else if (field.type === 'select') {
            // Create select options
            const options = field.data?.values || [];
            let optionsHtml = '';
            
            // Add placeholder option
            optionsHtml += `<option value="" ${!value ? 'selected' : ''}>Select an option</option>`;
            
            // Add each option
            options.forEach(option => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const isSelected = value === optionValue;
                
                optionsHtml += `<option value="${optionValue}" ${isSelected ? 'selected' : ''}>${optionLabel}</option>`;
            });
            
            inputGroup.innerHTML = `
                <select id="${inputId}" class="form-control">
                    ${optionsHtml}
                </select>
                ${buttonHtml}
            `;
        } else if (field.type === 'checkbox' || field.type === 'enhancedCheckbox') {
            // Get positive/negative values, defaulting to true/false
            const positiveValue = field.positiveValue || 'true';
            const negativeValue = field.negativeValue || 'false';
            const isChecked = value === positiveValue;
            
            inputGroup.innerHTML = `
                <div class="form-check ps-0 d-flex align-items-center">
                    <input type="checkbox" id="${inputId}" class="form-check-input ms-2" 
                        ${isChecked ? 'checked' : ''} 
                        data-positive-value="${positiveValue}" 
                        data-negative-value="${negativeValue}">
                    <label class="form-check-label ms-2" for="${inputId}">
                        ${field.description || ''}
                    </label>
                </div>
                <div class="input-group-append ms-auto">
                    ${buttonHtml}
                </div>
            `;
        } else if (field.type === 'datetime') {
            inputGroup.innerHTML = `
                <input type="datetime-local" id="${inputId}" class="form-control" value="${value}">
                ${buttonHtml}
            `;
        } else if (field.type === 'date') {
            inputGroup.innerHTML = `
                <input type="date" id="${inputId}" class="form-control" value="${value}">
                ${buttonHtml}
            `;
        } else if (field.type === 'time') {
            inputGroup.innerHTML = `
                <input type="time" id="${inputId}" class="form-control" value="${value}">
                ${buttonHtml}
            `;
        } else if (field.type === 'url') {
            inputGroup.innerHTML = `
                <span class="input-group-text">
                    <i class="bi bi-link"></i>
                </span>
                <input type="url" id="${inputId}" class="form-control" value="${value}" placeholder="https://example.com">
                ${buttonHtml}
            `;
        } else {
            inputGroup.innerHTML = `
                <input type="text" id="${inputId}" class="form-control" value="${value}">
                ${buttonHtml}
            `;
        }
        
        // Re-attach event listeners
        if (field.isMulti) {
            const addBtn = inputGroup.querySelector('.add-field');
            if (addBtn) {
                addBtn.addEventListener('click', handleAddField);
            }
            
            const removeBtn = inputGroup.querySelector('.remove-field');
            if (removeBtn) {
                removeBtn.addEventListener('click', handleRemoveField);
            }
        }
    }

    // Function to update wildcards list
    function updateWildcards() {
        const wildcardList = document.getElementById('wildcard-list');
        if (!wildcardList) return;

        // Get all component keys
        const wildcards = getComponentWildcards();

        // Clear existing wildcards
        wildcardList.innerHTML = '';

        // Add wildcards to the list
        wildcards.forEach(key => {
            const wildcardText = `{${key}}`;
            const isDatasetWildcard = key.startsWith('@START_') || key.startsWith('@END_');
            const wildcardElem = document.createElement('span');
            wildcardElem.className = `wildcard ${isDatasetWildcard ? 'wildcard-dataset wildcard-danger' : ''}`;
            wildcardElem.dataset.wildcard = key;

            wildcardElem.innerHTML = `
                ${wildcardText}
                <button class="copy-btn" data-clipboard="${wildcardText}" title="Copy to clipboard">
                    <i class="bi bi-clipboard"></i>
                </button>
            `;

            // Add copy button functionality
            const copyBtn = wildcardElem.querySelector('.copy-btn');
            copyBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const text = this.dataset.clipboard;
                
                // Cross-browser clipboard copy function
                function copyToClipboard(text) {
                    // Modern approach - Clipboard API (not supported in all browsers)
                    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                        return navigator.clipboard.writeText(text);
                    }
                    
                    // Fallback approach - Create a temporary element and copy from it
                    return new Promise((resolve, reject) => {
                        try {
                            const textarea = document.createElement('textarea');
                            textarea.value = text;
                            textarea.style.position = 'fixed';  // Avoid scrolling to bottom
                            textarea.style.opacity = '0';
                            document.body.appendChild(textarea);
                            textarea.select();
                            
                            // Execute the copy command
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textarea);
                            
                            if (successful) {
                                resolve();
                            } else {
                                reject(new Error('Unable to copy'));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    });
                }
                
                // Use the helper function with proper error handling
                copyToClipboard(text)
                    .then(() => {
                        // Show success indicator
                        const originalIcon = this.innerHTML;
                        this.innerHTML = '<i class="bi bi-check-lg"></i>';
                        setTimeout(() => {
                            this.innerHTML = originalIcon;
                        }, 1000);
                    })
                    .catch(err => {
                        console.error('Copy failed:', err);
                        alert('Could not copy to clipboard. Please try selecting and copying manually.');
                    });
            });

            wildcardList.appendChild(wildcardElem);
        });

        // Check which wildcards are used in the template
        checkUsedWildcards();
    }

    // Function to check which wildcards are used in the template
    function checkUsedWildcards() {
        const templateInput = document.getElementById('formTemplate');
        if (!templateInput) return;

        const templateText = templateInput.value;
        const wildcardElements = document.querySelectorAll('.wildcard');

        wildcardElements.forEach(element => {
            const key = element.dataset.wildcard;
            const isUsed = templateText.includes(`{${key}}`);

            if (isUsed) {
                element.classList.add('wildcard-used');
                if (element.classList.contains('wildcard-dataset')) {
                    element.classList.remove('wildcard-danger');
                }
            } else {
                element.classList.remove('wildcard-used');
                if (element.classList.contains('wildcard-dataset')) {
                    element.classList.add('wildcard-danger');
                }
            }
        });

        // Update save button state
        updateSaveButtonState();
    }

    // Function to update save button state
    function updateSaveButtonState() {
        const saveButton = document.getElementById('saveFormButton');
        if (!saveButton) return;

        const datasetWildcards = document.querySelectorAll('.wildcard-dataset');
        const unusedDatasetWildcards = document.querySelectorAll('.wildcard-dataset.wildcard-danger');

        // Only disable if there are dataset wildcards and some are unused
        if (datasetWildcards.length > 0 && unusedDatasetWildcards.length > 0) {
            saveButton.disabled = true;
            saveButton.title = 'All dataset wildcards must be used in the template before saving';
        } else {
            saveButton.disabled = false;
            saveButton.title = 'Save form';
        }
    }

    // Function to get component wildcards
    function getComponentWildcards() {
        const wildcards = [];

        formState.components.forEach(component => {
            // Skip the submit button
            if (component.type === 'button' && component.action === 'submit') {
                return;
            }

            if (component.isMulti) {
                // For multi fields, add special start/end wildcards
                wildcards.push(`@START_${component.key}@`);
                wildcards.push(`@END_${component.key}@`);

                // IMPORTANT: Also add the field key itself as a wildcard to use within the START/END block
                wildcards.push(component.key);
            } else {
                // For regular components, just add the key
                wildcards.push(component.key);
            }
        });

        return wildcards;
    }

    // --- MODIFICATION START: Add drag-and-drop reordering functionality ---
    function initializeDragAndDrop() {
        // First, check if SortableJS is available (we'll use this library if it exists)
        if (typeof Sortable !== 'undefined') {
            // Use SortableJS for drag-and-drop functionality
            initializeWithSortableJS();
        } else {
            // Fallback to HTML5 drag and drop API
            initializeWithHTML5DragAndDrop();
        }
    }

    function initializeWithSortableJS() {
        // Initialize Sortable on the form items list
        Sortable.create(formItemsList, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onEnd: function(evt) {
                // Update the formState.components array to match the new order
                updateComponentsOrder();
            }
        });
    }

    function initializeWithHTML5DragAndDrop() {
        // If SortableJS is not available, use HTML5 Drag and Drop API
        const fieldItems = formItemsList.querySelectorAll('.preview-input-component');
        
        // Add draggable attributes and event listeners to each field
        fieldItems.forEach(item => {
            setupDraggableField(item);
        });
        
        // Make the container a drop target
        formItemsList.addEventListener('dragover', function(e) {
            e.preventDefault(); // Allow dropping
            const afterElement = getDragAfterElement(this, e.clientY);
            const draggable = document.querySelector('.dragging');
            
            if (afterElement == null) {
                this.appendChild(draggable);
            } else {
                this.insertBefore(draggable, afterElement);
            }
        });
        
        formItemsList.addEventListener('dragend', function(e) {
            // Update the formState.components array to match the new order
            updateComponentsOrder();
        });
    }
    
    // Helper function to make a field draggable
    function setupDraggableField(item) {
        item.setAttribute('draggable', true);
        
        const dragHandle = item.querySelector('.drag-handle');
        
        // Only start drag when clicking on the drag handle
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', function() {
                item.setAttribute('draggable', true);
            });
            
            item.addEventListener('mouseup', function() {
                item.setAttribute('draggable', false);
            });
        }
        
        item.addEventListener('dragstart', function(e) {
            this.classList.add('dragging');
            // Set a ghost drag image (optional)
            const ghostElement = this.cloneNode(true);
            ghostElement.style.position = 'absolute';
            ghostElement.style.opacity = '0.5';
            ghostElement.style.top = '-1000px';
            document.body.appendChild(ghostElement);
            e.dataTransfer.setDragImage(ghostElement, 0, 0);
            setTimeout(() => {
                document.body.removeChild(ghostElement);
            }, 0);
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    }
    
    // Get the element after which to drop the draggable element
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.preview-input-component:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Update the components array to match the new DOM order
    function updateComponentsOrder() {
        // Get the current order of fields in the DOM
        const fieldItems = formItemsList.querySelectorAll('.preview-input-component');
        const newOrder = [];
        
        // Create a new array of components in the current DOM order
        fieldItems.forEach(item => {
            const fieldId = item.dataset.fieldId;
            const component = formState.components.find(c => c.id === fieldId);
            if (component) {
                newOrder.push(component);
            }
        });
        
        // Get the submit button if it exists
        const submitButton = formState.components.find(c => c.type === 'button' && c.action === 'submit');
        
        // Update formState.components with the new order
        formState.components = newOrder;
        
        // Add the submit button back at the end if it existed
        if (submitButton) {
            formState.components.push(submitButton);
        }
        
        // Update wildcards after reordering
        updateWildcards();
    }
    
    // Function to set up any newly added fields as draggable
    function setupNewField(field) {
        const fieldItem = document.querySelector(`.preview-input-component[data-field-id="${field.id}"]`);
        if (fieldItem) {
            setupDraggableField(fieldItem);
        }
    }
    
    // Override addFieldToPreview to setup draggable behavior for new fields
    const originalAddFieldToPreview = addFieldToPreview;
    addFieldToPreview = function(field) {
        originalAddFieldToPreview(field);
        setupNewField(field);
    };
    // --- MODIFICATION END ---

    // Initialize form builder
    function init() {
        // Only set up the field type buttons if we're using the basic builder
        if (isBasicBuilder) {
            setupFieldTypeButtons();

            // Add the fixed submit button
            addSubmitButtonToForm();
            
            // --- MODIFICATION START: Initialize drag and drop functionality ---
            initializeDragAndDrop();
            // --- MODIFICATION END ---
        }

        // Set up template input listener
        const templateInput = document.getElementById('formTemplate');
        if (templateInput) {
            templateInput.addEventListener('input', checkUsedWildcards);
        }

        // Set up save button
        const saveButton = document.getElementById('saveFormButton');
        if (saveButton) {
            saveButton.addEventListener('click', saveForm);
        }

        // Set up form style radio buttons (select the saved style)
        if (typeof existingFormStyle !== 'undefined' && existingFormStyle) {
            const styleRadio = document.querySelector(`input[name="formStyle"][value="${existingFormStyle}"]`);
            if (styleRadio) {
                styleRadio.checked = true;
            }
        }

        // Set up Template Title toggle
        const templateTitleToggle = document.getElementById('templateTitleToggle');
        const templateTitleSection = document.getElementById('templateTitleSection');

        if (templateTitleToggle) {
            // Set up toggle event listener
            templateTitleToggle.addEventListener('change', function() {
                templateTitleSection.style.display = this.checked ? 'block' : 'none';
            });
        }

        // Set up Public Directory toggle
        const templatePublicToggle = document.getElementById('templatePublicToggle');
        const templatePublicSection = document.getElementById('templatePublicSection');

        if (templatePublicToggle) {
            // Initialize from PHP value
            if (typeof enablePublicLinkPHP !== 'undefined') {
                templatePublicToggle.checked = enablePublicLinkPHP;
                templatePublicSection.style.display = enablePublicLinkPHP ? 'block' : 'none';
            }
            
            // Set up toggle event listener
            templatePublicToggle.addEventListener('change', function() {
                templatePublicSection.style.display = this.checked ? 'block' : 'none';
            });
        }

        // Set up Template Link toggle
        const templateLinkToggle = document.getElementById('templateLinkToggle');
        const templateLinkSection = document.getElementById('templateLinkSection');

        if (templateLinkToggle) {
            // Set up toggle event listener
            templateLinkToggle.addEventListener('change', function() {
                templateLinkSection.style.display = this.checked ? 'block' : 'none';
            });
        }

        // Handle form width slider
        document.getElementById('formWidthSlider')?.addEventListener('input', function() {
            document.getElementById('formWidthInput').value = this.value;
        });

        document.getElementById('formWidthInput')?.addEventListener('input', function() {
            document.getElementById('formWidthSlider').value = this.value;
        });

        // Initial update of wildcards
        updateWildcards();
    }

    // Function to collect current field values
    function collectFieldValues() {
        // Iterate through all components and collect their values
        formState.components.forEach(component => {
            // Skip the submit button
            if (component.type === 'button' && component.action === 'submit') {
                return;
            }
    
            if (component.isMulti) {
                // Find all inputs for this component
                const fieldContainer = document.querySelector(`.field-inputs[data-field-key="${component.key}"]`);
                if (!fieldContainer) return;
    
                const inputGroups = fieldContainer.querySelectorAll('.input-group');
                component.values = [];
    
                inputGroups.forEach((group, idx) => {
                    const input = group.querySelector('input, textarea, select');
                    if (input) {
                        if (input.type === 'checkbox') {
                            // For checkboxes, use the appropriate positive/negative value
                            component.values[idx] = input.checked ? 
                                input.dataset.positiveValue || 'true' : 
                                input.dataset.negativeValue || 'false';
                        } else {
                            component.values[idx] = input.value;
                        }
                    }
                });
            }
        });
    }

    // Function to save the form
    function saveForm() {
        // Collect current field values before saving
        collectFieldValues();

        // Ensure submit button is the last component
        ensureSubmitButtonIsLast();

        // Get form data
        const formNameInput = document.getElementById('formName');
        const templateInput = document.getElementById('formTemplate');
        const titleToggle = document.getElementById('templateTitleToggle');
        const titleInput = document.getElementById('templateTitle');
        const linkToggle = document.getElementById('templateLinkToggle');
        const publicToggle = document.getElementById('templatePublicToggle');
        const linkInput = document.getElementById('templateLink');
        const formStyleRadios = document.querySelectorAll('input[name="formStyle"]');
        const formWidthInput = document.getElementById('formWidthInput');

        // Prepare form data
        const formName = formNameInput ? formNameInput.value : formState.title;
        const template = templateInput ? templateInput.value : '';
        const enableTitle = titleToggle ? titleToggle.checked : false;
        const titleTemplate = enableTitle && titleInput ? titleInput.value : '';
        const enableLink = linkToggle ? linkToggle.checked : false;
        const linkTemplate = enableLink && linkInput ? linkInput.value : '';
        const enablePublic = publicToggle ? publicToggle.checked : false;

        // Get selected form style
        let formStyle = 'default';
        formStyleRadios.forEach(radio => {
            if (radio.checked) {
                formStyle = radio.value;
            }
        });

        // Get form width
        const formWidth = formWidthInput ? parseInt(formWidthInput.value, 10) : 800;

        // Prepare the form schema for submission
        const formSchema = {
            ...formState,
            title: formName
        };

        // Check if this is an edit operation
        const isEditMode = typeof window.isEditMode !== 'undefined' && window.isEditMode;
        const editingForm = document.getElementById('editingForm')?.value;

        // Send the request to save the form
        fetch('ajax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'schema',
                schema: formSchema,
                template: template,
                templateTitle: titleTemplate,
                templateLink: linkTemplate,
                enableTemplateTitle: enableTitle,
                enableTemplateLink: enableLink,
                enablePublicLink: enablePublic,
                formName: formName,
                formWidth: formWidth,
                formStyle: formStyle,
                editMode: isEditMode,
                editingForm: editingForm,
                builder: 'basic'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error saving form:', data.error);
                alert('Error saving form: ' + data.error);
                return;
            }

            // Extract form ID and show success message
            let formId = data.formId || data.filename.replace('forms/', '').replace('_schema.json', '');

            // Make sure we don't include any directory paths in the formId
            if (formId.includes('/') || formId.includes('\\')) {
                formId = formId.split(/[\/\\]/).pop();
            }

            const shareUrl = siteURL + `form?f=${formId}`;

            // Update UI with success info
            const shareableLink = document.getElementById('shareable-link');
            const goToFormButton = document.getElementById('go-to-form-button');
            const successMessage = document.getElementById('success-message');

            if (shareableLink) shareableLink.textContent = shareUrl;
            if (shareableLink) shareableLink.href = shareUrl;
            if (goToFormButton) goToFormButton.href = shareUrl;
            if (successMessage) successMessage.style.display = 'block';
        })
        .catch(error => {
            console.error('Error saving form:', error);
            alert('An error occurred while saving the form. Please try again.');
        });
    }

    document.addEventListener('change', function(event) {
        if (event.target.type === 'checkbox' && event.target.dataset.positiveValue) {
            // We don't need to update any value indicator anymore
            // The checkbox itself handles the value via its checked state
        }
    });

    // Expose the form state and functions
    window.BasicFormBuilder = {
        getFormSchema: () => formState,
        addField: openFieldModal
    };

    // Initialize when the document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();