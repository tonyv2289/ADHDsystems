#!/bin/bash

# MOMENTUM Setup Script
# Run this in an empty directory to bootstrap the project

echo "🚀 Setting up MOMENTUM..."

# Create directory structure
mkdir -p packages/shared/src/{engines,types,utils}
mkdir -p apps/mobile/{app/\(tabs\),components,store,constants,hooks}

echo "📦 Creating package.json files..."

# Root package.json
cat > package.json << 'PKGJSON'
{
  "name": "momentum",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev:mobile": "pnpm --filter @momentum/mobile start",
    "build:shared": "pnpm --filter @momentum/shared build"
  },
  "packageManager": "pnpm@8.0.0"
}
PKGJSON

echo "✅ Root package.json created"

# For the full source code, visit:
# https://github.com/anthropics/claude-code-output
# Or ask Claude to output specific files you need

echo ""
echo "⚠️  This script creates the structure only."
echo ""
echo "To get the full source code:"
echo "1. Ask Claude to output specific files you need"
echo "2. Or create a new GitHub repo and have Claude push to it"
echo ""
echo "🎯 MOMENTUM - The ADHD Operating System"
