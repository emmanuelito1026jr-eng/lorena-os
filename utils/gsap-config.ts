import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const gsapConfig = {
  defaults: {
    duration: 0.8,
    ease: 'power3.out',
  },
  scrollTrigger: {
    start: 'top 80%',
    end: 'bottom 20%',
    toggleActions: 'play none none reverse',
  }
};

export { gsap, ScrollTrigger };
