'use client'

/**
 * Shared motion tokens + framer-motion variants for the Intelligence results UI.
 *
 * Every variant ships two shapes:
 *   - `full`: the cinematic transform+opacity reveal
 *   - `reduced`: opacity-only mirror for users with `prefers-reduced-motion`
 *
 * Use `useReducedMotionSafe()` to resolve the correct variant set at render time.
 */

import { useReducedMotion, type Variants } from 'framer-motion'

/* ── Tokens ─────────────────────────────────────────────────── */

export const MOTION_DURATIONS = {
  fast: 0.18,
  base: 0.24,
  slow: 0.42,
} as const

export const MOTION_EASINGS = {
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const

export const MOTION_STAGGER = {
  proof: 0.04,
  reveal: 0.08,
} as const

/* ── Variant pairs ──────────────────────────────────────────── */

interface VariantPair {
  full: Variants
  reduced: Variants
}

export const heroReveal: VariantPair = {
  full: {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATIONS.base, ease: MOTION_EASINGS.easeOut },
    },
  },
  reduced: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: MOTION_DURATIONS.fast },
    },
  },
}

export const confidenceGlow: VariantPair = {
  full: {
    hidden: { opacity: 0, scale: 0.6 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: MOTION_DURATIONS.slow,
        ease: MOTION_EASINGS.easeOut,
        delay: 0.12,
      },
    },
  },
  reduced: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.85,
      transition: { duration: MOTION_DURATIONS.fast, delay: 0.08 },
    },
  },
}

export const proofStagger: VariantPair = {
  full: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.22,
        staggerChildren: MOTION_STAGGER.proof,
      },
    },
  },
  reduced: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.12,
        staggerChildren: 0.01,
      },
    },
  },
}

export const proofItem: VariantPair = {
  full: {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATIONS.base, ease: MOTION_EASINGS.easeOut },
    },
  },
  reduced: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: MOTION_DURATIONS.fast },
    },
  },
}

export const exhibitReveal: VariantPair = {
  full: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.22,
        ease: MOTION_EASINGS.easeOut,
        delay: 0.4,
      },
    },
  },
  reduced: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: MOTION_DURATIONS.fast, delay: 0.2 },
    },
  },
}

/* ── Hook ───────────────────────────────────────────────────── */

export interface ResolvedVariants {
  heroReveal: Variants
  confidenceGlow: Variants
  proofStagger: Variants
  proofItem: Variants
  exhibitReveal: Variants
  /** `true` if the user prefers reduced motion. */
  reduced: boolean
}

/**
 * Returns framer-motion variants matched to the user's motion preference.
 *
 * Safe to call conditionally at any component depth — delegates to
 * `useReducedMotion()` under the hood.
 */
export function useReducedMotionSafe(): ResolvedVariants {
  const prefersReduced = useReducedMotion() ?? false

  const pick = (pair: VariantPair) => (prefersReduced ? pair.reduced : pair.full)

  return {
    heroReveal: pick(heroReveal),
    confidenceGlow: pick(confidenceGlow),
    proofStagger: pick(proofStagger),
    proofItem: pick(proofItem),
    exhibitReveal: pick(exhibitReveal),
    reduced: prefersReduced,
  }
}
