'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PerfHud — Dev-only Performance Overlay (Phase 23)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Fixed overlay (top-right). Toggle: Alt+Cmd+P (⌥⌘P).
 * Shows FPS, render counts, EventBus metrics, store sizes.
 * SSR-safe. Never rendered in production.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMetricsSnapshot } from '@/coreos/events/metrics';
import { getRenderSnapshot } from './useRenderCounter';

export function PerfHud() {
    const [visible, setVisible] = useState(false);
    const [fps, setFps] = useState(0);
    const [tick, setTick] = useState(0);
    const lastFrameRef = useRef(performance.now());
    const frameCountRef = useRef(0);

    // Toggle with ⌥⌘P
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.altKey && e.metaKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setVisible(v => !v);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // FPS counter via RAF
    useEffect(() => {
        if (!visible) return;
        let rafId = 0;
        const loop = (now: number) => {
            frameCountRef.current++;
            const elapsed = now - lastFrameRef.current;
            if (elapsed >= 1000) {
                setFps(Math.round((frameCountRef.current / elapsed) * 1000));
                frameCountRef.current = 0;
                lastFrameRef.current = now;
            }
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [visible]);

    // Refresh data every 500ms
    useEffect(() => {
        if (!visible) return;
        const timer = setInterval(() => setTick(t => t + 1), 500);
        return () => clearInterval(timer);
    }, [visible]);

    const getSnapshot = useCallback(() => {
        void tick; // consume to re-read
        return {
            metrics: getMetricsSnapshot(),
            renders: getRenderSnapshot(),
        };
    }, [tick]);

    if (!visible) return null;

    const { metrics, renders } = getSnapshot();

    return (
        <div style={{
            position: 'fixed',
            top: 36,
            right: 8,
            width: 260,
            maxHeight: 400,
            overflow: 'auto',
            background: 'rgba(0,0,0,0.88)',
            color: '#00ff88',
            fontFamily: '"SF Mono", Monaco, Consolas, monospace',
            fontSize: 11,
            lineHeight: 1.5,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid rgba(0,255,136,0.2)',
            zIndex: 99999,
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
        }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#00ff88' }}>⚡ PERF HUD</div>

            {/* FPS */}
            <Row label="FPS" value={fps} color={fps >= 50 ? '#00ff88' : fps >= 30 ? '#ffcc00' : '#ff4444'} />

            {/* EventBus */}
            <div style={{ borderTop: '1px solid rgba(0,255,136,0.15)', margin: '6px 0', paddingTop: 4 }}>
                <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>EVENT BUS</div>
                <Row label="Published" value={metrics.publishedTotal} />
                <Row label="Delivered" value={metrics.deliveredTotal} />
                <Row label="Deduped" value={metrics.dedupedTotal} color="#ffcc00" />
                <Row label="Dropped" value={metrics.droppedTotal} color={metrics.droppedTotal > 0 ? '#ff4444' : '#00ff88'} />
                <Row label="Buffer" value={metrics.bufferSize} />
            </div>

            {/* Domains */}
            {Object.keys(metrics.byDomain).length > 0 && (
                <div style={{ borderTop: '1px solid rgba(0,255,136,0.15)', margin: '6px 0', paddingTop: 4 }}>
                    <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>BY DOMAIN</div>
                    {Object.entries(metrics.byDomain).map(([k, v]) => (
                        <Row key={k} label={k} value={v} />
                    ))}
                </div>
            )}

            {/* Render Counts */}
            {Object.keys(renders).length > 0 && (
                <div style={{ borderTop: '1px solid rgba(0,255,136,0.15)', margin: '6px 0', paddingTop: 4 }}>
                    <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>RENDER COUNTS</div>
                    {Object.entries(renders).map(([k, v]) => (
                        <Row key={k} label={k} value={v} />
                    ))}
                </div>
            )}

            <div style={{ fontSize: 9, color: '#475569', marginTop: 4, textAlign: 'center' }}>
                ⌥⌘P to toggle
            </div>
        </div>
    );
}

function Row({ label, value, color = '#e2e8f0' }: { label: string; value: number; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
            <span style={{ color: '#94a3b8' }}>{label}</span>
            <span style={{ color, fontWeight: 600 }}>{value}</span>
        </div>
    );
}

export default PerfHud;
