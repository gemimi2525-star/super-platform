/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Slot Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2.1 HOTFIX: Radix-style Slot for asChild pattern
 * 
 * Allows a component to render its children directly while merging
 * the component's props onto the child. Used for avoiding nested
 * interactive elements like <button><button>...</button></button>.
 * 
 * Usage:
 * ```tsx
 * <Slot onClick={handleClick} className="my-class">
 *   <a href="/link">Link Text</a>
 * </Slot>
 * // Renders: <a href="/link" onClick={handleClick} className="my-class">Link Text</a>
 * ```
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

import React, { forwardRef, cloneElement, isValidElement, Children } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merge multiple class names together
 */
function mergeClassNames(...classNames: (string | undefined)[]): string {
    return classNames.filter(Boolean).join(' ');
}

/**
 * Merge multiple style objects together
 */
function mergeStyles(
    ...styles: (React.CSSProperties | undefined)[]
): React.CSSProperties {
    return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * Merge multiple refs into one callback ref
 */
function mergeRefs<T>(
    ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
    return (node: T) => {
        refs.forEach((ref) => {
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref && typeof ref === 'object') {
                (ref as React.MutableRefObject<T | null>).current = node;
            }
        });
    };
}

/**
 * Merge event handlers - both handlers will be called
 */
function mergeEventHandlers<E extends React.SyntheticEvent>(
    original?: (event: E) => void,
    override?: (event: E) => void
): ((event: E) => void) | undefined {
    if (!original && !override) return undefined;
    if (!original) return override;
    if (!override) return original;

    return (event: E) => {
        original(event);
        if (!event.defaultPrevented) {
            override(event);
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// SLOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Slot merges its props onto its immediate child element.
 * This enables the "asChild" pattern where a component can render
 * as a different element while keeping all its functionality.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(
    function Slot({ children, ...slotProps }, forwardedRef) {
        const childrenArray = Children.toArray(children);
        const child = childrenArray[0];

        if (!isValidElement(child)) {
            // If child is not a valid element, wrap it in a span
            return (
                <span {...slotProps} ref={forwardedRef as React.Ref<HTMLSpanElement>}>
                    {children}
                </span>
            );
        }

        // Get the child's props
        const childProps = child.props as Record<string, unknown>;

        // Merge props
        const mergedProps: Record<string, unknown> = { ...slotProps };

        // Handle special props
        for (const key of Object.keys(childProps)) {
            if (key === 'className') {
                mergedProps.className = mergeClassNames(
                    slotProps.className,
                    childProps.className as string | undefined
                );
            } else if (key === 'style') {
                mergedProps.style = mergeStyles(
                    slotProps.style,
                    childProps.style as React.CSSProperties | undefined
                );
            } else if (key.startsWith('on') && typeof childProps[key] === 'function') {
                // Merge event handlers
                const slotHandler = slotProps[key as keyof typeof slotProps];
                if (typeof slotHandler === 'function') {
                    mergedProps[key] = mergeEventHandlers(
                        slotHandler as (event: React.SyntheticEvent) => void,
                        childProps[key] as (event: React.SyntheticEvent) => void
                    );
                } else {
                    mergedProps[key] = childProps[key];
                }
            } else if (!(key in slotProps)) {
                // Child props that aren't in slot props
                mergedProps[key] = childProps[key];
            }
        }

        // Handle ref merging
        const childRef = (child as React.ReactElement & { ref?: React.Ref<unknown> }).ref;
        if (forwardedRef || childRef) {
            mergedProps.ref = mergeRefs(forwardedRef, childRef as React.Ref<HTMLElement>);
        }

        return cloneElement(child, mergedProps);
    }
);

/**
 * Slottable is used to mark which child should be slotted.
 * Useful when a component has multiple children but only one should receive the slot props.
 */
export function Slottable({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

/**
 * Helper to check if a component should render as slot
 */
export function isSlottable(child: React.ReactNode): child is React.ReactElement<{ children: React.ReactNode }> {
    return isValidElement(child) && child.type === Slottable;
}

export default Slot;
