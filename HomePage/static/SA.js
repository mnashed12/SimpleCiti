document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("stickerModal");
  const modalImage = document.getElementById("modalImage");
  const modalText = document.getElementById("modalText");

  // Open Modal Function (Now in Global Scope)
  window.openModal = function (stickerId) {
      const stickers = {
          1: { src: "/static/sticker1.png", text: "Property Operations Analysis & Oversight, Capital Expenditure Planning & Review, Vendor Selection & Contract Negotiation." },
          2: { src: "/static/sticker2.png", text: "Optimize asset performance, manage risk, and enhance operational efficiency." },
          3: { src: "/static/sticker3.png", text: "Municipalities, state agencies, and public investment funds." },
          4: { src: "/static/sticker4.png", text: "Financial planning, asset management, and operational efficiency." },
          5: { src: "/static/sticker5.png", text: "Asset acquisition, portfolio diversification, and capital expenditure planning."}
      };

      if (stickers[stickerId]) {
          modalImage.src = stickers[stickerId].src;
          modalText.textContent = stickers[stickerId].text;
          modal.style.display = "flex";
      }
  };

  // Close Modal Function
  function closeModal(event) {
      if (event.target === modal) {
          modal.style.display = "none";
      }
  }

  // Attach click event to each sticker
  document.querySelectorAll(".sticker").forEach((sticker, index) => {
      sticker.addEventListener("click", function () {
          openModal(index + 1);
      });
  });

  // Close modal when clicking outside of it
  modal.addEventListener("click", closeModal);

  // Ensure modal is hidden on page load
  modal.style.display = "none";
});


document.addEventListener("wheel", (event) => {
  event.preventDefault(); // Prevents default scrolling
  let sections = document.querySelectorAll("section");
  let currentSection = Math.round(window.scrollY / window.innerHeight);

  if (event.deltaY > 0 && currentSection < sections.length - 1) {
    window.scrollTo({ top: (currentSection + 1) * window.innerHeight });
  } else if (event.deltaY < 0 && currentSection > 0) {
    window.scrollTo({ top: (currentSection - 1) * window.innerHeight });
  }
}, { passive: false });
