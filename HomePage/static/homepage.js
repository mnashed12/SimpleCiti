const texts = [
    "Sample Text 4",
    "Sample Text 1",
    "Sample Text 2",
    "Sample Text 3"
];

let currentTextIndex = 0;
const textElement = document.getElementById("cycling-text");

function changeText() {
    // Apply fade-out effect
    textElement.classList.add("hidden");

    // Wait for the fade-out to finish (1s duration)
    setTimeout(() => {
        // Change the text
        currentTextIndex = (currentTextIndex + 1) % texts.length;
        textElement.textContent = texts[currentTextIndex];

        // Apply fade-in effect
        textElement.classList.remove("hidden");
    }, 1000); // Wait for 1 second (fade-out duration)
}

// Change text every 4 seconds
setInterval(changeText, 8000);

// Initial change on page load
changeText();


// Get all the vertical navbar links
const navbarLinks = document.querySelectorAll('.verticals-navbar a');
let timeoutId = null; // Store timeout reference
let activeLink = null; // Track the currently active navbar link

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

    activeLink = null; // Reset active state
}

// Add event listeners to each navbar link
navbarLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior

        const linkText = event.target.textContent.trim().toLowerCase();

        // If the same link is clicked again, reset everything
        if (activeLink === link) {
            resetLogoEffects();
            clearTimeout(timeoutId);
            return;
        }

        // Immediately reset everything before applying new effects
        clearTimeout(timeoutId);
        resetLogoEffects();

        activeLink = link; // Set the clicked link as active

        const allLogos = document.querySelectorAll('.logos-container img');

        // Reset all logos before applying new styles
        allLogos.forEach(logo => {
            logo.style.opacity = "0.6"; // Fade out all logos
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
        if (linkText === "i'm a borrower") {
            highlightLogos([document.querySelector('.logos-container img[alt*="SimpleLend"]')]);
        } 
        else if (linkText === "i'm an occupant") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleSpaces"]'),
                document.querySelector('.logos-container img[alt*="SimpleManage"]')
            ]);
        }
        else if (linkText === "i'm an owner") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleAppraisal"]'),
                document.querySelector('.logos-container img[alt*="SimpleBricks"]'),
                document.querySelector('.logos-container img[alt*="SimpleRealtyAdvisors"]')
            ]);
        }
        else if (linkText === "i'm an injury claimant") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganInjuryLaw"]'),
            ]);
        }
        else if (linkText === "i'm a law firm") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganFunding"]'),
                document.querySelector('.logos-container img[alt*="FortMorganCapital"]'),
            ]);
        }
        else if (linkText === "i'm a medical provider") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganLiens"]'),
            ]);
        }

        // Adjust logo order in the grid
        adjustLogoOrder(selectedLogos);

        // Set a new timeout to reset after 3 seconds
        timeoutId = setTimeout(() => {
            resetLogoEffects();
        }, 5000);
    });
});
