#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Deployment..."

# 1. Pull the latest code from GitHub
echo "📥 Pulling latest code from git (main)..."
git pull origin main

# 2. Set Node 22 environment path
export PATH=/opt/cpanel/ea-nodejs22/bin:$PATH

# 3. Install dependencies (in case package.json changed)
echo "📦 Installing npm dependencies..."
NODE_OPTIONS="--max-old-space-size=512" npm install --legacy-peer-deps --no-audit --no-fund --jobs=1 --no-progress --prefer-offline

# 4. Build Next.js production code
echo "⚙️ Building Next.js application..."
NODE_OPTIONS="--max-old-space-size=1024" npm run build

# 5. Restart Phusion Passenger Node.js app
echo "♻️ Restarting application..."
mkdir -p tmp && touch tmp/restart.txt

echo "✅ Deployment completed successfully!"
