let lastScrollTop = 0;
const navbar = document.querySelector("nav");

// Ensure navbar is visible on page load
navbar.classList.add("visible");

window.addEventListener("scroll", function () {
  let scrollTop = window.scrollY || document.documentElement.scrollTop;

  if (scrollTop === 0) {
    // Always show navbar at the top
    navbar.classList.add("visible");
  } else if (scrollTop < lastScrollTop) {
    // Show navbar when scrolling up
    navbar.classList.add("visible");
  } else {
    // Hide navbar when scrolling down
    navbar.classList.remove("visible");
  }

  lastScrollTop = scrollTop;
});
