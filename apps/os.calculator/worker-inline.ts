/**
 * os.calculator Inline Worker (No external imports)
 * 
 * Self-contained worker for calculator logic without SDK dependencies.
 * Uses direct postMessage for all communication.
 */

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
    console.log('[calc-worker] handleNumber:', digit);
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
    console.log('[calc-worker] handleOperator:', nextOperator);
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
    console.log('[calc-worker] handleEquals');
    if (state.operator && state.previousValue !== null) {
        const result = calculate(state.previousValue, state.currentValue, state.operator);
        state.display = String(result);
        state.currentValue = result;
        state.previousValue = null;
        state.operator = null;
        state.waitingForOperand = true;
        sendToUI({ type: 'STATE_UPDATE', state });
    }
}

function handleClear() {
    console.log('[calc-worker] handleClear');
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
    console.log('[calc-worker] handleDecimal');
    if (state.waitingForOperand) {
        state.display = '0.';
        state.waitingForOperand = false;
    } else if (state.display.indexOf('.') === -1) {
        state.display += '.';
    }
    sendToUI({ type: 'STATE_UPDATE', state });
}

async function handleCopy() {
    console.log('[calc-worker] handleCopy:', state.display);
    // Send notification request to parent
    sendToUI({
        type: 'NOTIFICATION_REQUEST',
        payload: {
            title: 'Calculator',
            message: `Copied: ${state.display}`,
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// IPC Communication
// ═══════════════════════════════════════════════════════════════════════════

function sendToUI(message: any) {
    console.log('[calc-worker] send:', message.type);
    self.postMessage(message);
}

// Listen for messages from UI
self.addEventListener('message', async (event) => {
    const { type, payload } = event.data;
    console.log('[calc-worker] recv:', type, payload);

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
            console.log('[calc-worker] INIT_UI received');
            sendToUI({ type: 'STATE_UPDATE', state });
            break;
    }
});

// Initial state
console.log('[Calculator Worker] Initialized (inline version)');
sendToUI({ type: 'READY' });
