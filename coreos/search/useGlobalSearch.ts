'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useGlobalSearch — Phase 17N (Global Search / Spotlight)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * React hook managing search state, keyboard navigation, and action dispatch.
 *
 * @module coreos/search/useGlobalSearch
 * @version 1.0.0
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { buildIndex } from './searchIndex';
import { search } from './searchEngine';
import type { SearchResult, SearchAction } from './searchTypes';

interface GlobalSearchState {
    isOpen: boolean;
    query: string;
    results: SearchResult[];
    selectedIndex: number;
}

interface UseGlobalSearchReturn {
    state: GlobalSearchState;
    open: () => void;
    close: () => void;
    toggle: () => void;
    setQuery: (q: string) => void;
    selectNext: () => void;
    selectPrev: () => void;
    executeSelected: () => void;
    executeAction: (action: SearchAction) => void;
}

export function useGlobalSearch(
    onAction?: (action: SearchAction) => void,
): UseGlobalSearchReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQueryRaw] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Build index once (cached)
    const index = useMemo(() => buildIndex(), []);

    // Search results (computed from debounced query)
    const results = useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        return search(debouncedQuery, index, 10);
    }, [debouncedQuery, index]);

    // Debounced query update (50ms — feels instant)
    const setQuery = useCallback((q: string) => {
        setQueryRaw(q);
        setSelectedIndex(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedQuery(q);
        }, 50);
    }, []);

    const open = useCallback(() => {
        setIsOpen(true);
        setQueryRaw('');
        setDebouncedQuery('');
        setSelectedIndex(0);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setQueryRaw('');
        setDebouncedQuery('');
        setSelectedIndex(0);
    }, []);

    const toggle = useCallback(() => {
        if (isOpen) close();
        else open();
    }, [isOpen, open, close]);

    const selectNext = useCallback(() => {
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    }, [results.length]);

    const selectPrev = useCallback(() => {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
    }, []);

    const executeAction = useCallback((action: SearchAction) => {
        close();
        if (onAction) {
            onAction(action);
        }
    }, [close, onAction]);

    const executeSelected = useCallback(() => {
        if (results.length > 0 && selectedIndex < results.length) {
            executeAction(results[selectedIndex].item.action);
        }
    }, [results, selectedIndex, executeAction]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return {
        state: { isOpen, query, results, selectedIndex },
        open,
        close,
        toggle,
        setQuery,
        selectNext,
        selectPrev,
        executeSelected,
        executeAction,
    };
}
