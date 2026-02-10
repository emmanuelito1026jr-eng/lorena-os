import { useState, useEffect } from 'react';
import { TESTIMONIALS } from '../constants';
import { Star, Quote, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    <section className="py-20 sm:py-24 bg-dark-charcoal relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
        <Quote size={400} />
      </div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in-up">
          <span className="text-gold text-xs uppercase tracking-[0.3em]">Testimonials</span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl text-ivory">Client Stories</h2>
          <p className="text-gold italic mt-2 text-lg">Historias de Éxito</p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Testimonial Display */}
          <div className="relative min-h-[400px] sm:min-h-[350px] flex items-center justify-center">
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  index === currentIndex
                    ? 'opacity-100 scale-100 z-10'
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="glass-strong rounded-lg p-8 sm:p-12 mx-auto max-w-4xl hover-lift">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
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
                  <blockquote className="text-gray-200 italic mb-8 font-light leading-relaxed text-center text-lg sm:text-xl">
                    "{testimonial.text}"
                  </blockquote>

                  {/* Client Info */}
                  <div className="flex items-center justify-center gap-4 pt-6 border-t border-white/10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold/50 flex items-center justify-center text-dark font-serif font-bold text-xl shadow-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h4 className="text-ivory font-bold text-base sm:text-lg">{testimonial.name}</h4>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 w-12 h-12 sm:w-14 sm:h-14 bg-dark-card border border-gold/30 hover:bg-gold hover:border-gold transition-all rounded-full flex items-center justify-center group touch-target"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="text-gold group-hover:text-dark transition-colors" size={24} />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 w-12 h-12 sm:w-14 sm:h-14 bg-dark-card border border-gold/30 hover:bg-gold hover:border-gold transition-all rounded-full flex items-center justify-center group touch-target"
            aria-label="Next testimonial"
          >
            <ChevronRight className="text-gold group-hover:text-dark transition-colors" size={24} />
          </button>
        </div>

        {/* Dots Navigation & Controls */}
        <div className="flex items-center justify-center gap-6 mt-8 sm:mt-12">
          {/* Auto-play Toggle */}
          <button
            onClick={toggleAutoPlay}
            className="w-10 h-10 bg-dark-card border border-gold/30 hover:bg-gold/10 transition-all rounded-full flex items-center justify-center touch-target"
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
                className={`transition-all duration-300 rounded-full touch-target ${
                  index === currentIndex
                    ? 'w-10 sm:w-12 h-2 bg-gold'
                    : 'w-2 h-2 bg-gray-600 hover:bg-gold/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="text-gray-400 text-sm font-mono">
            {currentIndex + 1} / {TESTIMONIALS.length}
          </div>
        </div>

        {/* Progress Bar */}
        {isAutoPlaying && (
          <div className="max-w-md mx-auto mt-6">
            <div className="h-1 bg-dark-card rounded-full overflow-hidden">
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

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default Testimonials;