
'use client';

import React from 'react';
import { VerifierAppV0 } from '@/coreos/ui/VerifierAppV0';

export default function VerifierPage() {
    return (
        <div style={{ padding: 40, background: '#000', minHeight: '100vh', color: '#fff' }}>
            <h1>🔐 Core OS Verifier Suite</h1>
            <p style={{ color: '#888', marginBottom: 20 }}>
                Direct Access Route (Phase 15A.1 Safety Hatch)
            </p>
            <div style={{ border: '1px solid #333', padding: 20, borderRadius: 8, background: '#111' }}>
                <VerifierAppV0 />
            </div>
        </div>
    );
}
