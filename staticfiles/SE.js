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
  
