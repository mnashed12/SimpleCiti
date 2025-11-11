

document.addEventListener('DOMContentLoaded', function () {



    // Function to enforce single checkbox selection per section
    function handleSectionSelection(checkboxes, inputField, prefix) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // If this checkbox is checked, uncheck all others in the section
                if (this.checked) {
                    checkboxes.forEach(otherCheckbox => {
                        if (otherCheckbox !== this) {
                            otherCheckbox.checked = false;
                        }
                    });
                }

                // Update the selection in the input field
                updateSelection(checkboxes, inputField, prefix);
            });
        });
    }

    // Asset Type
    const assetTypeA = document.querySelectorAll('.asset-type .list:first-child input[type="checkbox"]');
    const assetTypeB = document.querySelectorAll('.asset-type .list:last-child input[type="checkbox"]');
    const assetTypeInput = document.getElementById('asset-type');

    // Apply the unchecking logic and input update for Asset Type
    handleSectionSelection([...assetTypeA, ...assetTypeB], assetTypeInput, "Asset Type");

    // Client Type
    const clientTypeCheckboxes = document.querySelectorAll('.client-type input[type="checkbox"]');
    const clientTypeInput = document.getElementById('client-type');

    // Apply the unchecking logic and input update for Client Type
    handleSectionSelection(clientTypeCheckboxes, clientTypeInput, "Client Type");

    // Use Type
    const useTypeA = document.querySelectorAll('.use-type .list:first-child input[type="checkbox"]');
    const useTypeB = document.querySelectorAll('.use-type .list:last-child input[type="checkbox"]');
    const useTypeInput = document.getElementById('use-type');

    // Apply the unchecking logic and input update for Use Type
    handleSectionSelection([...useTypeA, ...useTypeB], useTypeInput, "Use Type");

    // Report Type
    const reportTypeA = document.querySelectorAll('.report-type .list:first-child input[type="checkbox"]');
    const reportTypeB = document.querySelectorAll('.report-type .list:nth-child(2) input[type="checkbox"]');
    const reportTypeC = document.querySelectorAll('.report-type .list:nth-child(3) input[type="checkbox"]');
    const reportTypeInput = document.getElementById('report-type');

    // Apply the unchecking logic and input update for Report Type
    handleSectionSelection([...reportTypeA, ...reportTypeB, ...reportTypeC], reportTypeInput, "Report Type");

    // **Checkbox Visibility Toggle for All Sections**
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const inputId = this.getAttribute('data-input-id');
            const inputField = document.getElementById(inputId);

            // Display input field when a checkbox is selected
            if (this.checked) {
                inputField.style.display = 'block';
                inputField.value = this.value;  // Updates with the checkbox value
            } else {
                inputField.style.display = 'none';
                inputField.value = '';  // Clear input field when checkbox is unchecked
            }
        });
    });

});
document.addEventListener('DOMContentLoaded', function () {
    // Optional: Show/hide associated input field when radio is selected
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function () {
            const inputId = this.getAttribute('data-input-id');
            if (inputId) {
                const inputField = document.getElementById(inputId);

                // Hide all related input fields first
                document.querySelectorAll(`#${inputId}`).forEach(field => {
                    field.style.display = 'none';
                    field.value = '';
                });

                // Show and set value for the selected radio
                inputField.style.display = 'block';
                inputField.value = this.value;
            }
        });
    });
});


const steps = document.querySelectorAll('.form-step');
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((step, i) => step.classList.toggle('active', i === index));
  }

  document.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    });
  });

  document.querySelectorAll('.prev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  });

  showStep(currentStep);
  
 document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll("input[type='checkbox'][data-input-id]");

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        const group = checkbox.getAttribute("data-input-id");

        if (checkbox.checked) {
          document.querySelectorAll(`input[type='checkbox'][data-input-id='${group}']`).forEach(cb => {
            if (cb !== checkbox) cb.checked = false;
          });
        }
      });
    });
  });