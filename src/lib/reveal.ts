import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Stagger, spec §1.6 / §6: interval 60ms, at most 4 staggered steps after the
 * first, total delay capped at 240ms. Everything past the cap snaps in with it.
 */
const STAGGER_STEP = 60;
const STAGGER_MAX_STEPS = 4;

/**
 * Adds `.in` to any `.reveal` element when it scrolls into view.
 *
 * Spec §1.6, two fixes:
 *
 * 1. The effect had no dependency array, so it requeried the whole document and
 *    tore down the IntersectionObserver on every single render. It now runs on
 *    route change only.
 * 2. Stagger is expressed as the `--reveal-delay` custom property on the element
 *    that actually carries the transition (the `.reveal` itself), not as an inline
 *    `transitionDelay` on a child, where it delays a transition that does not exist.
 *    `index.css` reads it via `transition-delay: var(--reveal-delay, 0ms)`.
 *
 * Opt in to stagger by putting `data-stagger` on the group; its direct `.reveal`
 * children are numbered in order. A `--reveal-delay` already declared on the element,
 * inline or by a utility class, always wins, so a component may set its own.
 */
export function useReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
      let step = 0;
      Array.from(group.children).forEach((node) => {
        if (!(node instanceof HTMLElement) || !node.classList.contains('reveal')) return;
        const declared = getComputedStyle(node).getPropertyValue('--reveal-delay').trim();
        if (!declared) {
          node.style.setProperty(
            '--reveal-delay',
            `${Math.min(step, STAGGER_MAX_STEPS) * STAGGER_STEP}ms`,
          );
        }
        step += 1;
      });
    });

    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
}
