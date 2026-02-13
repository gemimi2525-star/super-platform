// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — Go Worker Configuration (Phase 21C)
// ═══════════════════════════════════════════════════════════════════════════

package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all worker configuration from environment variables.
type Config struct {
	// API endpoint for Core OS (TS)
	APIURL string

	// HMAC shared secret for signing results
	HMACSecret string

	// Ed25519 public key (base64) for verifying tickets
	PublicKeyBase64 string

	// Worker instance identifier
	WorkerID string

	// Queue polling interval
	PollInterval time.Duration

	// HTTP client timeout
	HTTPTimeout time.Duration
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	apiURL := os.Getenv("COREOS_API_URL")
	if apiURL == "" {
		return nil, fmt.Errorf("COREOS_API_URL is required")
	}

	hmacSecret := os.Getenv("JOB_WORKER_HMAC_SECRET")
	if hmacSecret == "" {
		return nil, fmt.Errorf("JOB_WORKER_HMAC_SECRET is required")
	}

	publicKey := os.Getenv("JOB_TICKET_PUBLIC_KEY")
	if publicKey == "" {
		return nil, fmt.Errorf("JOB_TICKET_PUBLIC_KEY is required (base64 Ed25519 public key)")
	}

	workerID := os.Getenv("WORKER_ID")
	if workerID == "" {
		hostname, _ := os.Hostname()
		workerID = fmt.Sprintf("worker-%s-%d", hostname, os.Getpid())
	}

	pollSec, _ := strconv.Atoi(os.Getenv("POLL_INTERVAL_SECONDS"))
	if pollSec <= 0 {
		pollSec = 5
	}

	timeoutSec, _ := strconv.Atoi(os.Getenv("HTTP_TIMEOUT_SECONDS"))
	if timeoutSec <= 0 {
		timeoutSec = 30
	}

	return &Config{
		APIURL:          apiURL,
		HMACSecret:      hmacSecret,
		PublicKeyBase64: publicKey,
		WorkerID:        workerID,
		PollInterval:    time.Duration(pollSec) * time.Second,
		HTTPTimeout:     time.Duration(timeoutSec) * time.Second,
	}, nil
}
