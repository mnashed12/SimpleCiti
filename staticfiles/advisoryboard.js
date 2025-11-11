function toggleText(button) {
    const hiddenText = button.previousElementSibling; // Gets the previous sibling (hidden-text span)
    const isHidden = hiddenText.style.display === "none" || hiddenText.style.display === "";

    if (isHidden) {
        // Show the hidden text with animation
        hiddenText.style.display = "block"; // Initially set to block so it can animate
        let height = 0;
        hiddenText.style.height = "0px"; // Start with height 0
        let targetHeight = hiddenText.scrollHeight; // Get the full height of the content

        // Use requestAnimationFrame to animate
        function animate() {
            height += 30; // Increase the height gradually
            hiddenText.style.height = height + "px";
            hiddenText.style.opacity = height / targetHeight; // Adjust opacity as it expands

            if (height < targetHeight) {
                requestAnimationFrame(animate); // Keep animating until it reaches target height
            } else {
                button.innerText = "(Read Less)"; // Change the button text after the animation
            }
        }

        // Start the animation
        requestAnimationFrame(animate);
    } else {
        // Hide the text and reset the button immediately
        hiddenText.style.height = "0px";
        hiddenText.style.opacity = "0";
        hiddenText.style.display = "none"; // Hide the content immediately after collapsing
        button.innerText = "(Read More)";
    }
}

function toggleNav() {
  const nav = document.getElementById('mobileNav');
  const hamburger = document.querySelector('.hamburger');

  nav.classList.toggle('open');
  hamburger.style.display = nav.classList.contains('open') ? 'none' : 'block';
}
