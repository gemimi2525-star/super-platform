#!/bin/bash
# Script to cleanly restart dev server

# 1. Kill any existing next/node processes
echo "🧹 Cleaning up existing dev processes..."
pids=$(lsof -t -i:3000)
if [ -n "$pids" ]; then
    kill -9 $pids
    echo "✅ Killed processes on port 3000"
else
    echo "✨ Port 3000 is clean"
fi

# 2. Add extra cleanup for any lingering next-server processes
pkill -f "next-server" || true
pkill -f "next dev" || true

# 3. Clean .next cache to avoid stale locks
echo "🗑️  Cleaning .next cache..."
rm -rf .next

# 4. Start dev server
echo "🚀 Starting dev server..."
npm run dev
