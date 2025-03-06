// Get all the vertical navbar links
const navbarLinks = document.querySelectorAll('.verticals-navbar a');
const herologos = document.querySelectorAll('.hero-subtitle img');

// Function to create the flashing red dot
function addRedDot(logo) {
    let dot = document.createElement("span");
    dot.classList.add("red-dot");
    logo.parentElement.style.position = "relative"; // Ensure relative positioning
    logo.parentElement.appendChild(dot);
}

// Function to remove all red dots
function removeRedDot() {
    document.querySelectorAll(".red-dot").forEach(dot => dot.remove());
}

// Function to adjust logo order in CSS Grid
function adjustLogoOrder(selectedLogos) {
    document.querySelectorAll('.logos-container .logo-item').forEach(logo => {
        if (selectedLogos.includes(logo.querySelector('img'))) {
            logo.style.order = "-1"; // Move selected logos to the top
        } else {
            logo.style.order = "0";  // Keep others in their normal position
        }
    });
}

// Function to reset all logo effects
function resetLogoEffects() {
    document.querySelectorAll('.logos-container img').forEach(logo => {
        logo.style.borderColor = "";
        logo.style.borderWidth = "";
        logo.style.opacity = "1"; // Reset opacity
    });

    removeRedDot();

    // Reset logo order
    document.querySelectorAll('.logos-container .logo-item').forEach(logo => {
        logo.style.order = "0"; // Restore default order
    });
}

// Add event listeners to each navbar link
navbarLinks.forEach(link => {
    link.addEventListener('mouseover', (event) => {
        const linkText = event.target.textContent.trim().toLowerCase();

        // Reset everything before applying new effects
        resetLogoEffects();

        const allLogos = document.querySelectorAll('.logos-container img');

        // Fade out all logos initially
        allLogos.forEach(logo => {
            logo.style.opacity = "0.6";
            logo.style.borderColor = "";
            logo.style.borderWidth = "";
        });

        let selectedLogos = [];

        // Function to apply the highlight effect
        function highlightLogos(logos) {
            logos.forEach(logo => {
                if (logo) {
                    logo.style.borderColor = "green";
                    logo.style.borderWidth = "6px"; // Thicker border
                    logo.style.opacity = "1"; // Keep fully visible
                    addRedDot(logo); // Add the flashing red dot
                    selectedLogos.push(logo);
                }
            });
        }

        // Determine which logos to highlight and move
        if (linkText === "borrower") {
            highlightLogos([document.querySelector('.logos-container img[alt*="SimpleLend"]')]);
        } 
        else if (linkText === "tenant") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleSpaces"]'),
                document.querySelector('.logos-container img[alt*="SimpleManage"]')
            ]);
        }
        else if (linkText === "property owner") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleAppraisal"]'),
                document.querySelector('.logos-container img[alt*="SimpleBricks"]'),
                document.querySelector('.logos-container img[alt*="SimpleRealtyAdvisors"]')
            ]);
        }
        else if (linkText === "injury claimant") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganInjuryLaw"]'),
            ]);
        }
        else if (linkText === "law firm") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganFunding"]'),
                document.querySelector('.logos-container img[alt*="FortMorganCapital"]'),
            ]);
        }
        else if (linkText === "medical provider") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganLiens"]'),
            ]);
        }

        // Adjust logo order in the grid
        adjustLogoOrder(selectedLogos);

        // Ensure the highlight effect lasts for 5 seconds before resetting
        setTimeout(resetLogoEffects, 10000);
    });
});


const heroImages = document.querySelectorAll('.hero-subtitle img');

heroImages.forEach(img => {
    img.addEventListener('mouseover', () => {
        const targetId = img.getAttribute('data-target');
        const accordionList = document.getElementById(targetId);
        const sectionContent = accordionList.querySelector('.section-content');

        // Apply hover styles dynamically
        accordionList.style.backgroundColor = 'white';
        accordionList.style.backgroundImage = 'none';
        sectionContent.style.opacity = '1';
        sectionContent.style.visibility = 'visible';
    });

    img.addEventListener('mouseout', () => {
        const targetId = img.getAttribute('data-target');
        const accordionList = document.getElementById(targetId);
        const sectionContent = accordionList.querySelector('.section-content');

        // Reset styles when mouse leaves
        accordionList.style.backgroundColor = '';
        accordionList.style.backgroundImage = '';
        sectionContent.style.opacity = '';
        sectionContent.style.visibility = '';
    });
});

