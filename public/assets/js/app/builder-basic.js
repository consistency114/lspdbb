/**
 * builder-basic.js - Simplified Form Builder
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
    const isBasicBuilder = urlParams.get('builder') === 'basic' || (typeof window.useBasicBuilder !== 'undefined' && window.useBasicBuilder);

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
        let fieldTypeLabel = 'Single Line';
        if (fieldType === 'textarea') fieldTypeLabel = 'Multi Line';
        if (fieldType === 'multilines') fieldTypeLabel = 'Multiple Lines';
        if (fieldType === 'datetime') fieldTypeLabel = 'Date & Time';
        if (fieldType === 'date') fieldTypeLabel = 'Date';
        if (fieldType === 'time') fieldTypeLabel = 'Time';
        if (fieldType === 'select') fieldTypeLabel = 'Dropdown';
        if (fieldType === 'checkbox') fieldTypeLabel = 'Checkbox';
        if (fieldType === 'url') fieldTypeLabel = 'Hyperlink';

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
                type: fieldType, // Keep the original field type
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

        // Create the submit button component data
        const submitButtonComponent = {
            type: 'button',
            label: 'Submit',
            key: 'submit',
            action: 'submit',
            theme: 'primary',
            id: 'submit_button',
            input: true,
            tableView: false,
            isSubmitButton: true  // Special flag to identify it as the submit button
        };

        // Make sure we only add the submit button if it doesn't already exist
        const existingSubmitButton = formState.components.find(c => c.type === 'button' && c.action === 'submit');
        if (!existingSubmitButton) {
            formState.components.push(submitButtonComponent);
        }
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

        // --- MODIFICATION START: Added pt-4 to button column for vertical alignment ---
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
            <div class="col-auto d-flex align-items-center pt-4"> <button type="button" class="btn btn-sm btn-outline-warning edit-field me-2" data-field-id="${field.id}"> <i class="bi bi-pencil-square"></i>
                </button>
                <div class="drag-handle" style="cursor: grab; color: var(--bs-secondary);"> <i class="bi bi-grip-vertical"></i>
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
                openFieldModal(field.type, field);
            }
        });

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

    // Helper to create input HTML
    function createInputHtml(field, index, value = '', isRemovable = false) {
        const inputId = `{{${field.key}_input_${index}}}`;
        const fieldValue = value || (index === 0 ? field.defaultValue : '');

        let addRemoveButton = '';
        if (field.isMulti) {
            if (isRemovable) {
                // Remove button for additional fields
                addRemoveButton = `
                    <button type="button" class="btn btn-sm btn-danger remove-field" data-field-key="${field.key}" data-index="${index}">
                        <i class="bi bi-dash-circle"></i>
                    </button>
                `;
            } else {
                // Add button for the first field
                addRemoveButton = `
                    <button type="button" class="btn btn-sm btn-success add-field" data-field-key="${field.key}">
                        <i class="bi bi-plus-circle"></i>
                    </button>
                `;
            }
        }

        // Different input types based on field type
        if (field.type === 'textarea') {
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <textarea autocomplete="off" id="${inputId}" class="form-control" rows="3">${fieldValue}</textarea>
                    <div class="input-group-append">
                        ${addRemoveButton}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="input-group mb-2" data-index="${index}">
                    <input autocomplete="off" type="${field.type === 'url' ? 'url' : 'text'}"
                           id="${inputId}" class="form-control" value="${fieldValue}">
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
            const fieldInput = input.querySelector('input, textarea');
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
        const inputs = fieldInputs.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            updateInputType(input, field);
        });
    }

    // Helper function to update input type
    function updateInputType(input, field) {
        const inputGroup = input.closest('.input-group');

        const shouldBeTextarea = field.type === 'textarea';
        const isCurrentlyTextarea = input.tagName === 'TEXTAREA';

        if (shouldBeTextarea !== isCurrentlyTextarea) {
            if (shouldBeTextarea) {
                const textarea = document.createElement('textarea');
                textarea.autocomplete = 'off';
                textarea.id = input.id;
                textarea.className = input.className;
                textarea.value = input.value;
                textarea.style = input.style;
                textarea.rows = 3;

                inputGroup.replaceChild(textarea, input);
            } else {
                const newInput = document.createElement('input');
                newInput.type = field.type === 'url' ? 'url' : 'text';
                newInput.autocomplete = 'off';
                newInput.id = input.id;
                newInput.className = input.className;
                newInput.value = input.value;
                newInput.style = input.style;

                inputGroup.replaceChild(newInput, input);
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
                navigator.clipboard.writeText(text).then(() => {
                    // Show success indicator
                    const originalIcon = this.innerHTML;
                    this.innerHTML = '<i class="bi bi-check-lg"></i>';
                    setTimeout(() => {
                        this.innerHTML = originalIcon;
                    }, 1000);
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

                // Also add some numbered keys for convenience within blocks
                /*
                wildcards.push(`${component.key}_value`);
                wildcards.push(`${component.key}_index`);
                wildcards.push(`${component.key}_count`);
                */
            } else {
                // For regular components, just add the key
                wildcards.push(component.key);
            }
        });

        return wildcards;
    }

    // Initialize form builder
    function init() {
        // Only set up the field type buttons if we're using the basic builder
        if (isBasicBuilder) {
            setupFieldTypeButtons();

            // Add the fixed submit button
            addSubmitButtonToForm();
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
                    const input = group.querySelector('input, textarea');
                    if (input) {
                        component.values[idx] = input.value;
                    }
                });
            }
        });
    }

    // Function to save the form
    function saveForm() {
        // Collect current field values before saving
        collectFieldValues();

        // Get form data
        const formNameInput = document.getElementById('formName');
        const templateInput = document.getElementById('formTemplate');
        const titleToggle = document.getElementById('templateTitleToggle');
        const titleInput = document.getElementById('templateTitle');
        const linkToggle = document.getElementById('templateLinkToggle');
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
                formName: formName,
                formWidth: formWidth,
                formStyle: formStyle,
                editMode: isEditMode,
                editingForm: editingForm
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

            const shareUrl = window.siteURL + `form?f=${formId}`;

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