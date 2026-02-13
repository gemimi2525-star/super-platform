// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — Worker Polling Loop (Phase 22A)
// ═══════════════════════════════════════════════════════════════════════════
//
// Main polling loop with lease/heartbeat, retry reporting, graceful shutdown,
// and structured logging.

package worker

import (
	"context"
	"encoding/base64"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gemimi2525-star/super-platform/worker/client"
	"github.com/gemimi2525-star/super-platform/worker/config"
	"github.com/gemimi2525-star/super-platform/worker/contracts"
	"github.com/gemimi2525-star/super-platform/worker/jobs"
)

// Worker is the main polling loop.
type Worker struct {
	config     *config.Config
	dispatcher *jobs.Dispatcher
	apiClient  *client.APIClient
	publicKey  []byte

	// Graceful shutdown
	mu         sync.Mutex
	processing bool // true if currently executing a job
}

// New creates a new Worker instance.
func New(cfg *config.Config) (*Worker, error) {
	// Decode public key from base64
	pubKey, err := base64.StdEncoding.DecodeString(cfg.PublicKeyBase64)
	if err != nil {
		return nil, err
	}

	return &Worker{
		config:     cfg,
		dispatcher: jobs.NewDispatcher(),
		apiClient:  client.NewAPIClient(cfg.APIURL, cfg.HTTPTimeout),
		publicKey:  pubKey,
	}, nil
}

// Run starts the polling loop. Blocks until SIGTERM/SIGINT or context cancel.
func (w *Worker) Run(ctx context.Context) {
	log.Printf("[Worker] Starting %s (poll every %s)", w.config.WorkerID, w.config.PollInterval)

	// Set up signal handler for graceful shutdown
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer cancel()

	ticker := time.NewTicker(w.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			w.mu.Lock()
			isProcessing := w.processing
			w.mu.Unlock()

			if isProcessing {
				log.Printf("[Worker] Received shutdown signal, waiting for current job to finish...")
			} else {
				log.Printf("[Worker] Received shutdown signal, no active job — exiting cleanly")
			}
			// Wait briefly for current job to finish (if any)
			for i := 0; i < 30; i++ {
				w.mu.Lock()
				done := !w.processing
				w.mu.Unlock()
				if done {
					break
				}
				time.Sleep(1 * time.Second)
			}
			log.Printf("[Worker] Shutdown complete")
			return
		case <-ticker.C:
			w.processNextJob(ctx)
		}
	}
}

// processNextJob handles one iteration of the polling loop.
func (w *Worker) processNextJob(ctx context.Context) {
	envelope, err := w.apiClient.ClaimJob(w.config.WorkerID)
	if err != nil {
		log.Printf("[Worker] Claim error: %v", err)
		return
	}

	if envelope == nil {
		// No jobs available — silent poll
		return
	}

	log.Printf("[Worker] Claimed job=%s type=%s worker=%s attempt=%d/%d",
		envelope.Ticket.JobID, envelope.Ticket.JobType,
		w.config.WorkerID, envelope.Attempts, envelope.MaxAttempts)

	w.mu.Lock()
	w.processing = true
	w.mu.Unlock()

	defer func() {
		w.mu.Lock()
		w.processing = false
		w.mu.Unlock()
	}()

	if err := w.ProcessJob(ctx, envelope); err != nil {
		log.Printf("[Worker] job=%s worker=%s status=ERROR attempt=%d err=%v",
			envelope.Ticket.JobID, w.config.WorkerID, envelope.Attempts, err)
	}
}

