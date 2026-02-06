# App Manifest Specification v1

> **Phase**: 16 — App Runtime / Third-Party SDK  
> **Status**: ACTIVE  
> **Version**: 1.0

---

## Overview

App Manifest defines the contract between an app and the OS Runtime. Every app (first-party or third-party) MUST declare a manifest before it can be loaded.

---

## Schema

```typescript
interface AppManifest {
    // Required
    appId: string;          // Unique identifier (e.g., "com.example.myapp")
    name: string;           // Display name
    version: string;        // SemVer (e.g., "1.0.0")
    entry: string;          // Entry point path (relative to app root)
    
    // Runtime
    runtime: 'worker' | 'iframe';  // Sandbox type (default: worker)
    
    // Capabilities
    requestedCapabilities: Capability[];  // Capabilities app requests
    
    // Window (optional)
    defaultWindow?: {
        title?: string;
        icon?: string;      // Icon path or emoji
        width?: number;     // Default width in pixels
        height?: number;    // Default height in pixels
        resizable?: boolean;
    };
    
    // Integrity (optional, for future signing)
    integrity?: {
        algorithm?: 'sha256' | 'sha384' | 'sha512';
        hash?: string;
        signature?: string;
    };
    
    // Metadata
    author?: string;
    description?: string;
    homepage?: string;
    license?: string;
}

type Capability = 
    | 'fs.read'
    | 'fs.write'
    | 'fs.temp'
    | 'process.spawn'
    | 'net.fetch'
    | 'ui.window'
    | 'ui.notify'
    | 'audit.read';
```

---

## Example Manifest

### First-Party App (Calculator)

```json
{
    "appId": "os.calculator",
    "name": "Calculator",
    "version": "1.0.0",
    "entry": "workers/calculator.worker.js",
    "runtime": "worker",
    "requestedCapabilities": [],
    "defaultWindow": {
        "title": "Calculator",
        "icon": "🧮",
        "width": 320,
        "height": 480,
        "resizable": false
    }
}
```

### Third-Party App (Note Sync)

```json
{
    "appId": "com.example.notesync",
    "name": "Note Sync",
    "version": "2.1.0",
    "entry": "index.worker.js",
    "runtime": "worker",
    "requestedCapabilities": [
        "fs.read",
        "fs.write",
        "net.fetch",
        "ui.notify"
    ],
    "defaultWindow": {
        "title": "Note Sync",
        "icon": "📝",
        "width": 600,
        "height": 400
    },
    "author": "Example Corp",
    "description": "Sync notes across devices",
    "homepage": "https://example.com/notesync",
    "license": "MIT"
}
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `appId` | Must be unique, lowercase, dots allowed (reverse-domain) |
| `name` | Max 64 characters |
| `version` | Valid SemVer |
| `entry` | Must be relative path, no `..` |
| `runtime` | Must be `worker` or `iframe` |
| `requestedCapabilities` | Must be valid Capability values |

---

## Runtime Behavior

1. **Load**: RuntimeHost reads manifest from app bundle
2. **Validate**: Schema validation + capability check
3. **Grant**: Server policy determines which capabilities are granted
4. **Spawn**: Create Worker/iframe with granted capabilities injected
5. **Register**: Add to RuntimeRegistry + ProcessManagerV2

---

## Security Notes

> [!CAUTION]
> - `requestedCapabilities` is a REQUEST, not a grant
> - Server policy has final say on what's allowed
> - Apps with `net.fetch` must be on allowlist
> - `process.spawn` is first-party only in v1
