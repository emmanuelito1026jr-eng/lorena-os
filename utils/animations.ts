import { gsap } from './gsap-config';

// Staggered reveal for card grids
export const staggerReveal = (elements: string, delay = 0.1) => {
  return gsap.from(elements, {
    y: 60,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: delay,
    scrollTrigger: {
      trigger: elements,
      start: 'top 85%',
    }
  });
};

// Scale entrance animation
export const scaleIn = (element: string) => {
  return gsap.from(element, {
    scale: 0.95,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
    }
  });
};

// Clip-path reveal for angular edges
export const clipPathReveal = (element: string) => {
  return gsap.from(element, {
    clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
    duration: 1.2,
    ease: 'power4.inOut',
    scrollTrigger: {
      trigger: element,
      start: 'top 75%',
    }
  });
};

// Fade in from bottom
export const fadeInUp = (element: string) => {
  return gsap.from(element, {
    y: 80,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
  });
};
