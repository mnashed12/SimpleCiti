document.addEventListener("DOMContentLoaded", function () {
  const timelineItems = document.querySelectorAll('.timeline-item-wrapper');

  // Create a new IntersectionObserver to trigger animations when items are in view
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible'); // Add class to trigger animation
        observer.unobserve(entry.target); // Stop observing once the item is in view
      }
    });
  }, { threshold: 0.1 });

  // Observe each timeline item
  timelineItems.forEach(item => {
    observer.observe(item);
  });
});

function toggleNav() {
  const nav = document.getElementById('mobileNav');
  const hamburger = document.querySelector('.hamburger');

  nav.classList.toggle('open');
  hamburger.style.display = nav.classList.contains('open') ? 'none' : 'block';
}
