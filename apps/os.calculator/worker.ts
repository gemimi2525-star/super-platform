/**
 * os.calculator Worker Runtime
 * 
 * Calculator logic running in sandboxed worker.
 * Uses Runtime Bridge SDK for all OS interactions.
 */

import { RuntimeBridgeSDK } from '@/lib/sdk';

// Calculator State
interface CalculatorState {
    display: string;
    currentValue: number;
    previousValue: number | null;
    operator: string | null;
    waitingForOperand: boolean;
}

let state: CalculatorState = {
    display: '0',
    currentValue: 0,
    previousValue: null,
    operator: null,
    waitingForOperand: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// State Persistence (fs.temp)
// ═══════════════════════════════════════════════════════════════════════════

async function saveState() {
    try {
        const result = await RuntimeBridgeSDK.writeTemp(
            'calc-state.json',
            JSON.stringify({ lastResult: state.currentValue })
        );
        if (result.success) {
            console.log('[Calculator] State saved');
        }
    } catch (e) {
        console.error('[Calculator] Failed to save state:', e);
    }
}

async function loadState() {
    try {
        const result = await RuntimeBridgeSDK.readTemp('calc-state.json');
        if (result.success && result.data) {
            const data = JSON.parse(result.data.data as string);
            state.currentValue = data.lastResult || 0;
            state.display = String(state.currentValue);
            sendToUI({ type: 'STATE_UPDATE', state });
        }
    } catch (e) {
        console.log('[Calculator] No previous state found');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Calculator Logic
// ═══════════════════════════════════════════════════════════════════════════

function calculate(a: number, b: number, op: string): number {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case '÷': return b !== 0 ? a / b : 0;
        default: return b;
    }
}

function handleNumber(digit: string) {
    if (state.waitingForOperand) {
        state.display = digit;
        state.waitingForOperand = false;
    } else {
        state.display = state.display === '0' ? digit : state.display + digit;
    }
    state.currentValue = parseFloat(state.display);
    sendToUI({ type: 'STATE_UPDATE', state });
}

function handleOperator(nextOperator: string) {
    const inputValue = state.currentValue;

    if (state.previousValue === null) {
        state.previousValue = inputValue;
    } else if (state.operator) {
        const result = calculate(state.previousValue, inputValue, state.operator);
        state.display = String(result);
        state.currentValue = result;
        state.previousValue = result;
    }

    state.waitingForOperand = true;
    state.operator = nextOperator;
    sendToUI({ type: 'STATE_UPDATE', state });
}

function handleEquals() {
    if (state.operator && state.previousValue !== null) {
        const result = calculate(state.previousValue, state.currentValue, state.operator);
        state.display = String(result);
        state.currentValue = result;
        state.previousValue = null;
        state.operator = null;
        state.waitingForOperand = true;
        sendToUI({ type: 'STATE_UPDATE', state });
        saveState(); // Save result
    }
}

function handleClear() {
    state = {
        display: '0',
        currentValue: 0,
        previousValue: null,
        operator: null,
        waitingForOperand: false,
    };
    sendToUI({ type: 'STATE_UPDATE', state });
}

function handleDecimal() {
    if (state.waitingForOperand) {
        state.display = '0.';
        state.waitingForOperand = false;
    } else if (state.display.indexOf('.') === -1) {
        state.display += '.';
    }
    sendToUI({ type: 'STATE_UPDATE', state });
}

async function handleCopy() {
    // Use notification capability
    await RuntimeBridgeSDK.notify({
        title: 'Calculator',
        message: `Copied: ${state.display}`,
        type: 'success',
        duration: 2000,
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// IPC Communication
// ═══════════════════════════════════════════════════════════════════════════

function sendToUI(message: any) {
    self.postMessage(message);
}

// Listen for messages from UI
self.addEventListener('message', async (event) => {
    const { type, payload } = event.data;

    // Skip SDK internal messages
    if (type === 'INIT' || type === 'INTENT_RESPONSE') {
        return;
    }

    switch (type) {
        case 'BUTTON_CLICK':
            const { button } = payload;
            if (button >= '0' && button <= '9') {
                handleNumber(button);
            } else if (['+', '-', '×', '÷'].includes(button)) {
                handleOperator(button);
            } else if (button === '=') {
                handleEquals();
            } else if (button === 'C') {
                handleClear();
            } else if (button === '.') {
                handleDecimal();
            } else if (button === 'COPY') {
                await handleCopy();
            }
            break;

        case 'INIT_UI':
            // Load saved state on init
            await loadState();
            sendToUI({ type: 'STATE_UPDATE', state });
            break;
    }
});

// Initial state
console.log('[Calculator Worker] Initialized');
