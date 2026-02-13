# CORE OS — Production Runbook

> Phase 22C | Last Updated: 2026-02-13

## Architecture Overview

```
┌──────────────┐     HTTP      ┌─────────────────┐
│  coreos-ts   │◄─────────────►│  coreos-worker   │
│  (Next.js)   │   poll/claim  │  (Go binary)     │
│  port 3001   │   heartbeat   │                   │
│              │   result      │                   │
└──────┬───────┘               └───────────────────┘
       │
       ▼
┌──────────────┐
│  Firestore   │
│  (Firebase)  │
└──────────────┘
```

- **coreos-ts**: Next.js API server handling job queue management, ops metrics, and web UI
- **coreos-worker**: Go binary that polls for jobs, processes them, and reports results

---

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ | Service account private key (PEM) |
| `JOB_WORKER_HMAC_SECRET` | ✅ | 64-char hex HMAC secret for worker auth |
| `JOB_TICKET_PUBLIC_KEY` | ✅ | Base64 Ed25519 public key for job tickets |
| `WORKER_ID` | ✅ | Unique worker identifier (e.g. `worker-prod-1`) |
| `COREOS_API_URL` | ✅ | TS API URL (e.g. `http://coreos-ts:3001` in Docker) |
| `PORT` | Optional | TS server port (default: `3001`) |
| `NEXT_PUBLIC_FIREBASE_*` | ✅ | Firebase client SDK config (6 vars) |

Template: `.env.production.sample`

---

## Deployment

### Option A: Docker Compose (Recommended for single-host)

```bash
# Start
./scripts/prod-up.sh

# Verify
./scripts/smoke-prod.sh

# Stop
./scripts/prod-down.sh
```

### Option B: Separated Deployment

**TS API** (Vercel / Cloud Run / VM):
```bash
npm run build
npm run start
# or: docker build -f Dockerfile.ts -t coreos-ts .
```

**Go Worker** (VM / Cloud Run):
```bash
cd worker && go build -o coreos-worker .
./coreos-worker
# or: docker build -f Dockerfile.worker -t coreos-worker .
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:3001/api/worker/health
# → {"status":"ok","timestamp":"..."}
```

### Ops Metrics
```bash
# Summary (counters + rates)
curl http://localhost:3001/api/ops/metrics/summary

# Timeseries (latency buckets)
curl http://localhost:3001/api/ops/metrics/timeseries?metric=job_latency&window=60m

# Stuck jobs
curl http://localhost:3001/api/ops/jobs/stuck
```

### Ops Center UI
Navigate to `http://localhost:3001/ops` for the dashboard.

---

## Rollback

1. **Container rollback**: Tag images before deploying
   ```bash
   docker tag coreos-ts:latest coreos-ts:prev
   docker tag coreos-worker:latest coreos-worker:prev
   ```
2. **Rollback**: 
   ```bash
   docker compose down
   docker tag coreos-ts:prev coreos-ts:latest
   docker tag coreos-worker:prev coreos-worker:latest
   docker compose up -d
   ```
3. **Vercel**: Use Vercel dashboard → Deployments → Redeploy previous

---

## Scaling Workers

### Single Worker (Default)
The compose file runs one worker (`worker-docker-1`).

### Multiple Workers
```yaml
# docker-compose.override.yml
services:
  coreos-worker-2:
    extends:
      service: coreos-worker
    container_name: coreos-worker-2
    environment:
      - WORKER_ID=worker-docker-2
```

**⚠️ Claim/Lease Safety**: The job system uses Firestore transactions for claim, so multiple workers are safe. Each worker gets a unique `WORKER_ID`.

**Considerations**:
- Each worker polls independently (5s interval)
- Firestore transaction contention increases with more workers
- Monitor `claim_conflict` counter in ops metrics

---

## Incident Playbook

### Job Stuck (PROCESSING > lease timeout)

1. Check `/api/ops/jobs/stuck` for affected jobs
2. Verify worker is running: `docker ps | grep coreos-worker`
3. Check worker logs: `docker compose logs coreos-worker --tail=100`
4. If worker crashed: `docker compose restart coreos-worker`
5. Stuck jobs with expired lease will be re-claimed automatically on next poll

### Dead-Letter Spike

1. Check `/api/ops/metrics/summary` for `deadRate`
2. Review audit logs in Firestore (`platform_audit_logs` collection)
3. Filter by `type: 'job.dead'` to find failing job types
4. Check worker logs for error patterns
5. Fix root cause → jobs can be manually re-enqueued

### Lease Expired

1. Usually caused by: worker crash, network timeout, or handler taking too long
2. The job will stay `PROCESSING` until lease expires, then become claimable again
3. Increase `leaseDurationMs` in enqueue if handlers need more time
4. Check heartbeat frequency in worker logs

### Worker Not Picking Up Jobs

1. Verify `COREOS_API_URL` is reachable from worker container
2. Check `JOB_WORKER_HMAC_SECRET` matches between TS and worker
3. Run `docker compose logs coreos-worker` for errors
4. Test claim manually: `curl http://localhost:3001/api/jobs/claim`

---

## Container Resource Limits (Optional)

```yaml
# docker-compose.override.yml
services:
  coreos-ts:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
  coreos-worker:
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.5'
```
