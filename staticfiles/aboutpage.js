document.addEventListener("DOMContentLoaded", function () {
    // Array of background images
    const backgroundImages = [
        "/static/option8.jpeg",
        "/static/option9.jpeg",
        "/static/option10.jpeg"
    ];

    // Array of content for each slide
    const contentList = [
        "SimpleCiti is comprised of 125 years of combined talent in the growth and development of various enterprises within Fast Moving Consumer Packaged Goods, Technology, Manufacturing, Warehousing & Logistics, Beverage & Liquor as well as Commercial Real Estate. SimpleCiti adheres to a clear path to Value Creation. Our go-to playbook incorporates Mergers & Acquisitions, Consolidation, Economies of Scale as well as infusing Smart Tech to leverage massive value creation. Strategic Placement of Private Equity and Debt with strict financial controls, deep-rooted operational excellence & innovation is the cornerstone to our success.",
        "SimpleCiti continues to drive transformation across industries by leveraging strategic partnerships, technological innovation, and data-driven decision-making. Our success stems from a disciplined investment approach that maximizes long-term value and sustainable growth opportunities.",
        "Our approach is built on integrity, expertise, and a deep understanding of market trends. By combining financial strength with operational excellence, SimpleCiti is able to scale businesses effectively, create new market opportunities, and redefine industry standards."
    ];

    let currentIndex = 0; // Track the current slide
    const aboutSection = document.querySelector(".about-us");
    const textBox = document.querySelector(".opaque-box p");

    function changeSlide() {
        // Slide out effect for content
        textBox.style.transform = "translateX(-100%)";
        textBox.style.opacity = "0";

        setTimeout(() => {
            // Change background image
            aboutSection.style.backgroundImage = `url('${backgroundImages[currentIndex]}')`;

            // Change text content
            textBox.textContent = contentList[currentIndex];

            // Slide in effect for new content
            textBox.style.transform = "translateX(100%)";

            setTimeout(() => {
                textBox.style.transform = "translateX(0%)";
                textBox.style.opacity = "1";
            }, 300);

            // Move to the next slide (looping)
            currentIndex = (currentIndex + 1) % backgroundImages.length;
        }, 500);
    }

    // Change slide every 5 seconds
    setInterval(changeSlide, 5000);
});

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