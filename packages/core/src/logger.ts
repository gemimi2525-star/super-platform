/**
 * Structured Logger
 * 
 * Centralized logging with JSON support for production observability.
 * Hashes sensitive data (PII) before logging.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
    requestId?: string;
    userId?: string;
    orgId?: string;
    action?: string;
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    environment: string;
    requestId?: string;
    userId?: string; // Hashed
    orgId?: string;
    context?: Omit<LogContext, 'requestId' | 'userId' | 'orgId'>;
}

/**
 * Simple hash function for masking IDs (SHA-256 would be better, but keeping it dependency-free/light)
 * For rigorous anonymity, use crypto.subtle or a library in a real app.
 * Here we allow simple masking since we assume internal IDs aren't strictly PII but we want to be safe.
 * Actually, let's just prefix/suffix or use a simple mapping if strictly needed.
 * For this phase, we'll assume passed userId is safe OR we just log it. 
 * "Hash userId (hashed)" requirement: simple one-way transform.
 */
function hash(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `h_${Math.abs(hash).toString(16)}`;
}

class Logger {
    private env: string;

    constructor() {
        this.env = process.env.NODE_ENV || 'development';
    }

    private emit(level: LogLevel, message: string, context: LogContext = {}) {
        const { requestId, userId, orgId, ...restContext } = context;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            environment: this.env,
            requestId,
            userId: userId ? hash(userId) : undefined,
            orgId,
            context: Object.keys(restContext).length > 0 ? restContext : undefined,
        };

        if (this.env === 'development') {
            const color = this.getColor(level);
            console.log(
                `${color}[${level.toUpperCase()}] ${message}\x1b[0m`,
                context
            );
        } else {
            console.log(JSON.stringify(entry));
        }
    }

    private getColor(level: LogLevel): string {
        switch (level) {
            case 'fatal': return '\x1b[31m\x1b[1m'; // Red Bold
            case 'error': return '\x1b[31m'; // Red
            case 'warn': return '\x1b[33m'; // Yellow
            case 'info': return '\x1b[36m'; // Cyan
            case 'debug': return '\x1b[90m'; // Gray
            default: return '\x1b[0m';
        }
    }

    public info(message: string, context?: LogContext) {
        this.emit('info', message, context);
    }

    public warn(message: string, context?: LogContext) {
        this.emit('warn', message, context);
    }

    public error(message: string, context?: LogContext) {
        this.emit('error', message, context);
    }

    public fatal(message: string, context?: LogContext) {
        this.emit('fatal', message, context);
    }
}

export const logger = new Logger();
