// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — Job Dispatcher (Phase 21C)
// ═══════════════════════════════════════════════════════════════════════════
//
// Routes jobType to the correct handler.

package jobs

import (
	"fmt"
	"log"
)

// JobHandler processes a job and returns result data.
type JobHandler func(payload string, traceID string) (resultData any, err error)

// Dispatcher routes jobType to handlers.
type Dispatcher struct {
	handlers map[string]JobHandler
}

// NewDispatcher creates a dispatcher with the 3 Phase 21C job handlers.
func NewDispatcher() *Dispatcher {
	d := &Dispatcher{
		handlers: make(map[string]JobHandler),
	}

	d.Register("scheduler.tick", HandleSchedulerTick)
	d.Register("index.build", HandleIndexBuild)
	d.Register("webhook.process", HandleWebhookProcess)

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
// Phase 21C: stub implementation.
func HandleSchedulerTick(payload string, traceID string) (any, error) {
	log.Printf("[scheduler.tick] Processing scheduled tick (trace=%s)", traceID)

	// TODO Phase 22+: Parse payload, check schedule table, fire due tasks
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
// Phase 21C: stub for future Spotlight/VFS indexing.
func HandleIndexBuild(payload string, traceID string) (any, error) {
	log.Printf("[index.build] Building index (trace=%s)", traceID)

	// TODO Phase 24: Parse payload, scan files, build search index
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
// Phase 21C: stub for future webhook delivery.
func HandleWebhookProcess(payload string, traceID string) (any, error) {
	log.Printf("[webhook.process] Processing webhook (trace=%s)", traceID)

	// TODO Phase 23+: Parse payload, deliver webhook, retry on failure
	result := map[string]any{
		"webhookProcessed": true,
		"traceId":          traceID,
		"message":          "Webhook processed (stub)",
	}

	return result, nil
}
