// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — JobResult Contract (Phase 21C)
// ═══════════════════════════════════════════════════════════════════════════
//
// Go representation of JobResult.
// Signs result with HMAC-SHA256 (shared secret).

package contracts

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
)

// JobResult represents execution result sent back to TS Core OS.
type JobResult struct {
	JobID        string     `json:"jobId"`
	Status       string     `json:"status"` // "SUCCEEDED" | "FAILED"
	StartedAt    int64      `json:"startedAt"`
	FinishedAt   int64      `json:"finishedAt"`
	ResultHash   string     `json:"resultHash"`
	ResultData   any        `json:"resultData,omitempty"`
	ErrorCode    string     `json:"errorCode,omitempty"`
	ErrorMessage string     `json:"errorMessage,omitempty"`
	Metrics      JobMetrics `json:"metrics"`
	TraceID      string     `json:"traceId"`
	WorkerID     string     `json:"workerId"`
	Signature    string     `json:"signature"`
}

// JobMetrics contains execution performance data.
// Fields MUST be in alphabetical order by JSON tag
// to match TS canonicalJSON recursive sort.
type JobMetrics struct {
	Attempts  int   `json:"attempts"`
	LatencyMs int64 `json:"latencyMs"`
}

// resultSignableData is the structure used for HMAC computation.
// Keys are sorted alphabetically to match TS canonical JSON.
type resultSignableData struct {
	FinishedAt int64      `json:"finishedAt"`
	JobID      string     `json:"jobId"`
	Metrics    JobMetrics `json:"metrics"`
	ResultHash string     `json:"resultHash"`
	StartedAt  int64      `json:"startedAt"`
	Status     string     `json:"status"`
	TraceID    string     `json:"traceId"`
	WorkerID   string     `json:"workerId"`
}

// Sign computes the HMAC-SHA256 signature for this result.
func (r *JobResult) Sign(secret string) error {
	signable := resultSignableData{
		FinishedAt: r.FinishedAt,
		JobID:      r.JobID,
		Metrics:    r.Metrics,
		ResultHash: r.ResultHash,
		StartedAt:  r.StartedAt,
		Status:     r.Status,
		TraceID:    r.TraceID,
		WorkerID:   r.WorkerID,
	}

	b, err := json.Marshal(signable)
	if err != nil {
		return fmt.Errorf("failed to marshal signable data: %w", err)
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(b)
	r.Signature = hex.EncodeToString(mac.Sum(nil))

	return nil
}

// ComputeResultHash computes SHA-256 hash of result data.
func ComputeResultHash(data any) (string, error) {
	b, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal result data: %w", err)
	}
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:]), nil
}
