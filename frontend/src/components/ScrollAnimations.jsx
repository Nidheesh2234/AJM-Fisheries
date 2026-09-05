import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollAnimations Component
 * Manages native browser scroll & GSAP ScrollTrigger animations.
 * Respects prefers-reduced-motion.
 */
export default function ScrollAnimations({ activeView }) {
  useEffect(() => {
    // Only active on home view
    if (activeView !== 'home') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isMobile = window.innerWidth <= 768;

    // GSAP Animations Context (using native window scroll)
    const ctx = gsap.context(() => {
      // A. Hero Section Entrance (simplified & faster on mobile)
      const heroTl = gsap.timeline();
      heroTl.fromTo(
        '.hero-bg-img',
        { scale: 1.12, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: isMobile ? 1.2 : 2, ease: 'power2.out' },
        0
      );
      heroTl.fromTo(
        ['.hero-badge', '.hero-title', '.hero-subtitle', '.hero-ctas'],
        { y: isMobile ? 20 : 35, opacity: 0 },
        { y: 0, opacity: 1, duration: isMobile ? 0.6 : 0.9, stagger: isMobile ? 0.08 : 0.15, ease: 'power3.out' },
        0.2
      );

      // B. Standard Section Reveals
      const revealElements = document.querySelectorAll('.gsap-reveal');
      revealElements.forEach((el) => {
        gsap.fromTo(
          el,
          { y: isMobile ? 25 : 45, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: isMobile ? 0.6 : 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // C. Card Staggers
      const cardGrids = document.querySelectorAll('.gsap-stagger-grid');
      cardGrids.forEach((grid) => {
        const cards = grid.children;
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { y: isMobile ? 20 : 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: isMobile ? 0.5 : 0.7,
              stagger: isMobile ? 0.08 : 0.12,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: grid,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });

      // D. Stat Counter & Pinned Moment
      const statSection = document.querySelector('#stats-pin-section');
      if (statSection) {
        ScrollTrigger.create({
          trigger: statSection,
          start: 'top 80%',
          onEnter: () => {
            const statNumbers = document.querySelectorAll('.stat-number-counter');
            statNumbers.forEach((numEl) => {
              const target = numEl.getAttribute('data-target');
              if (!target) return;
              const numericValue = parseInt(target.replace(/[^0-9]/g, ''), 10);
              const suffix = target.replace(/[0-9,]/g, '');
              const prefix = target.startsWith('0%') ? '' : '';

              if (!isNaN(numericValue) && numericValue > 0) {
                const obj = { val: 0 };
                gsap.to(obj, {
                  val: numericValue,
                  duration: isMobile ? 1.2 : 1.8,
                  ease: 'power1.out',
                  onUpdate: () => {
                    numEl.innerText = `${prefix}${Math.floor(obj.val).toLocaleString()}${suffix}`;
                  },
                });
              }
            });
          },
        });
      }

      // E. How It Works Journey Scroll Scrub
      const journeySection = document.querySelector('#how-it-works-journey');
      if (journeySection) {
        const steps = journeySection.querySelectorAll('.journey-step-card');
        const fishIcon = journeySection.querySelector('.journey-swimming-fish');

        if (steps.length > 0) {
          gsap.fromTo(
            steps,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.15,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: journeySection,
                start: 'top 75%',
              },
            }
          );
        }

        if (fishIcon) {
          if (isMobile) {
            // Vertical timeline scrub on mobile
            gsap.fromTo(
              fishIcon,
              { y: '0%' },
              {
                y: '85%',
                ease: 'none',
                scrollTrigger: {
                  trigger: journeySection,
                  start: 'top 60%',
                  end: 'bottom 40%',
                  scrub: 1,
                },
              }
            );
          } else {
            // Horizontal scrub on desktop
            gsap.fromTo(
              fishIcon,
              { x: '0%' },
              {
                x: '85%',
                ease: 'none',
                scrollTrigger: {
                  trigger: journeySection,
                  start: 'top 60%',
                  end: 'bottom 40%',
                  scrub: 1,
                },
              }
            );
          }
        }
      }
    });

    // Cleanup on unmount or view change
    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [activeView]);

  return null;
}
