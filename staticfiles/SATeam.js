document.querySelectorAll('.read-more-btn').forEach(button => {
    button.addEventListener('click', function() {
      const fullDescription = this.previousElementSibling; // Find the full description p tag
      const shortDescription = fullDescription.previousElementSibling; // Find the short description p tag
  
      // Toggle visibility of the full description and short description
      if (fullDescription.style.display === 'none') {
        fullDescription.style.display = 'block'; // Show the full description
        shortDescription.style.display = 'none'; // Hide the short description
        this.textContent = 'Read Less'; // Change button text to 'Read Less'
      } else {
        fullDescription.style.display = 'none'; // Hide the full description
        shortDescription.style.display = 'block'; // Show the short description
        this.textContent = 'Read More'; // Change button text back to 'Read More'
      }
    });
  });
  