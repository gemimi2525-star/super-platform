/**
 * Motion Tokens
 * Animation durations and easing curves
 */

export const duration = {
    instant: '0ms',
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
    slower: '500ms',
} as const;

export const easing = {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
