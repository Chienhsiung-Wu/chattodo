import gsap from 'gsap';
import { onBeforeUnmount, type Ref } from 'vue';

/**
 * Motion layer over GSAP, sourced from the design tokens in tokens.css —
 * durations and easings are read from the CSS variables at first use so the
 * motion system and the CSS transitions never drift apart.
 * Restraint rules: no bounce/overshoot, nothing over 300ms, reduced-motion
 * collapses everything to instant.
 */

function cssVar(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function cssMs(name: string, fallback: number): number {
  const v = cssVar(name);
  const m = /^([\d.]+)ms$/.exec(v) || /^([\d.]+)s$/.exec(v);
  if (!m) return fallback;
  return v.endsWith('ms') ? parseFloat(m[1]) : parseFloat(m[1]) * 1000;
}

let cached: { fast: number; base: number; medium: number; slow: number } | null = null;
/** Durations in seconds (GSAP convention), from --duration-* tokens. */
export function durations() {
  if (!cached) {
    cached = {
      fast: cssMs('--duration-fast', 110) / 1000,
      base: cssMs('--duration-base', 160) / 1000,
      medium: cssMs('--duration-medium', 200) / 1000,
      slow: cssMs('--duration-slow', 300) / 1000,
    };
  }
  return cached;
}

/** GSAP equivalents of the --ease-* tokens (cubic-bezier values mirrored). */
export const eases = {
  out: 'power3.out', // ≈ cubic-bezier(0.16,1,0.3,1) smooth decel — entrances
  in: 'power1.in', // ≈ cubic-bezier(0.4,0,1,1) — exits
  inOut: 'power2.inOut', // ≈ cubic-bezier(0.7,0,0.39,0.98)
} as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Component-scoped GSAP context: animations registered through `motion()` are
 * reverted automatically on unmount; everything no-ops under reduced motion.
 */
export function useMotion(scope?: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | null = null;
  const motion = (fn: () => void) => {
    if (prefersReducedMotion()) return;
    if (!ctx) ctx = gsap.context(() => {}, scope?.value ?? undefined);
    ctx.add(fn);
  };
  onBeforeUnmount(() => {
    ctx?.revert();
    ctx = null;
  });
  return motion;
}

/** Fade+rise reveal for a single element. clearProps avoids stray transforms. */
export function reveal(el: Element, opts: { y?: number; delay?: number; duration?: number } = {}) {
  if (prefersReducedMotion()) return;
  gsap.from(el, {
    opacity: 0,
    y: opts.y ?? 6,
    duration: opts.duration ?? durations().base,
    delay: opts.delay ?? 0,
    ease: eases.out,
    clearProps: 'opacity,transform',
  });
}

/** Staggered fade+rise for a set of elements (lists). */
export function staggerReveal(els: Element[] | NodeListOf<Element>, opts: { y?: number; stagger?: number } = {}) {
  if (prefersReducedMotion()) return;
  const list = Array.from(els as ArrayLike<Element>);
  if (!list.length) return;
  gsap.from(list, {
    opacity: 0,
    y: opts.y ?? 5,
    duration: durations().base,
    ease: eases.out,
    stagger: opts.stagger ?? 0.025,
    clearProps: 'opacity,transform',
  });
}
