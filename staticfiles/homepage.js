// Get all the vertical navbar links
const navbarLinks = document.querySelectorAll('.verticals-navbar a');
const herologos = document.querySelectorAll('.hero-subtitle img');


// Function to reset all logo effects
function resetLogoEffects() {
    document.querySelectorAll('.logos-container img').forEach(logo => {
        logo.style.borderColor = "";
        logo.style.borderWidth = "";
        logo.style.opacity = "1"; // Reset opacity
    });

    // Reset logo order
    document.querySelectorAll('.logos-container .logo-item').forEach(logo => {
        logo.style.order = "0"; // Restore default order
    });
}

// Add event listeners to each navbar link
navbarLinks.forEach(link => {
    link.addEventListener('mouseover', (event) => {
        const linkText = event.target.textContent.trim().toLowerCase();

        resetLogoEffects(); // Clear previous highlights

        const allLogos = document.querySelectorAll('.logos-container img');

        // Function to apply the highlight effect
        function highlightLogos(logos) {
            logos.forEach(logo => {
                if (logo) {
                    logo.style.borderColor = "darkblue";
                    logo.style.borderWidth = "6px"; // Thicker border
                    logo.style.opacity = "1"; // Fully visible
                }
            });
        }

        // Highlight logic based on text
        if (linkText === "borrowers") {
            highlightLogos([document.querySelector('.logos-container img[alt*="SimpleCREDIT"]'),
            document.querySelector('.logos-container img[alt*="SimpleCASH"]')
            ]);
        }
        else if (linkText === "tenants") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleManage"]'),
                document.querySelector('.logos-container img[alt*="SimpleSpaces"]')
            ]);
        }
        else if (linkText === "property owners") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleBricks"]'),
                document.querySelector('.logos-container img[alt*="SimpleRealtyAdvisors"]'),
                document.querySelector('.logos-container img[alt*="SimpleSpaces"]'),
                document.querySelector('.logos-container img[alt*="SimpleManage"]')
            ]);
        }
        else if (linkText === "injured claimants") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganFunding"]'),
            ]);
        }
        else if (linkText === "law/medical firms") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="FortMorganCapital"]'),
            ]);
        }
        else if (linkText === "1031 / tic") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleEXCHANGE"]'),
            ]);
        }
        else if (linkText === "oz / reit") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="SimpleSECURITIES"]'),
            ]);
        }
        else if (linkText === "ai labs") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="Simplecompute"]'),
            ]);
        }
        else if (linkText === "cloud operators") {
            highlightLogos([
                document.querySelector('.logos-container img[alt*="Simplecolo"]'),
            ]);
        }
    });

    link.addEventListener('mouseout', () => {
        resetLogoEffects();
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
        sectionContent.style.opacity = '1';
        sectionContent.style.visibility = '';
    });
});

document.addEventListener("DOMContentLoaded", function () {
    function toggleLayout() {
        const desktopLayout = document.querySelector(".accordian-main");
        const mobileLayout = document.querySelector(".mobile-hero");

        if (window.innerWidth <= 768) {
            desktopLayout.style.display = "none";
            mobileLayout.style.display = "flex";
        } else {
            desktopLayout.style.display = "flex"; // Ensure correct layout
            mobileLayout.style.display = "none";
        }
    }

    // Run on page load
    toggleLayout();

    // Run on window resize
    window.addEventListener("resize", toggleLayout);
});



document.addEventListener("DOMContentLoaded", function () {
  const overlayHeaders = document.querySelectorAll(".overlay-header");
  const mobileTitleHeaders = document.querySelectorAll(".mobile-title-header");

  function resetLogos(container) {
    const logos = container.querySelectorAll(".mobile-logos img");
    logos.forEach(logo => {
      logo.style.border = "none";
    });
  }

  function showMatchingLogos(headerText, container) {
    const logos = container.querySelectorAll(".mobile-logos img");
    const headerParts = headerText.toLowerCase().split("|").map(s => s.trim());

    logos.forEach(logo => {
      const altText = logo.alt.toLowerCase();
      const matches = headerParts.some(keyword => altText.includes(keyword));
      if (matches) {
        logo.style.border = "2px solid darkblue";
      }
    });
  }

  function showOverlay(container) {
    const overlay = container.querySelector(".overlay");
    overlay.style.display = "flex";
    overlay.style.opacity = "1";
  }

  function hideOverlay(container) {
    const overlay = container.querySelector(".overlay");
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }

  // When overlay-header is clicked → match logos
  overlayHeaders.forEach(header => {
    header.addEventListener("click", function (e) {
      e.stopPropagation(); // prevent global click from firing
      const headerText = this.textContent;
      const container = this.closest(".mobile-hero-item");

      resetLogos(container);
      showMatchingLogos(headerText, container);
      hideOverlay(container);
    });
  });

// ACCORDION VERSION - Mobile title headers work like accordion
mobileTitleHeaders.forEach(header => {
  header.addEventListener("click", function (e) {
    e.stopPropagation();
    const clickedContainer = this.closest(".mobile-hero-item");
    const clickedOverlay = clickedContainer.querySelector(".overlay");
    const allContainers = document.querySelectorAll(".mobile-hero-item");

    // Check if clicked section is currently open (overlay hidden)
    const isCurrentlyOpen = clickedOverlay.style.opacity === "0" ||
                           clickedOverlay.style.display === "none";

    // First, close all sections (show all overlays)
    allContainers.forEach(container => {
      resetLogos(container);
      showOverlay(container);
    });

    // Then, if the clicked section wasn't already open, open it (hide its overlay)
    if (!isCurrentlyOpen) {
      resetLogos(clickedContainer);
      hideOverlay(clickedContainer);
    }
  });
});


  // Click anywhere else → reset overlays and borders
  document.addEventListener("click", function (e) {
    if (
      !e.target.closest(".overlay-header") &&
      !e.target.closest(".mobile-title-header")
    ) {
      const containers = document.querySelectorAll(".mobile-hero-item");
      containers.forEach(container => {
        resetLogos(container);
        showOverlay(container);
      });
    }
  });

  // Optional: Remove borders on all logos when page loads
  document.querySelectorAll(".mobile-logos img").forEach(logo => {
    logo.style.border = "none";
  });
});








