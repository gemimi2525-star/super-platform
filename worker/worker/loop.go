// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — Worker Polling Loop (Phase 21C)
// ═══════════════════════════════════════════════════════════════════════════
//
// Main polling loop with graceful shutdown.
// Polls Firestore queue via TS API, executes jobs, posts results.

package worker

import (
	"context"
	"encoding/base64"
	"log"
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

// Run starts the polling loop. Blocks until context is cancelled.
func (w *Worker) Run(ctx context.Context) {
	log.Printf("[Worker] Starting %s (poll every %s)", w.config.WorkerID, w.config.PollInterval)

	ticker := time.NewTicker(w.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("[Worker] Shutting down gracefully...")
			return
		case <-ticker.C:
			w.processNextJob()
		}
	}
}

// processNextJob handles one iteration of the polling loop.
func (w *Worker) processNextJob() {
	// NOTE: In Phase 21C, Go worker polls via TS API.
	// Future: direct Firestore access or dedicated poll endpoint.
	log.Printf("[Worker] Poll tick (worker=%s)", w.config.WorkerID)
}

// ProcessJob executes a single job envelope.
// Exported for testing and manual invocation.
func (w *Worker) ProcessJob(envelope *client.JobEnvelope) error {
	ticket := &envelope.Ticket
	traceID := ticket.TraceID

	log.Printf("[Worker] Processing job %s (%s) trace=%s", ticket.JobID, ticket.JobType, traceID)

	// 1. Verify ticket signature
	if err := ticket.VerifySignature(w.publicKey); err != nil {
		log.Printf("[Worker] Ticket verification failed: %v", err)
		return w.reportFailure(ticket, "TICKET_INVALID", err.Error(), traceID)
	}

	// 2. Verify expiry
	if err := ticket.ValidateExpiry(); err != nil {
		log.Printf("[Worker] Ticket expired: %v", err)
		return w.reportFailure(ticket, "TICKET_EXPIRED", err.Error(), traceID)
	}

	// 3. Verify payload hash
	if err := ticket.ValidatePayloadHash(envelope.Payload); err != nil {
		log.Printf("[Worker] Payload hash mismatch: %v", err)
		return w.reportFailure(ticket, "PAYLOAD_MISMATCH", err.Error(), traceID)
	}

	// 4. Execute job
	startedAt := time.Now().UnixMilli()
	resultData, execErr := w.dispatcher.Dispatch(ticket.JobType, envelope.Payload, traceID)
	finishedAt := time.Now().UnixMilli()

	if execErr != nil {
		return w.reportFailure(ticket, "EXECUTION_ERROR", execErr.Error(), traceID)
	}

	// 5. Compute result hash
	resultHash, err := contracts.ComputeResultHash(resultData)
	if err != nil {
		return w.reportFailure(ticket, "HASH_ERROR", err.Error(), traceID)
	}

	// 6. Build and sign result
	result := &contracts.JobResult{
		JobID:      ticket.JobID,
		Status:     "SUCCEEDED",
		StartedAt:  startedAt,
		FinishedAt: finishedAt,
		ResultHash: resultHash,
		ResultData: resultData,
		Metrics: contracts.JobMetrics{
			LatencyMs: finishedAt - startedAt,
			Attempts:  1,
		},
		TraceID:  traceID,
		WorkerID: w.config.WorkerID,
	}

	if err := result.Sign(w.config.HMACSecret); err != nil {
		return err
	}

	// 7. Post result to TS
	if err := w.apiClient.PostResult(result); err != nil {
		log.Printf("[Worker] Failed to post result: %v", err)
		return err
	}

	log.Printf("[Worker] Job %s completed (%dms)", ticket.JobID, finishedAt-startedAt)
	return nil
}

// reportFailure sends a FAILED result back to TS.
func (w *Worker) reportFailure(ticket *contracts.JobTicket, errorCode, errorMsg, traceID string) error {
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
			LatencyMs: 0,
			Attempts:  1,
		},
		TraceID:  traceID,
		WorkerID: w.config.WorkerID,
	}

	if err := result.Sign(w.config.HMACSecret); err != nil {
		return err
	}

	return w.apiClient.PostResult(result)
}
