'use client';

/**
 * DevConsoleApp — Window wrapper for Dev Console (Phase 24)
 */

import React from 'react';
import type { AppProps } from '@/components/os-shell/apps/registry';
import { DevConsoleView } from '@/coreos/dev/console/DevConsoleView';

export function DevConsoleApp(_props: AppProps) {
    return <DevConsoleView />;
}

export default DevConsoleApp;
