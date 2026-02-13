// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — Go Worker CLI Entrypoint (Phase 21C)
// ═══════════════════════════════════════════════════════════════════════════
//
// Starts the worker polling loop with graceful OS signal handling.

package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gemimi2525-star/super-platform/worker/config"
	"github.com/gemimi2525-star/super-platform/worker/worker"
)

func main() {
	log.Println("═══════════════════════════════════════")
	log.Println("  CORE OS — Go Worker (Phase 21C)")
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

	// Graceful shutdown on OS signals
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigs
		log.Printf("[Signal] Received %s, initiating shutdown...", sig)
		cancel()
	}()

	// Start polling loop (blocks until context cancelled)
	w.Run(ctx)

	log.Println("[Worker] Shutdown complete.")
}
