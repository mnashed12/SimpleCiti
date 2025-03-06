document.addEventListener('DOMContentLoaded', function () {

    // **Helper function to update input fields based on checkboxes selection**
    function updateSelection(checkboxes, inputField) {
        let selectedValue = '';
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedValue = checkbox.parentElement.textContent.trim();
            }
        });

        inputField.value = selectedValue;

        // Show the input field only if there's a selected value
        if (selectedValue) {
            inputField.style.display = 'block';
        } else {
            inputField.style.display = 'none';
        }
        
        // Uncheck all other checkboxes in the section, allowing only one selection
        checkboxes.forEach(checkbox => {
            if (checkbox.checked && checkbox !== event.target) {
                checkbox.checked = false; // Uncheck other selected checkboxes
            }
        });
    }

    // **Asset Type**
    const assetTypeA = document.querySelectorAll('.asset-type .list:first-child input[type="checkbox"]');
    const assetTypeB = document.querySelectorAll('.asset-type .list:last-child input[type="checkbox"]');
    const assetTypeInput = document.getElementById('asset-type');

    assetTypeA.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection([...assetTypeA, ...assetTypeB], assetTypeInput, event);
        });
    });

    assetTypeB.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection([...assetTypeA, ...assetTypeB], assetTypeInput, event);
        });
    });

    // **Client Type**
    const clientTypeCheckboxes = document.querySelectorAll('.client-type input[type="checkbox"]');
    const clientTypeInput = document.getElementById('client-type');

    clientTypeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection(clientTypeCheckboxes, clientTypeInput, event);
        });
    });

    // **Use Type**
    const useTypeA = document.querySelectorAll('.use-type .list:first-child input[type="checkbox"]');
    const useTypeB = document.querySelectorAll('.use-type .list:last-child input[type="checkbox"]');
    const useTypeInput = document.getElementById('use-type');

    useTypeA.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection([...useTypeA, ...useTypeB], useTypeInput, event);
        });
    });

    useTypeB.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection([...useTypeA, ...useTypeB], useTypeInput, event);
        });
    });

    // **Report Type**
    const reportTypeA = document.querySelectorAll('.report-type .list:first-child input[type="checkbox"]');
    const reportTypeB = document.querySelectorAll('.report-type .list:nth-child(2) input[type="checkbox"]');
    const reportTypeC = document.querySelectorAll('.report-type .list:nth-child(3) input[type="checkbox"]');
    const reportTypeInput = document.getElementById('report-type');

    reportTypeA.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection([...reportTypeA, ...reportTypeB, ...reportTypeC], reportTypeInput, event);
        });
    });

    reportTypeB.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection([...reportTypeA, ...reportTypeB, ...reportTypeC], reportTypeInput, event);
        });
    });

    reportTypeC.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            updateSelection([...reportTypeA, ...reportTypeB, ...reportTypeC], reportTypeInput, event);
        });
    });

    // **Checkbox Visibility Toggle for All Sections**
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const inputId = this.getAttribute('data-input-id');
            const inputField = document.getElementById(inputId);

            // Display input field when a checkbox is selected
            if (this.checked) {
                inputField.style.display = 'block';
                inputField.value = this.value;  // Update the input field value with the checkbox value
            } else {
                inputField.style.display = 'none';
                inputField.value = '';  // Clear input field when checkbox is unchecked
            }
        });
    });

});
