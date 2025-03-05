document.addEventListener("wheel", (event) => {
  event.preventDefault(); // Prevents default scrolling
  let sections = document.querySelectorAll("section");
  let currentSection = Math.round(window.scrollY / window.innerHeight);
  
  if (event.deltaY > 0 && currentSection < sections.length - 1) {
    window.scrollTo({ top: (currentSection + 1) * window.innerHeight, behavior: "smooth" });
  } else if (event.deltaY < 0 && currentSection > 0) {
    window.scrollTo({ top: (currentSection - 1) * window.innerHeight, behavior: "smooth" });
  }
}, { passive: false });



// Function to handle item selection for each section
function handleSelection(event, section, inputId) {
    // Only proceed if the clicked element is a checkbox inside the appropriate section
    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
        // Get all the checkboxes within the current section
        const checkboxes = document.querySelectorAll(`.${section} input[type="checkbox"]`);

        // Uncheck all other checkboxes in the section
        checkboxes.forEach(checkbox => {
            if (checkbox !== event.target) {
                checkbox.checked = false; // Uncheck the checkbox
            }
        });

        // Get the <li> element that contains the clicked checkbox
        const listItem = event.target.closest('li');
        
        // Get the selected text before the colon (e.g., "Land" from "Land: CRE")
        const selectedText = listItem.textContent.split(':')[0];
        
        // Update the corresponding input field in the form using the inputId
        const formInput = document.getElementById(inputId);
        formInput.value = event.target.checked ? selectedText : ''; // If checked, update with text, else clear
    }
}

// Add event listeners to each section for checkboxes
document.querySelector('.asset-types').addEventListener('click', function(event) {
    handleSelection(event, 'asset-types', 'asset-type');
});

document.querySelector('.report-extra').addEventListener('click', function(event) {
    handleSelection(event, 'report-extra', 'client-type');
});

document.querySelector('.report-types').addEventListener('click', function(event) {
    handleSelection(event, 'report-types', 'report-type');
});

document.querySelector('.right-section').addEventListener('click', function(event) {
    handleSelection(event, 'right-section', 'use-type');
});




document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    // Add event listeners to checkboxes for individual selection
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateCheckboxLabel(checkbox);
        });
    });
});

function updateCheckboxLabel(checkbox) {
    const label = checkbox.nextElementSibling;

    // Remove bold effect from all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.nextElementSibling.style.fontWeight = 'normal';
    });

    // Apply bold effect only to the selected checkbox
    if (checkbox.checked) {
        label.style.fontWeight = 'bold';
    }
}
