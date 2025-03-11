document.querySelectorAll(".accordion__item").forEach(item => {
    item.addEventListener("click", function() {
        // Remove active class from all items
        document.querySelectorAll(".accordion__item").forEach(i => i.classList.remove("active"));

        // Toggle the clicked item
        this.classList.add("active");
    });
});
