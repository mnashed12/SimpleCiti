// Add scroll event to change timeline line color
window.addEventListener('scroll', function() {
  const timelineLine = document.querySelector('.timeline::before');
  const scrollPosition = window.scrollY;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercentage = (scrollPosition / documentHeight) * 100;

  // Adjust color based on scroll position
  const color = `rgb(${Math.min(255, scrollPercentage * 2)}, ${Math.min(255, (100 - scrollPercentage) * 2)}, 83)`;

  // Apply color to timeline line
  document.querySelector('.timeline::before').style.backgroundColor = color;
});


$(function(){

    window.sr = ScrollReveal();
  
    if ($(window).width() < 768) {
  
        if ($('.timeline-content').hasClass('js--fadeInLeft')) {
            $('.timeline-content').removeClass('js--fadeInLeft').addClass('js--fadeInRight');
        }
  
        sr.reveal('.js--fadeInRight', {
          origin: 'right',
          distance: '300px',
          easing: 'ease-in-out',
          duration: 800,
        });
  
    } else {
        
        sr.reveal('.js--fadeInLeft', {
          origin: 'left',
          distance: '300px',
            easing: 'ease-in-out',
          duration: 800,
        });
  
        sr.reveal('.js--fadeInRight', {
          origin: 'right',
          distance: '300px',
          easing: 'ease-in-out',
          duration: 800,
        });
  
    }
    
    sr.reveal('.js--fadeInLeft', {
          origin: 'left',
          distance: '300px',
            easing: 'ease-in-out',
          duration: 800,
        });
  
        sr.reveal('.js--fadeInRight', {
          origin: 'right',
          distance: '300px',
          easing: 'ease-in-out',
          duration: 800,
        });
  
  
  });