// ProcessJob executes a single job envelope with heartbeat.
func (w *Worker) ProcessJob(ctx context.Context, envelope *client.JobEnvelope) error {
	ticket := &envelope.Ticket
	traceID := ticket.TraceID
	attempts := envelope.Attempts
	maxAttempts := envelope.MaxAttempts

	log.Printf("[Worker] Processing job=%s type=%s worker=%s trace=%s attempt=%d/%d",
		ticket.JobID, ticket.JobType, w.config.WorkerID, traceID, attempts, maxAttempts)

	// 1. Verify ticket signature
	if err := ticket.VerifySignature(w.publicKey); err != nil {
		log.Printf("[Worker] job=%s worker=%s status=VERIFY_FAIL err=%v", ticket.JobID, w.config.WorkerID, err)
		return w.reportFailure(ticket, "TICKET_INVALID", err.Error(), traceID, attempts)
	}

	// 2. Verify expiry
	if err := ticket.ValidateExpiry(); err != nil {
		log.Printf("[Worker] job=%s worker=%s status=EXPIRED err=%v", ticket.JobID, w.config.WorkerID, err)
		return w.reportFailure(ticket, "TICKET_EXPIRED", err.Error(), traceID, attempts)
	}

	// 3. Verify payload hash
	if err := ticket.ValidatePayloadHash(envelope.Payload); err != nil {
		log.Printf("[Worker] job=%s worker=%s status=HASH_MISMATCH err=%v", ticket.JobID, w.config.WorkerID, err)
		return w.reportFailure(ticket, "PAYLOAD_MISMATCH", err.Error(), traceID, attempts)
	}

	// 4. Start heartbeat goroutine
	heartbeatCtx, heartbeatCancel := context.WithCancel(ctx)
	defer heartbeatCancel()
	go w.heartbeatLoop(heartbeatCtx, ticket.JobID)

	// 5. Execute job
	startedAt := time.Now().UnixMilli()
	resultData, execErr := w.dispatcher.Dispatch(ticket.JobType, envelope.Payload, traceID)
	finishedAt := time.Now().UnixMilli()

	// Stop heartbeat
	heartbeatCancel()

	if execErr != nil {
		log.Printf("[Worker] job=%s worker=%s status=EXEC_FAIL attempt=%d err=%v",
			ticket.JobID, w.config.WorkerID, attempts, execErr)
		return w.reportFailure(ticket, "EXECUTION_ERROR", execErr.Error(), traceID, attempts)
	}

	// 6. Compute result hash
	resultHash, err := contracts.ComputeResultHash(resultData)
	if err != nil {
		return w.reportFailure(ticket, "HASH_ERROR", err.Error(), traceID, attempts)
	}

	// 7. Build and sign result
	result := &contracts.JobResult{
		JobID:      ticket.JobID,
		Status:     "SUCCEEDED",
		StartedAt:  startedAt,
		FinishedAt: finishedAt,
		ResultHash: resultHash,
		ResultData: resultData,
		Metrics: contracts.JobMetrics{
			Attempts:  attempts,
			LatencyMs: finishedAt - startedAt,
		},
		TraceID:  traceID,
		WorkerID: w.config.WorkerID,
	}

	if err := result.Sign(w.config.HMACSecret); err != nil {
		return err
	}

	// 8. Post result to TS
	if err := w.apiClient.PostResult(result); err != nil {
		log.Printf("[Worker] job=%s worker=%s status=POST_FAIL err=%v", ticket.JobID, w.config.WorkerID, err)
		return err
	}

	log.Printf("[Worker] job=%s worker=%s status=COMPLETED attempt=%d latency=%dms",
		ticket.JobID, w.config.WorkerID, attempts, finishedAt-startedAt)
	return nil
}

// heartbeatLoop sends heartbeat every 10s until context is cancelled.
func (w *Worker) heartbeatLoop(ctx context.Context, jobID string) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := w.apiClient.Heartbeat(jobID, w.config.WorkerID); err != nil {
				log.Printf("[Worker] job=%s heartbeat error: %v", jobID, err)
			} else {
				log.Printf("[Worker] job=%s heartbeat sent", jobID)
			}
		}
	}
}

// reportFailure sends a FAILED result back to TS.
func (w *Worker) reportFailure(ticket *contracts.JobTicket, errorCode, errorMsg, traceID string, attempts int) error {
	now := time.Now().UnixMilli()

	result := &contracts.JobResult{
		JobID:        ticket.JobID,
		Status:       "FAILED",
		StartedAt:    now,
		FinishedAt:   now,
		ResultHash:   contracts.ComputePayloadHash(""),
		ErrorCode:    errorCode,
		ErrorMessage: errorMsg,
		Metrics: contracts.JobMetrics{
			Attempts:  attempts,
			LatencyMs: 0,
		},
		TraceID:  traceID,
		WorkerID: w.config.WorkerID,
	}

	if err := result.Sign(w.config.HMACSecret); err != nil {
		return err
	}

	return w.apiClient.PostResult(result)
}
