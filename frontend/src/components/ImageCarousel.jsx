// Reusable Image Carousel Component
import { useState, useEffect } from 'react';

export default function ImageCarousel({ images = [], title = 'Property', autoPlayInterval = 8000 }) {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (images.length === 0 || autoPlayInterval === 0) return;

    const interval = setInterval(() => {
      setCurrentPairIndex((prev) => (prev + 1) % Math.ceil(images.length / 2));
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval]);

  const handlePrevious = () => {
    setCurrentPairIndex((prev) => 
      prev === 0 ? Math.ceil(images.length / 2) - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentPairIndex((prev) => (prev + 1) % Math.ceil(images.length / 2));
  };

  if (images.length === 0) {
    return (
      <div className="hero-split-view">
        <div className="photo-carousel">
          <div className="carousel-container">
            <div className="carousel-slide active">
              <img src="https://via.placeholder.com/800x600?text=No+Image" alt="Placeholder" />
            </div>
          </div>
        </div>
        <div className="photo-carousel photo-carousel-right">
          <div className="carousel-container">
            <div className="carousel-slide active">
              <img src="https://via.placeholder.com/800x600?text=No+Image" alt="Placeholder" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPairs = Math.ceil(images.length / 2);

  return (
    <div className="hero-split-view">
      {/* Left Carousel */}
      <div className="photo-carousel">
        <div className="carousel-container">
          {Array.from({ length: totalPairs }).map((_, pairIdx) => {
            const leftImageIdx = pairIdx * 2;
            return (
              <div
                key={`left-${pairIdx}`}
                className={`carousel-slide ${pairIdx === currentPairIndex ? 'active' : ''}`}
              >
                <img 
                  src={images[leftImageIdx]} 
                  alt={`${title} image ${leftImageIdx + 1}`}
                  loading={pairIdx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            );
          })}
        </div>
        <button className="carousel-prev" onClick={handlePrevious} aria-label="Previous image">
          <i></i>
        </button>
        <div className="carousel-nav">
          {Array.from({ length: totalPairs }).map((_, idx) => (
            <div
              key={idx}
              className={`carousel-dot ${idx === currentPairIndex ? 'active' : ''}`}
              onClick={() => setCurrentPairIndex(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Right Carousel */}
      <div className="photo-carousel photo-carousel-right">
        <div className="carousel-container">
          {Array.from({ length: totalPairs }).map((_, pairIdx) => {
            const rightImageIdx = pairIdx * 2 + 1;
            const wrappedIdx = rightImageIdx < images.length ? rightImageIdx : 0;
            return (
              <div
                key={`right-${pairIdx}`}
                className={`carousel-slide ${pairIdx === currentPairIndex ? 'active' : ''}`}
              >
                <img 
                  src={images[wrappedIdx]} 
                  alt={`${title} image ${wrappedIdx + 1}`}
                  loading={pairIdx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            );
          })}
        </div>
        <button className="carousel-next" onClick={handleNext} aria-label="Next image">
          <i></i>
        </button>
      </div>
    </div>
  );
}
