/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core Dropdown Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2.1: OS-grade dropdown menu with keyboard navigation
 * 
 * Use Cases:
 * - Language switcher
 * - Action menu (⋯)
 * - Filter / Sort
 * - Compact selector
 * 
 * Features:
 * - Trigger: button / icon-button
 * - Items: icon + label
 * - Divider support
 * - Disabled items
 * - Keyboard accessible (↑ ↓ Enter Esc)
 * - Auto-position (bottom / top)
 * - Close on outside click
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
    forwardRef,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreDropdownProps {
    children: React.ReactNode;
    /** Open state control (optional - defaults to internal state) */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Disable the dropdown */
    disabled?: boolean;
}

export interface CoreDropdownTriggerProps {
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** aria-label for accessibility */
    'aria-label'?: string;
    asChild?: boolean;
}

export interface CoreDropdownContentProps {
    children: React.ReactNode;
    /** Alignment relative to trigger */
    align?: 'start' | 'center' | 'end';
    /** Side relative to trigger */
    side?: 'top' | 'bottom';
    /** Portal container */
    container?: HTMLElement;
    /** Min width (defaults to trigger width) */
    minWidth?: number | 'trigger';
    /** Additional className */
    className?: string;
}

export interface CoreDropdownItemProps {
    children: React.ReactNode;
    /** Icon to display before label */
    icon?: React.ReactNode;
    /** Click handler */
    onSelect?: () => void;
    /** Disable the item */
    disabled?: boolean;
    /** Danger styling */
    danger?: boolean;
    /** Additional className */
    className?: string;
}

export interface CoreDropdownDividerProps {
    /** Additional className */
    className?: string;
}

export interface CoreDropdownLabelProps {
    children: React.ReactNode;
    /** Additional className */
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface DropdownContextValue {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
    focusedIndex: number;
    setFocusedIndex: (index: number) => void;
    itemCount: number;
    registerItem: () => number;
    unregisterItem: (index: number) => void;
    disabled: boolean;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
    const context = useContext(DropdownContext);
    if (!context) {
        throw new Error('Dropdown components must be used within CoreDropdown');
    }
    return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const contentVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: -4,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.15,
            ease: [0.16, 1, 0.3, 1] as const,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -4,
        transition: {
            duration: 0.1,
            ease: [0.16, 1, 0.3, 1] as const,
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// CORE DROPDOWN (ROOT)
// ═══════════════════════════════════════════════════════════════════════════

export function CoreDropdown({
    children,
    open,
    onOpenChange,
    disabled = false,
}: CoreDropdownProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [itemCount, setItemCount] = useState(0);

    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = useCallback(
        (newOpen: boolean) => {
            if (disabled && newOpen) return;
            if (open === undefined) {
                setInternalOpen(newOpen);
            }
            onOpenChange?.(newOpen);
            if (!newOpen) {
                setFocusedIndex(-1);
            }
        },
        [open, onOpenChange, disabled]
    );

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                !triggerRef.current?.contains(target) &&
                !contentRef.current?.contains(target)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, setIsOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, setIsOpen]);

    const registerItem = useCallback(() => {
        const index = itemCount;
        setItemCount((prev) => prev + 1);
        return index;
    }, [itemCount]);

    const unregisterItem = useCallback(() => {
        setItemCount((prev) => Math.max(0, prev - 1));
    }, []);

    const contextValue = useMemo(
        () => ({
            isOpen,
            setIsOpen,
            triggerRef,
            contentRef,
            focusedIndex,
            setFocusedIndex,
            itemCount,
            registerItem,
            unregisterItem,
            disabled,
        }),
        [isOpen, setIsOpen, focusedIndex, itemCount, registerItem, unregisterItem, disabled]
    );

    return (
        <DropdownContext.Provider value={contextValue}>
            <div className="core-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER
// ═══════════════════════════════════════════════════════════════════════════

export const CoreDropdownTrigger = forwardRef<HTMLButtonElement, CoreDropdownTriggerProps>(
    function CoreDropdownTrigger({ children, className = '', 'aria-label': ariaLabel, asChild = false }, ref) {
        const { isOpen, setIsOpen, triggerRef, disabled } = useDropdownContext();

        // Merge refs
        const mergedRef = useCallback(
            (node: HTMLButtonElement | null) => {
                (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                }
            },
            [ref, triggerRef]
        );

        const handleClick = useCallback((e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
        }, [isOpen, setIsOpen]);

        const handleKeyDown = useCallback(
            (event: React.KeyboardEvent) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                    }
                }
            },
            [isOpen, setIsOpen]
        );

        const triggerProps = {
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            'aria-haspopup': 'menu' as const,
            'aria-expanded': isOpen,
            'aria-label': ariaLabel,
            className: `core-dropdown-trigger ${className}`,
            style: {
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
            },
        };

        // If asChild is true, merge props onto the child element using Slot
        // This prevents <button><button> nesting when using CoreButton as child
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
                ...triggerProps,
                ref: mergedRef,
                disabled: disabled || (children.props as Record<string, unknown>).disabled,
            });
        }

        // Default: render as a button wrapper
        return (
            <button
                ref={mergedRef}
                type="button"
                disabled={disabled}
                {...triggerProps}
            >
                {children}
            </button>
        );
    }
);


