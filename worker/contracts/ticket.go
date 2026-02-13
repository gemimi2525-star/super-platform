// ═══════════════════════════════════════════════════════════════════════════
// CORE OS — JobTicket Contract (Phase 21C)
// ═══════════════════════════════════════════════════════════════════════════
//
// Go representation of JobTicket.
// Verifies Ed25519 signature from TS Core OS.

package contracts

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"
	"time"
)

// JobTicket represents a signed job authorization from TS Core OS.
type JobTicket struct {
	JobID            string   `json:"jobId"`
	JobType          string   `json:"jobType"`
	ActorID          string   `json:"actorId"`
	Scope            []string `json:"scope"`
	PolicyDecisionID string   `json:"policyDecisionId"`
	RequestedAt      int64    `json:"requestedAt"`
	ExpiresAt        int64    `json:"expiresAt"`
	PayloadHash      string   `json:"payloadHash"`
	Nonce            string   `json:"nonce"`
	TraceID          string   `json:"traceId"`
	Signature        string   `json:"signature"`
}

// ticketSignableData is the structure used for computing the signature.
type ticketSignableData struct {
	ActorID          string   `json:"actorId"`
	ExpiresAt        int64    `json:"expiresAt"`
	JobID            string   `json:"jobId"`
	JobType          string   `json:"jobType"`
	Nonce            string   `json:"nonce"`
	PayloadHash      string   `json:"payloadHash"`
	PolicyDecisionID string   `json:"policyDecisionId"`
	RequestedAt      int64    `json:"requestedAt"`
	Scope            []string `json:"scope"`
	TraceID          string   `json:"traceId"`
}

// GetSignableData returns the canonical JSON for signature verification.
// Keys are sorted alphabetically to match TS canonical JSON.
func (t *JobTicket) GetSignableData() (string, error) {
	data := ticketSignableData{
		ActorID:          t.ActorID,
		ExpiresAt:        t.ExpiresAt,
		JobID:            t.JobID,
		JobType:          t.JobType,
		Nonce:            t.Nonce,
		PayloadHash:      t.PayloadHash,
		PolicyDecisionID: t.PolicyDecisionID,
		RequestedAt:      t.RequestedAt,
		Scope:            t.Scope,
		TraceID:          t.TraceID,
	}

	b, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal signable data: %w", err)
	}
	return string(b), nil
}

// VerifySignature verifies the Ed25519 signature using the public key.
func (t *JobTicket) VerifySignature(publicKeyBytes []byte) error {
	if len(publicKeyBytes) != ed25519.PublicKeySize {
		return fmt.Errorf("invalid public key size: expected %d, got %d", ed25519.PublicKeySize, len(publicKeyBytes))
	}

	signable, err := t.GetSignableData()
	if err != nil {
		return fmt.Errorf("failed to get signable data: %w", err)
	}

	sigBytes, err := base64.StdEncoding.DecodeString(t.Signature)
	if err != nil {
		return fmt.Errorf("failed to decode signature: %w", err)
	}

	if !ed25519.Verify(ed25519.PublicKey(publicKeyBytes), []byte(signable), sigBytes) {
		return fmt.Errorf("invalid Ed25519 signature")
	}

	return nil
}

// ValidateExpiry checks that the ticket has not expired.
func (t *JobTicket) ValidateExpiry() error {
	now := time.Now().UnixMilli()
	if t.ExpiresAt <= now {
		return fmt.Errorf("ticket expired at %d, current time %d", t.ExpiresAt, now)
	}
	return nil
}

// ValidatePayloadHash verifies that the payload hash matches.
func (t *JobTicket) ValidatePayloadHash(payload string) error {
	computed := ComputePayloadHash(payload)
	if t.PayloadHash != computed {
		return fmt.Errorf("payload hash mismatch: expected %s, got %s", computed, t.PayloadHash)
	}
	return nil
}

// ComputePayloadHash computes SHA-256 of a payload string.
func ComputePayloadHash(payload string) string {
	h := sha256.Sum256([]byte(payload))
	return fmt.Sprintf("%x", h)
}

// CanonicalJSON produces deterministic JSON with sorted keys.
func CanonicalJSON(data map[string]interface{}) (string, error) {
	keys := make([]string, 0, len(data))
	for k := range data {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	ordered := make([]byte, 0, 256)
	ordered = append(ordered, '{')
	for i, k := range keys {
		if i > 0 {
			ordered = append(ordered, ',')
		}
		keyBytes, _ := json.Marshal(k)
		valBytes, err := json.Marshal(data[k])
		if err != nil {
			return "", err
		}
		ordered = append(ordered, keyBytes...)
		ordered = append(ordered, ':')
		ordered = append(ordered, valBytes...)
	}
	ordered = append(ordered, '}')
	return string(ordered), nil
}
