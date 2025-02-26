document.getElementById("mainCircle").addEventListener("click", function() {
    document.querySelector(".container").classList.toggle("active");
});

document.addEventListener("DOMContentLoaded", function() {
    const hoverImage = document.getElementById("hoverImage");

    // Create a function to show hover image for any circle
    function showHoverImage(subcircleId, imageSrc) {
        const subcircle = document.getElementById(subcircleId);
        const hoverImageElement = document.getElementById("hoverImage");

        subcircle.addEventListener("click", function(event) {
            event.stopPropagation(); // Prevent closing when clicking the same image again

            if (hoverImageElement) {
                hoverImageElement.style.display = "block"; // Make the image visible
                hoverImageElement.querySelector('img').src = imageSrc; // Set the correct image source
                hoverImageElement.classList.add("visible"); // Add the "visible" class to trigger the CSS transition
            } else {
                console.log("hoverImage not found!");
            }
        });
    }

    // Add event listeners for all subcircles to show the respective images
    showHoverImage('subcircle1', '/static/SimpleEquitiesInfo.png'); 
    showHoverImage('subcircle2', '/static/NovelEquitiesInfo.png'); 
    showHoverImage('subcircle3', '/static/SimpleAdvisoryInfo.png'); 

    showHoverImage('subcircle4', '/static/SimpleCoreInfo.png'); 
    showHoverImage('subcircle5', '/static/SimpleQOZInfo.png'); 
    showHoverImage('subcircle6', '/static/SimpleAXCSInfo.png'); 

    showHoverImage('subcircle7', '/static/SimpleManageInfo.png'); 
    showHoverImage('subcircle8', '/static/SimpleBricksInfo.png'); 
    showHoverImage('subcircle9', '/static/SimpleAppraisalInfo.png'); 
    showHoverImage('subcircle10', '/static/SimpleLendInfo.png'); 
    showHoverImage('subcircle11', '/static/SimpleSpacesInfo.png'); 
    showHoverImage('subcircle12', '/static/SimpleRealtyAdvisorsInfo.png'); 

    showHoverImage('subcircle13', '/static/FortMorganFundingInfo.png'); 
    showHoverImage('subcircle14', '/static/FortMorganCapitalInfo.png'); 
    showHoverImage('subcircle15', '/static/FortMorganLiensInfo.png'); 
    showHoverImage('subcircle16', '/static/FortMorganFinancialInfo.png'); 
    showHoverImage('subcircle17', '/static/CitiInjuryLawInfo.png'); 

    // Hide the image if clicked outside the hoverImage or the subcircle
    document.addEventListener("click", function(event) {
        if (!hoverImage.contains(event.target) && !event.target.closest('.circle')) {
            hoverImage.classList.remove("visible"); // Remove the "visible" class to hide the image
        }
    });
});

