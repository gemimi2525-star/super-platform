#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Vercel Ignored Build Step — Path-based Skip Guard
# ═══════════════════════════════════════════════════════════════
#
# Used as Vercel "Ignored Build Step" to skip builds when no
# relevant files changed. This is a single-app repo with 3
# Vercel projects sharing the same codebase.
#
# Exit 0 = SKIP (no relevant changes)
# Exit 1 = BUILD (changes detected in scope)
#
# Usage:
#   scripts/vercel/should-build.sh <path1> [path2] ...
#
# Example:
#   scripts/vercel/should-build.sh app/os app/system coreos
#
# Override base ref:
#   BASE_REF=abc123 scripts/vercel/should-build.sh app/os
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Determine base ref ───
BASE_REF="${BASE_REF:-}"
if [ -z "${BASE_REF}" ]; then
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    BASE_REF="$(git merge-base HEAD origin/main 2>/dev/null || echo 'HEAD^')"
  else
    BASE_REF="HEAD^"
  fi
fi

# ─── Validate arguments ───
if [ "$#" -lt 1 ]; then
  echo "[guard] ERROR: missing scope paths"
  echo "[guard] Usage: $0 <path1> [path2] ..."
  exit 1  # BUILD on error (safe default)
fi

echo "[guard] BASE_REF=$BASE_REF"
echo "[guard] HEAD=$(git rev-parse --short HEAD)"
echo "[guard] scopes: $*"

# ─── Always build on shared/critical files ───
SHARED_PATHS="package.json package-lock.json next.config.ts tsconfig.json middleware.ts vercel.json"
for sp in $SHARED_PATHS; do
  if ! git diff --quiet "$BASE_REF"..HEAD -- "$sp" 2>/dev/null; then
    echo "[guard] BUILD — shared file changed: $sp"
    exit 1
  fi
done

# ─── Check scoped paths ───
if git diff --quiet "$BASE_REF"..HEAD -- "$@" 2>/dev/null; then
  echo "[guard] SKIP (no changes in scope)"
  exit 0
else
  echo "[guard] BUILD (changes detected in scope)"
  exit 1
fi
