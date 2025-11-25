// Reusable Image Carousel Component
import { useState, useEffect } from 'react';

export default function ImageCarousel({ images = [], title = 'Property', autoPlayInterval = 8000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (images.length === 0 || autoPlayInterval === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="photo-carousel">
        <div className="carousel-container">
          <div className="carousel-slide active">
            <img src="https://via.placeholder.com/800x600?text=No+Image" alt="Placeholder" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-carousel">
      <div className="carousel-container">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`carousel-slide ${idx === currentIndex ? 'active' : ''}`}
          >
            <img 
              src={img}
              alt={`${title} image ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>
      <button className="carousel-prev" onClick={handlePrevious} aria-label="Previous image">
        <i></i>
      </button>
      <button className="carousel-next" onClick={handleNext} aria-label="Next image">
        <i></i>
      </button>
      <div className="carousel-nav">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            role="button"
            tabIndex={0}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
