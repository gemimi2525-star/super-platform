// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — API Client (Phase 21C)
// ═══════════════════════════════════════════════════════════════════════════
//
// HTTP client for communicating with TS Core OS.

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
	Ticket  contracts.JobTicket `json:"ticket"`
	Payload string              `json:"payload"`
	Version string              `json:"version"`
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
