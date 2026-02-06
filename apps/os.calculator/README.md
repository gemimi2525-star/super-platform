# os.calculator

First sandboxed app demonstrating Runtime Contract v1.

## Features

- Basic calculator operations (+, −, ×, ÷)
- Result persistence via `fs.temp`
- Copy result notification via `ui.notify`
- Runs in isolated Worker runtime

## Capabilities

- `ui.window` — Opens calculator window
- `ui.notify` — Shows copy notification
- `fs.temp` — Saves last result

## Architecture

```
┌─────────────────────────────────────────────┐
│           os.calculator Runtime             │
├─────────────────────────────────────────────┤
│                                             │
│  manifest.json → RuntimeHost                │
│        ↓                                    │
│  Worker (worker.ts) ← SDK Bridge            │
│        ↓                                    │
│  Calculator Logic                           │
│        ↓                                    │
│  IPC ↔ UI (ui.tsx in host window)          │
│                                             │
└─────────────────────────────────────────────┘
```

## Running

1. Open Ops Center → App Launcher
2. Click "Launch os.calculator"
3. Window opens with calculator interface

## Testing

### Verifier R7-R9
- R7: Launch → window opens + process RUNNING
- R8: fs.temp write/read → PASS + audited
- R9: fs.write attempt (denied) → DENY + audited

### Manual
1. Perform calculations
2. Click copy button → see notification
3. Check TaskManagerV2 → see os.calculator process
4. Check audit logs → see traced actions

## File Structure

```
apps/os.calculator/
├── manifest.json    — App manifest
├── worker.ts        — Calculator logic (Worker runtime)
├── ui.tsx           — Calculator UI component
└── README.md        — This file
```
