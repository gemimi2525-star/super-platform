/**
 * Calculator UI Component
 * 
 * Renders calculator interface and communicates with worker via IPC.
 */

'use client';

import { useEffect, useState, useRef } from 'react';

interface CalculatorState {
    display: string;
    currentValue: number;
    previousValue: number | null;
    operator: string | null;
    waitingForOperand: boolean;
}

interface CalculatorUIProps {
    worker: Worker;
    onClose?: () => void;
}

export function CalculatorUI({ worker, onClose }: CalculatorUIProps) {
    const [state, setState] = useState<CalculatorState>({
        display: '0',
        currentValue: 0,
        previousValue: null,
        operator: null,
        waitingForOperand: false,
    });

    useEffect(() => {
        // Listen for state updates from worker
        const handleMessage = (event: MessageEvent) => {
            const { type, state: newState } = event.data;
            if (type === 'STATE_UPDATE') {
                setState(newState);
            }
        };

        worker.addEventListener('message', handleMessage);

        // Initialize UI
        worker.postMessage({ type: 'INIT_UI' });

        return () => {
            worker.removeEventListener('message', handleMessage);
        };
    }, [worker]);

    const handleButtonClick = (button: string) => {
        worker.postMessage({
            type: 'BUTTON_CLICK',
            payload: { button },
        });
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
        }}>
            {/* Display */}
            <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: 16,
                textAlign: 'right',
                fontSize: 32,
                fontWeight: 'bold',
                color: 'white',
                fontFamily: 'monospace',
                minHeight: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                wordBreak: 'break-all',
            }}>
                {state.display}
            </div>

            {/* Buttons */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                flex: 1,
            }}>
                {/* Row 1 */}
                <CalcButton onClick={() => handleButtonClick('C')} variant="danger">C</CalcButton>
                <CalcButton onClick={() => handleButtonClick('COPY')} variant="secondary">📋</CalcButton>
                <CalcButton onClick={() => handleButtonClick('÷')} variant="operator">÷</CalcButton>
                <CalcButton onClick={() => handleButtonClick('×')} variant="operator">×</CalcButton>

                {/* Row 2 */}
                <CalcButton onClick={() => handleButtonClick('7')}>7</CalcButton>
                <CalcButton onClick={() => handleButtonClick('8')}>8</CalcButton>
                <CalcButton onClick={() => handleButtonClick('9')}>9</CalcButton>
                <CalcButton onClick={() => handleButtonClick('-')} variant="operator">−</CalcButton>

                {/* Row 3 */}
                <CalcButton onClick={() => handleButtonClick('4')}>4</CalcButton>
                <CalcButton onClick={() => handleButtonClick('5')}>5</CalcButton>
                <CalcButton onClick={() => handleButtonClick('6')}>6</CalcButton>
                <CalcButton onClick={() => handleButtonClick('+')} variant="operator">+</CalcButton>

                {/* Row 4 */}
                <CalcButton onClick={() => handleButtonClick('1')}>1</CalcButton>
                <CalcButton onClick={() => handleButtonClick('2')}>2</CalcButton>
                <CalcButton onClick={() => handleButtonClick('3')}>3</CalcButton>
                <CalcButton onClick={() => handleButtonClick('=')} variant="equals" style={{ gridRow: 'span 2' }}>=</CalcButton>

                {/* Row 5 */}
                <CalcButton onClick={() => handleButtonClick('0')} style={{ gridColumn: 'span 2' }}>0</CalcButton>
                <CalcButton onClick={() => handleButtonClick('.')}>.</CalcButton>
            </div>

            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: 4,
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 12,
                    }}
                >
                    Close
                </button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Button Component
// ═══════════════════════════════════════════════════════════════════════════

interface CalcButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'number' | 'operator' | 'equals' | 'danger' | 'secondary';
    style?: React.CSSProperties;
}

function CalcButton({ onClick, children, variant = 'number', style }: CalcButtonProps) {
    const getBackground = () => {
        switch (variant) {
            case 'operator': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            case 'equals': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
            case 'danger': return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
            case 'secondary': return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
            default: return 'rgba(255,255,255,0.2)';
        }
    };

    return (
        <button
            onClick={onClick}
            style={{
                background: getBackground(),
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.1s',
                minHeight: 60,
                ...style,
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {children}
        </button>
    );
}
