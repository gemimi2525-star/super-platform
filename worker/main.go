// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — Go Worker CLI Entrypoint (Phase 22A)
// ═══════════════════════════════════════════════════════════════════════════
//
// Starts the worker polling loop.
// Signal handling (SIGTERM/SIGINT) is done inside worker.Run().

package main

import (
	"context"
	"log"

	"github.com/gemimi2525-star/super-platform/worker/config"
	"github.com/gemimi2525-star/super-platform/worker/worker"
)

func main() {
	log.Println("═══════════════════════════════════════")
	log.Println("  CORE OS — Go Worker (Phase 22A)")
	log.Println("═══════════════════════════════════════")

	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[FATAL] Configuration error: %v", err)
	}
	log.Printf("[Config] API URL: %s", cfg.APIURL)
	log.Printf("[Config] Worker ID: %s", cfg.WorkerID)
	log.Printf("[Config] Poll interval: %s", cfg.PollInterval)

	// Create worker
	w, err := worker.New(cfg)
	if err != nil {
		log.Fatalf("[FATAL] Worker initialization failed: %v", err)
	}

	// Start polling loop (blocks until SIGTERM/SIGINT)
	w.Run(context.Background())

	log.Println("[Worker] Process exited.")
}