function toggleNav() {
  const nav = document.getElementById('mobileNav');
  const hamburger = document.querySelector('.hamburger');

  nav.classList.toggle('open');
  hamburger.style.display = nav.classList.contains('open') ? 'none' : 'block';
}

var nav6 = $('#change').children('.holder').each(function(i) {
    TweenLite.set(this, {rotation:30*i});
    }).end();

    var tl = new TimelineLite({paused:true});
    var nav = document.getElementById('change')

    var gorilla = gsap.to(nav, 60, {rotation:"360", ease:Linear.easeNone, repeat:-1});




    $(document).on("mouseenter", ".holder img", function() {
        tl.pause();
    }).on("mouseleave", ".holder a", function(){
        tl.play();
    });


    const draggable = draggable.create("#change", {
      type: "rotation",
      inertia: true,
      onDrag: function() {
      gorilla.pause
      }
    });

    function switchTab(index) {
        let section = document.querySelector(".tabbed-section");
        let tabs = section.querySelectorAll(".tab");
        let contents = section.querySelectorAll(".content");
        let slidingBackground = section.querySelector(".sliding-background");

        // Remove active class from all tabs and content
        tabs.forEach((tab, i) => {
            tab.classList.remove("active");
            contents[i].classList.remove("active");
        });

        // Add active class to clicked tab and corresponding content
        tabs[index].classList.add("active");
        contents[index].classList.add("active");

        // Calculate the position of the active tab and adjust the sliding background
        const activeTab = tabs[index];
        const tabWidth = activeTab.offsetWidth;
        const tabLeft = activeTab.offsetLeft;

        // Slide the background under the active tab
        slidingBackground.style.left = `${tabLeft}px`;
        slidingBackground.style.width = `${tabWidth}px`;
    }

  document.addEventListener('DOMContentLoaded', () => {
    // Animate the post-nav section
    const postNav = document.querySelector('.post-nav');
    if (postNav) {
      postNav.classList.add('animate');
      setTimeout(() => {
        postNav.classList.add('fade-in-up');
      }, 200); // small delay to trigger transition
    }

    // Animate the company logos with delay
    const companies = document.querySelectorAll('.company');
    companies.forEach((company, index) => {
      company.classList.add('animate');
      setTimeout(() => {
        company.classList.add('fade-in-up');
      }, 1000 * (index + 1)); // staggered delay
    });
  });


  document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname;

    // Mapping of URL paths to corresponding dot IDs
    const pageDotMap = {
      "/familyhistory/": "history-dot",
      "/history/": "history2-dot",
      "/leadership/": "team-dot",
      "/advisoryboard/": "team2-dot",
      "/standards/": "standards-dot",
      "/tools/": "data-dot",
      "/operatingcompanies/": "oc-dot",
      "/news/": "news-dot",
      "/contact/": "contact-dot"
    };

    // Hide all dots initially, even if styles got applied earlier
    Object.values(pageDotMap).forEach(id => {
      const dot = document.getElementById(id);
      if (dot) dot.style.visibility = "hidden";
    });

    // Show only the dot that matches the current page
    const activeDotId = pageDotMap[currentPath];
    if (activeDotId) {
      const activeDot = document.getElementById(activeDotId);
      if (activeDot) activeDot.style.visibility = "visible";
    }
  });

  window.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth <= 768) {
      const disclaimer = document.getElementById('mobileDisclaimer');
      disclaimer.style.display = 'flex'; // Show the popup

      const dismissBtn = document.getElementById('dismissDisclaimer');
      dismissBtn.addEventListener('click', function () {
        disclaimer.style.display = 'none'; // Hide the entire disclaimer div
      });
    }
  });

  window.addEventListener('DOMContentLoaded', function () {
    const disclaimer = document.getElementById('cookieDisclaimer');
    const dismissBtn = document.getElementById('cookieDismiss');

    // Check if user already acknowledged cookies
    if (!localStorage.getItem('cookieAccepted')) {
      disclaimer.style.display = 'block';
    }

    dismissBtn.addEventListener('click', function () {
      disclaimer.style.display = 'none';
      localStorage.setItem('cookieAccepted', 'true');
    });
  });

// Example: highlight logos on hover or programmatically
logos.forEach(logo => {
  logo.classList.add('highlighted');
});

// To remove highlight:
logos.forEach(logo => {
  logo.classList.remove('highlighted');
});
