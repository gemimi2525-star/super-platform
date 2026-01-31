/**
 * OS Motion System Constants
 * 
 * APICOREDATA OS · Motion Design Tokens
 * 
 * PRINCIPLES:
 * - Calm, not flashy
 * - macOS-inspired (subtle, predictable)
 * - Duration: 120-220ms
 * - Easing: easeOut / spring (low bounce)
 */

// ═══════════════════════════════════════════════════════════════════════
// DURATIONS (in seconds for Framer Motion)
// ═══════════════════════════════════════════════════════════════════════
export const OS_DURATION = {
    instant: 0.08,      // 80ms - micro interactions
    fast: 0.12,         // 120ms - button states
    normal: 0.18,       // 180ms - cards, panels
    slow: 0.22,         // 220ms - page transitions
    entrance: 0.25,     // 250ms - page load animations
} as const;

// ═══════════════════════════════════════════════════════════════════════
// EASINGS
// ═══════════════════════════════════════════════════════════════════════
export const OS_EASING = {
    // Standard OS easing
    default: [0.25, 0.1, 0.25, 1.0],           // ease-out
    smooth: [0.4, 0.0, 0.2, 1.0],              // material design
    decelerate: [0.0, 0.0, 0.2, 1.0],          // enter
    accelerate: [0.4, 0.0, 1.0, 1.0],          // exit

    // Spring configs (for framer spring)
    spring: { type: 'spring', stiffness: 400, damping: 30 },
    springGentle: { type: 'spring', stiffness: 300, damping: 35 },
    springBounce: { type: 'spring', stiffness: 500, damping: 25, mass: 0.8 },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// TRANSITION PRESETS
// ═══════════════════════════════════════════════════════════════════════
export const OS_TRANSITION = {
    // Fast micro-interactions
    micro: {
        duration: OS_DURATION.instant,
        ease: OS_EASING.default,
    },

    // Button/interactive states
    interactive: {
        duration: OS_DURATION.fast,
        ease: OS_EASING.smooth,
    },

    // Card hover/focus
    card: {
        duration: OS_DURATION.normal,
        ease: OS_EASING.smooth,
    },

    // Page transitions
    page: {
        duration: OS_DURATION.slow,
        ease: OS_EASING.decelerate,
    },

    // Entrance animations
    entrance: {
        duration: OS_DURATION.entrance,
        ease: OS_EASING.decelerate,
    },

    // Spring for organic feel
    spring: OS_EASING.spring,
    springGentle: OS_EASING.springGentle,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════

// Desktop zone entrance (fade + slide up)
export const desktopZoneVariants = {
    hidden: {
        opacity: 0,
        y: 12
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: OS_TRANSITION.entrance,
    },
};

// Stagger children for lists
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

// Individual stagger item
export const staggerItem = {
    hidden: {
        opacity: 0,
        y: 8
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: OS_TRANSITION.card,
    },
};

// App card hover/active states
export const appCardVariants = {
    idle: {
        scale: 1,
        y: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    hover: {
        scale: 1.02,
        y: -2,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        transition: OS_TRANSITION.card,
    },
    tap: {
        scale: 0.98,
        y: 0,
        transition: OS_TRANSITION.interactive,
    },
};

// Widget card subtle hover
export const widgetCardVariants = {
    idle: {
        scale: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    hover: {
        scale: 1.01,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: OS_TRANSITION.card,
    },
};

// Icon scale on hover
export const iconHoverVariants = {
    idle: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: OS_TRANSITION.interactive,
    },
};

// Page transition (cross-fade)
export const pageTransitionVariants = {
    initial: {
        opacity: 0,
    },
    enter: {
        opacity: 1,
        transition: OS_TRANSITION.page,
    },
    exit: {
        opacity: 0,
        transition: {
            duration: OS_DURATION.fast,
            ease: OS_EASING.accelerate,
        },
    },
};

// Search input focus
export const searchFocusVariants = {
    blur: {
        boxShadow: '0 0 0 0px rgba(59, 130, 246, 0)',
        borderColor: 'rgb(229, 231, 235)',
    },
    focus: {
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
        borderColor: 'rgb(59, 130, 246)',
        transition: OS_TRANSITION.interactive,
    },
};
