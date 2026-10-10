import { useEffect } from 'react';

/**
 * useScrollReveal
 * Attaches a lightweight IntersectionObserver to elements with `.scroll-reveal`.
 * Subtly reveals elements with 240ms duration and zero bounce as they enter viewport.
 * Automatically respects `prefers-reduced-motion`.
 */
export function useScrollReveal(dependency?: unknown) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect reduced motion: immediately reveal everything without transition
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    const observeUnrevealed = () => {
      const elements = document.querySelectorAll('.scroll-reveal:not(.is-revealed)');
      elements.forEach((el) => observer.observe(el));
    };

    observeUnrevealed();

    // Listen for dynamically mounted DOM elements (e.g. tab transitions)
    const mutationObserver = new MutationObserver(() => {
      observeUnrevealed();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [dependency]);
}
