// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — Job Dispatcher (Phase 22A)
// ═══════════════════════════════════════════════════════════════════════════
//
// Routes jobType to the correct handler.
// Includes __test.fail_n_times for smoke testing retry/dead-letter.

package jobs

import (
	"encoding/json"
	"fmt"
	"log"
)

// JobHandler processes a job and returns result data.
type JobHandler func(payload string, traceID string) (resultData any, err error)

// Dispatcher routes jobType to handlers.
type Dispatcher struct {
	handlers map[string]JobHandler
}

// NewDispatcher creates a dispatcher with all registered job handlers.
func NewDispatcher() *Dispatcher {
	d := &Dispatcher{
		handlers: make(map[string]JobHandler),
	}

	d.Register("scheduler.tick", HandleSchedulerTick)
	d.Register("index.build", HandleIndexBuild)
	d.Register("webhook.process", HandleWebhookProcess)
	d.Register("__test.fail_n_times", HandleTestFailNTimes)

	return d
}

// Register adds a handler for a jobType.
func (d *Dispatcher) Register(jobType string, handler JobHandler) {
	d.handlers[jobType] = handler
}

// Dispatch routes a job to its handler.
func (d *Dispatcher) Dispatch(jobType string, payload string, traceID string) (any, error) {
	handler, ok := d.handlers[jobType]
	if !ok {
		return nil, fmt.Errorf("unknown jobType: %s", jobType)
	}

	log.Printf("[Dispatcher] Executing %s (trace=%s)", jobType, traceID)
	return handler(payload, traceID)
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER: scheduler.tick
// ═══════════════════════════════════════════════════════════════════════════

// HandleSchedulerTick fires scheduled tasks.
func HandleSchedulerTick(payload string, traceID string) (any, error) {
	log.Printf("[scheduler.tick] Processing scheduled tick (trace=%s)", traceID)

	result := map[string]any{
		"tickProcessed": true,
		"traceId":       traceID,
		"message":       "Scheduler tick processed (stub)",
	}

	return result, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER: index.build
// ═══════════════════════════════════════════════════════════════════════════

// HandleIndexBuild runs background indexing.
func HandleIndexBuild(payload string, traceID string) (any, error) {
	log.Printf("[index.build] Building index (trace=%s)", traceID)

	result := map[string]any{
		"indexBuilt": true,
		"traceId":    traceID,
		"message":    "Index build completed (stub)",
	}

	return result, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER: webhook.process
// ═══════════════════════════════════════════════════════════════════════════

// HandleWebhookProcess handles generic webhook processing.
func HandleWebhookProcess(payload string, traceID string) (any, error) {
	log.Printf("[webhook.process] Processing webhook (trace=%s)", traceID)

	result := map[string]any{
		"webhookProcessed": true,
		"traceId":          traceID,
		"message":          "Webhook processed (stub)",
	}

	return result, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER: __test.fail_n_times (smoke test only)
// ═══════════════════════════════════════════════════════════════════════════

// testFailPayload is the expected payload for __test.fail_n_times.
type testFailPayload struct {
	Reason    string `json:"reason"`
	FailCount int    `json:"failCount"`
	Attempt   int    `json:"attempt"`
}

// HandleTestFailNTimes intentionally fails the first N attempts.
// Payload: { "reason": "...", "failCount": N, "attempt": current_attempt }
// The attempt field comes from the overall job attempts counter.
// It fails if: current_attempt <= failCount.
//
// NOTE: The "attempt" in payload is set at enqueue time and doesn't change.
// We use the failCount to deterministically control behavior.
// The actual attempt number comes from the envelope.
func HandleTestFailNTimes(payload string, traceID string) (any, error) {
	var p testFailPayload
	if err := json.Unmarshal([]byte(payload), &p); err != nil {
		return nil, fmt.Errorf("invalid __test.fail_n_times payload: %w", err)
	}

	log.Printf("[__test.fail_n_times] payload failCount=%d (trace=%s)", p.FailCount, traceID)

	// The TS side incremented attempts before dispatching to us.
	// We always fail — the TS result route decides retry vs dead-letter.
	// For the test handler: always return error (TS handles retry decision).
	if p.FailCount > 0 {
		return nil, fmt.Errorf("intentional test failure (failCount=%d)", p.FailCount)
	}

	return map[string]any{
		"testPassed": true,
		"traceId":    traceID,
	}, nil
}
