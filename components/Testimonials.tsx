import { useState, useEffect } from 'react';
import { TESTIMONIALS } from '../constants';
import { Star, Quote, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [, setIsTransitioning] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying]);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-gold text-xs uppercase tracking-[0.3em] font-extrabold">Testimonials</span>
          <h2 className="mt-4 font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black font-bold">Client Stories</h2>
          <p className="text-gold mt-2 text-lg font-semibold">Historias de Éxito</p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Testimonial Display */}
          <div className="relative min-h-[280px] sm:min-h-[300px] md:min-h-[350px] flex items-center justify-center">
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  index === currentIndex
                    ? 'opacity-100 scale-100 z-10'
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="bg-white border border-gray-200 shadow-premium p-5 sm:p-8 md:p-12 mx-auto max-w-4xl hover-lift clip-angle-top-right">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gold/10 flex items-center justify-center">
                      <Quote className="text-gold" size={32} />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center gap-1 text-gold mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={20} fill="currentColor" aria-hidden="true" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <blockquote className="text-black/70 mb-8 font-light leading-relaxed text-center text-lg sm:text-xl">
                    "{testimonial.text}"
                  </blockquote>

                  {/* Client Info */}
                  <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
                    <div className="w-14 h-14 bg-gold flex items-center justify-center text-white font-playfair font-black text-xl shadow-premium">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h4 className="text-black font-bold text-base sm:text-lg">{testimonial.name}</h4>
                      <p className="text-black/60 text-sm font-light">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-12 w-10 h-10 sm:w-14 sm:h-14 bg-white border-2 border-gold hover:bg-gold hover:border-gold transition-premium flex items-center justify-center group touch-target shadow-premium z-20"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="text-gold group-hover:text-white transition-premium" size={24} />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-12 w-10 h-10 sm:w-14 sm:h-14 bg-white border-2 border-gold hover:bg-gold hover:border-gold transition-premium flex items-center justify-center group touch-target shadow-premium z-20"
            aria-label="Next testimonial"
          >
            <ChevronRight className="text-gold group-hover:text-white transition-premium" size={24} />
          </button>
        </div>

        {/* Dots Navigation & Controls */}
        <div className="flex items-center justify-center gap-6 mt-8 sm:mt-12">
          {/* Auto-play Toggle */}
          <button
            onClick={toggleAutoPlay}
            className="w-10 h-10 bg-white border-2 border-gold hover:bg-gold/10 transition-premium flex items-center justify-center touch-target"
            aria-label={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
          >
            {isAutoPlaying ? (
              <Pause className="text-gold" size={16} />
            ) : (
              <Play className="text-gold" size={16} />
            )}
          </button>

          {/* Dots */}
          <div className="flex gap-2 sm:gap-3">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-premium touch-target ${
                  index === currentIndex
                    ? 'w-10 sm:w-12 h-3 bg-gold'
                    : 'w-3 h-3 bg-black/30 hover:bg-gold/70 rounded-full'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="text-black/60 text-sm font-mono font-medium">
            {currentIndex + 1} / {TESTIMONIALS.length}
          </div>
        </div>

        {/* Progress Bar */}
        {isAutoPlaying && (
          <div className="max-w-md mx-auto mt-6">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold via-gold/80 to-gold rounded-full"
                style={{
                  animation: 'progress 5s linear infinite',
                }}
              />
            </div>
          </div>
        )}
      </div>

    </section>
  );
};

export default Testimonials;