// ═══════════════════════════════════════════════════════════════════════════
// CONTENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoreDropdownContent({
    children,
    align = 'start',
    side = 'bottom',
    container,
    minWidth = 'trigger',
    className = '',
}: CoreDropdownContentProps) {
    const { isOpen, triggerRef, contentRef, focusedIndex, setFocusedIndex, itemCount } =
        useDropdownContext();
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    // Calculate position
    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const trigger = triggerRef.current.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        let top = side === 'bottom' ? trigger.bottom + 4 : trigger.top - 4;
        let left = trigger.left;

        // Align
        if (align === 'center') {
            left = trigger.left + trigger.width / 2;
        } else if (align === 'end') {
            left = trigger.right;
        }

        // Auto-flip if not enough space
        const contentHeight = contentRef.current?.offsetHeight || 200;
        if (side === 'bottom' && top + contentHeight > viewport.height - 20) {
            top = trigger.top - contentHeight - 4;
        } else if (side === 'top' && top - contentHeight < 20) {
            top = trigger.bottom + 4;
        }

        setPosition({ top, left });
    }, [isOpen, triggerRef, contentRef, side, align]);

    // Keyboard navigation - use focusedIndex from closure since setFocusedIndex is not a state setter
    const focusedIndexRef = useRef(focusedIndex);
    focusedIndexRef.current = focusedIndex;

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            const currentIndex = focusedIndexRef.current;
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setFocusedIndex((currentIndex + 1) % itemCount);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setFocusedIndex((currentIndex - 1 + itemCount) % itemCount);
                    break;
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, itemCount, setFocusedIndex]);

    // Mount check for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const triggerWidth = triggerRef.current?.offsetWidth || 0;
    const computedMinWidth = minWidth === 'trigger' ? triggerWidth : minWidth;

    const content = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={contentRef}
                    role="menu"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`core-dropdown-content ${className}`}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        transform: align === 'center' ? 'translateX(-50%)' : align === 'end' ? 'translateX(-100%)' : undefined,
                        zIndex: 'var(--os-z-dropdown, 1000)',
                        minWidth: computedMinWidth || 160,
                        maxHeight: 'calc(100vh - 100px)',
                        overflowY: 'auto',
                        backgroundColor: 'var(--os-color-surface, white)',
                        border: '1px solid var(--os-color-border, #e5e7eb)',
                        borderRadius: 'var(--os-radius-lg, 12px)',
                        boxShadow: 'var(--os-shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.1))',
                        padding: 'var(--os-space-1, 4px)',
                    }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, container || document.body);
}

// ═══════════════════════════════════════════════════════════════════════════
// ITEM
// ═══════════════════════════════════════════════════════════════════════════

export function CoreDropdownItem({
    children,
    icon,
    onSelect,
    disabled = false,
    danger = false,
    className = '',
}: CoreDropdownItemProps) {
    const { setIsOpen, focusedIndex, setFocusedIndex, registerItem, unregisterItem } =
        useDropdownContext();
    const itemRef = useRef<HTMLButtonElement>(null);
    const indexRef = useRef<number>(-1);

    // Register item
    useEffect(() => {
        indexRef.current = registerItem();
        return () => unregisterItem(indexRef.current);
    }, [registerItem, unregisterItem]);

    const isFocused = focusedIndex === indexRef.current;

    // Focus when focused index changes
    useEffect(() => {
        if (isFocused && itemRef.current) {
            itemRef.current.focus();
        }
    }, [isFocused]);

    const handleClick = useCallback(() => {
        if (disabled) return;
        onSelect?.();
        setIsOpen(false);
    }, [disabled, onSelect, setIsOpen]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleClick();
            }
        },
        [handleClick]
    );

    const handleMouseEnter = useCallback(() => {
        if (!disabled) {
            setFocusedIndex(indexRef.current);
        }
    }, [disabled, setFocusedIndex]);

    return (
        <button
            ref={itemRef}
            role="menuitem"
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={handleMouseEnter}
            disabled={disabled}
            className={`core-dropdown-item ${className}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--os-space-2, 8px)',
                width: '100%',
                padding: 'var(--os-space-2, 8px) var(--os-space-3, 12px)',
                fontSize: 'var(--os-font-size-sm, 14px)',
                textAlign: 'left',
                border: 'none',
                borderRadius: 'var(--os-radius-md, 8px)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                backgroundColor: isFocused ? 'var(--os-color-hover, rgba(0,0,0,0.05))' : 'transparent',
                color: danger
                    ? 'var(--os-color-danger, #ef4444)'
                    : 'var(--os-color-text, #1f2937)',
                transition: 'background-color 0.1s ease, color 0.1s ease',
            }}
        >
            {icon && (
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        flexShrink: 0,
                        color: danger
                            ? 'var(--os-color-danger, #ef4444)'
                            : 'var(--os-color-text-muted, #6b7280)',
                    }}
                >
                    {icon}
                </span>
            )}
            <span style={{ flex: 1 }}>{children}</span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function CoreDropdownDivider({ className = '' }: CoreDropdownDividerProps) {
    return (
        <div
            role="separator"
            className={`core-dropdown-divider ${className}`}
            style={{
                height: '1px',
                margin: 'var(--os-space-1, 4px) 0',
                backgroundColor: 'var(--os-color-border, #e5e7eb)',
            }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// LABEL
// ═══════════════════════════════════════════════════════════════════════════

export function CoreDropdownLabel({ children, className = '' }: CoreDropdownLabelProps) {
    return (
        <div
            className={`core-dropdown-label ${className}`}
            style={{
                padding: 'var(--os-space-2, 8px) var(--os-space-3, 12px)',
                fontSize: 'var(--os-font-size-xs, 12px)',
                fontWeight: 500,
                color: 'var(--os-color-text-muted, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            }}
        >
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default CoreDropdown;
