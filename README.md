# APICOREDATA Platform V2 (Clean)

This is the clean, standalone repository for the APICOREDATA Platform V2, focusing on the new macOS-grade design system and streamlined architecture.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run development server:**
    ```bash
    npm run dev
    ```

## Legacy Note
This repo replaces `super-platform` and `seo-dashboard`. Legacy code is NOT included here.

---

## Local E2E (TS + Go Worker) Quickstart

### Terminal A — TS Dev Server
```bash
./scripts/dev-ts.sh
```

### Terminal B — Go Worker
```bash
./scripts/kill-workers.sh && ./scripts/dev-worker.sh
```

### Terminal C — Smoke Test
```bash
./scripts/smoke-job.sh scheduler.tick local-e2e
```

Or just print the guide:
```bash
./scripts/quick-e2e.sh
```
