'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useDeviceIdentity — Phase 15D.A
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * React hook for accessing the persistent device identifier.
 *
 * @module coreos/device/useDeviceIdentity
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { getOrCreateDeviceId } from './deviceIdentity';

interface DeviceIdentityResult {
    deviceId: string;
    isReady: boolean;
}

export function useDeviceIdentity(): DeviceIdentityResult {
    const [deviceId, setDeviceId] = useState<string>('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const id = getOrCreateDeviceId();
        setDeviceId(id);
        setIsReady(true);
    }, []);

    return { deviceId, isReady };
}
