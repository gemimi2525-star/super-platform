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

### 🔒 Private / Server-Only (NEVER expose to client or build logs)

| Variable | Service | Description |
|---|---|---|
| `FIREBASE_PRIVATE_KEY` | TS | Firebase Admin SDK private key (PEM) |
| `ATTESTATION_PRIVATE_KEY` | TS | Ed25519 private key (64-char hex) for job ticket signing |
| `JOB_WORKER_HMAC_SECRET` | TS + Worker | 64-char hex HMAC secret for worker authentication |

### 🔑 Shared / Public-OK (safe for deploy env, but not build logs)

| Variable | Service | Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | TS | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | TS | Service account email |
| `ATTESTATION_PUBLIC_KEY` | TS | Ed25519 public key (64-char hex) for attestation verification |
| `JOB_TICKET_PUBLIC_KEY` | Worker | Base64 Ed25519 public key (same as `ATTESTATION_PUBLIC_KEY`, base64-encoded) |
| `WORKER_ID` | Worker | Unique worker identifier (e.g. `worker-prod-1`) |
| `COREOS_API_URL` | Worker | TS API URL (e.g. `http://coreos-ts:3001` in Docker) |
| `PORT` | TS | Server port (default: `3001`) |

### 🌐 Build-Time / Client-Side (NEXT_PUBLIC_*)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_AUTH_MODE` | Auth mode (firebase / bypass) |
| `NEXT_PUBLIC_SUPER_ADMIN_ID` | Super admin UID |

> **⚠️ Build-time vars**: These are baked into the JS bundle at `next build` time. They must be passed as Docker build args (see `docker-compose.yml` → `args`).

Template: `.env.production.sample`

---

## Key Rotation

### Ed25519 Attestation Keys (ATTESTATION_* + JOB_TICKET_PUBLIC_KEY)

**When to rotate**: Suspected key compromise, employee offboarding, or on quarterly schedule.

**Procedure**:

1. Generate new key pair:
   ```bash
   node -e "
   const { generateKeyPairSync } = require('crypto');
   const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
     privateKeyEncoding: { type: 'pkcs8', format: 'der' },
     publicKeyEncoding: { type: 'spki', format: 'der' },
   });
   const pub = publicKey.subarray(-32), priv = privateKey.subarray(-32);
   console.log('ATTESTATION_PRIVATE_KEY=' + priv.toString('hex'));
   console.log('ATTESTATION_PUBLIC_KEY=' + pub.toString('hex'));
   console.log('JOB_TICKET_PUBLIC_KEY=' + pub.toString('base64'));
   "
   ```

2. Update **all three** vars simultaneously on the deployment platform (Vercel / Docker env):
   - `ATTESTATION_PRIVATE_KEY` (TS server)
   - `ATTESTATION_PUBLIC_KEY` (TS server)
   - `JOB_TICKET_PUBLIC_KEY` (Go worker)

3. Restart both services:
   ```bash
   docker compose restart coreos-ts coreos-worker
   ```

4. Verify with smoke test:
   ```bash
   ./scripts/smoke-prod.sh
   ```

**⚠️ Impact**: Jobs enqueued with the OLD key will fail verification by the worker. They will become `DEAD` after max retries. Only rotate during a maintenance window or when the queue is empty.

### HMAC Secret (JOB_WORKER_HMAC_SECRET)

Same procedure but only affects worker authentication. Update on both TS and Worker simultaneously.

### Firebase Keys

Rotate via Firebase Console → Project Settings → Service Accounts → Generate New Private Key.

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
