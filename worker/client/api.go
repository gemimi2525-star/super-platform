// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — API Client (Phase 22A)
// ═══════════════════════════════════════════════════════════════════════════
//
// HTTP client for communicating with TS Core OS.
// Supports: claim, result, heartbeat.

package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gemimi2525-star/super-platform/worker/contracts"
)

// APIClient communicates with TS Core OS endpoints.
type APIClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewAPIClient creates a new API client.
func NewAPIClient(baseURL string, timeout time.Duration) *APIClient {
	return &APIClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// JobEnvelope is the response from polling the queue.
type JobEnvelope struct {
	Ticket      contracts.JobTicket `json:"ticket"`
	Payload     string              `json:"payload"`
	Version     string              `json:"version"`
	Attempts    int                 `json:"attempts"`
	MaxAttempts int                 `json:"maxAttempts"`
}

// PollResponse is the response from the claim endpoint.
type PollResponse struct {
	Job *JobEnvelope `json:"job"`
}

// PostResult sends a signed JobResult to the TS Core OS.
func (c *APIClient) PostResult(result *contracts.JobResult) error {
	body, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	resp, err := c.httpClient.Post(
		c.baseURL+"/api/jobs/result",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("failed to post result: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("result callback failed (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// ClaimJob calls POST /api/jobs/claim to atomically claim the next pending job.
// Returns nil if no jobs are available.
func (c *APIClient) ClaimJob(workerID string) (*JobEnvelope, error) {
	reqBody, _ := json.Marshal(map[string]string{"workerId": workerID})

	resp, err := c.httpClient.Post(
		c.baseURL+"/api/jobs/claim",
		"application/json",
		bytes.NewReader(reqBody),
	)
	if err != nil {
		return nil, fmt.Errorf("claim request failed: %w", err)
	}
	defer resp.Body.Close()

	// 204 = no jobs available (legacy)
	if resp.StatusCode == 204 {
		return nil, nil
	}

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("claim failed (status %d): %s", resp.StatusCode, string(respBody))
	}

	var pollResp PollResponse
	if err := json.NewDecoder(resp.Body).Decode(&pollResp); err != nil {
		return nil, fmt.Errorf("failed to decode claim response: %w", err)
	}

	return pollResp.Job, nil
}

// Heartbeat sends a heartbeat to extend the lease for a running job.
func (c *APIClient) Heartbeat(jobID, workerID string) error {
	reqBody, _ := json.Marshal(map[string]string{
		"jobId":    jobID,
		"workerId": workerID,
	})

	resp, err := c.httpClient.Post(
		c.baseURL+"/api/jobs/heartbeat",
		"application/json",
		bytes.NewReader(reqBody),
	)
	if err != nil {
		return fmt.Errorf("heartbeat request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("heartbeat failed (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}
