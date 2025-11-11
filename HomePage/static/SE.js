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

// Function to toggle the navigation menu
function toggleNav() {
  const nav = document.querySelector('nav');
  nav.classList.toggle('open'); // Toggle the 'open' class on the nav element
}

// Add event listener to each link to close the menu when clicked
const navLinks = document.querySelectorAll('nav ul li a'); // Select all the nav links

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const nav = document.querySelector('nav');
    nav.classList.remove('open'); // Close the menu when a link is clicked
  });
});

// Close the menu when the user scrolls
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav.classList.contains('open')) {
    nav.classList.remove('open'); // Close the menu if the user scrolls
  }
});

// Close the menu when the user clicks or touches anywhere outside the nav
document.addEventListener('click', (e) => {
  const nav = document.querySelector('nav');
  if (!nav.contains(e.target) && nav.classList.contains('open')) {
    nav.classList.remove('open'); // Close the menu if clicked outside
  }
});

// Prevent the click event from closing the menu when clicking inside the nav
document.querySelector('nav').addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent the click from propagating to the document listener
});
