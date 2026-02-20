'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SpotlightOverlay — Phase 17N (Global Search)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * macOS-Spotlight-style overlay for instant global search.
 * Centered modal with blur backdrop, highlighted matches, keyboard nav.
 *
 * @module components/os-shell/SpotlightOverlay
 * @version 1.0.0
 */

import React, { useRef, useEffect } from 'react';
import type { SearchResult, SearchAction } from '@/coreos/search/searchTypes';
import { KIND_PRIORITY } from '@/coreos/search/searchTypes';

interface SpotlightOverlayProps {
    isOpen: boolean;
    query: string;
    results: SearchResult[];
    selectedIndex: number;
    onQueryChange: (q: string) => void;
    onSelectNext: () => void;
    onSelectPrev: () => void;
    onExecuteSelected: () => void;
    onExecuteAction: (action: SearchAction) => void;
    onClose: () => void;
}

const KIND_LABELS: Record<string, string> = {
    app: 'App',
    command: 'Command',
    file: 'File',
    setting: 'Setting',
};

export function SpotlightOverlay({
    isOpen,
    query,
    results,
    selectedIndex,
    onQueryChange,
    onSelectNext,
    onSelectPrev,
    onExecuteSelected,
    onExecuteAction,
    onClose,
}: SpotlightOverlayProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Auto-focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && selectedIndex >= 0) {
            const items = listRef.current.querySelectorAll('[data-search-item]');
            items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                onSelectNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                onSelectPrev();
                break;
            case 'Enter':
                e.preventDefault();
                onExecuteSelected();
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    };

    // Group results by kind for display
    const groupedByKind = results.reduce<Record<string, { result: SearchResult; globalIndex: number }[]>>((acc, result, globalIndex) => {
        const kind = result.item.kind;
        if (!acc[kind]) acc[kind] = [];
        acc[kind].push({ result, globalIndex });
        return acc;
    }, {});

    // Sort groups by kind priority
    const sortedKinds = Object.keys(groupedByKind).sort(
        (a, b) => (KIND_PRIORITY[a as keyof typeof KIND_PRIORITY] ?? 9) - (KIND_PRIORITY[b as keyof typeof KIND_PRIORITY] ?? 9)
    );

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingTop: '18vh',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                animation: 'spotlightFadeIn 0.15s ease-out',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    width: '620px',
                    maxWidth: '90vw',
                    background: 'rgba(30, 30, 30, 0.92)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                    overflow: 'hidden',
                    animation: 'spotlightSlideIn 0.2s ease-out',
                }}
            >
                {/* Search input */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 18px',
                    gap: '12px',
                    borderBottom: results.length > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                    <span style={{ fontSize: '20px', opacity: 0.5 }}>🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search apps, commands, settings…"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 300,
                            fontFamily: 'var(--nx-font-system, -apple-system, BlinkMacSystemFont, sans-serif)',
                            letterSpacing: '-0.01em',
                        }}
                    />
                    {query && (
                        <kbd style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.3)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}>ESC</kbd>
                    )}
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div
                        ref={listRef}
                        style={{
                            maxHeight: '380px',
                            overflowY: 'auto',
                            padding: '6px 0',
                        }}
                    >
                        {sortedKinds.map((kind) => (
                            <div key={kind}>
                                <div style={{
                                    padding: '6px 18px 4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'rgba(255,255,255,0.35)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                }}>
                                    {KIND_LABELS[kind] || kind}
                                </div>
                                {groupedByKind[kind].map(({ result, globalIndex }) => (
                                    <div
                                        key={result.item.id}
                                        data-search-item
                                        onClick={() => onExecuteAction(result.item.action)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px 18px',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            background: globalIndex === selectedIndex
                                                ? 'rgba(59, 130, 246, 0.35)'
                                                : 'transparent',
                                            borderRadius: globalIndex === selectedIndex ? '8px' : '0',
                                            margin: globalIndex === selectedIndex ? '0 6px' : '0',
                                            transition: 'background 0.1s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (globalIndex !== selectedIndex) {
                                                (e.currentTarget.style.background) = 'rgba(255,255,255,0.04)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (globalIndex !== selectedIndex) {
                                                (e.currentTarget.style.background) = 'transparent';
                                            }
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '22px',
                                            width: '32px',
                                            textAlign: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {result.item.icon}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                color: '#fff',
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                <HighlightedText
                                                    text={result.item.title}
                                                    ranges={result.matchedRanges}
                                                />
                                            </div>
                                            {result.item.subtitle && (
                                                <div style={{
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {result.item.subtitle}
                                                </div>
                                            )}
                                        </div>
                                        {globalIndex === selectedIndex && (
                                            <kbd style={{
                                                fontSize: '10px',
                                                color: 'rgba(255,255,255,0.4)',
                                                padding: '2px 5px',
                                                borderRadius: '3px',
                                                background: 'rgba(255,255,255,0.08)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                flexShrink: 0,
                                            }}>↵</kbd>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {query.trim() && results.length === 0 && (
                    <div style={{
                        padding: '24px 18px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '14px',
                    }}>
                        No results for &quot;{query}&quot;
                    </div>
                )}

                {/* Footer hint */}
                {!query.trim() && (
                    <div style={{
                        padding: '12px 18px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: '12px',
                    }}>
                        Search apps, commands, settings…
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes spotlightFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spotlightSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGHLIGHT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function HighlightedText({ text, ranges }: { text: string; ranges: [number, number][] }) {
    if (!ranges.length) return <>{text}</>;

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const [start, end] of ranges) {
        if (start > lastEnd) {
            parts.push(<span key={`t-${lastEnd}`}>{text.slice(lastEnd, start)}</span>);
        }
        parts.push(
            <span key={`h-${start}`} style={{
                color: '#60a5fa',
                fontWeight: 600,
            }}>
                {text.slice(start, end)}
            </span>
        );
        lastEnd = end;
    }

    if (lastEnd < text.length) {
        parts.push(<span key={`t-${lastEnd}`}>{text.slice(lastEnd)}</span>);
    }

    return <>{parts}</>;
}
