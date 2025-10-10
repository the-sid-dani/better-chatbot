#!/bin/bash
set -e

echo "🚀 Pre-Deployment Validation"
echo "=============================="

echo ""
echo "1️⃣ Type Checking..."
pnpm check-types

echo ""
echo "2️⃣ Linting..."
pnpm lint

echo ""
echo "3️⃣ Running Tests..."
pnpm test

echo ""
echo "4️⃣ Building Production..."
pnpm build:local

echo ""
echo "✅ All checks passed! Safe to deploy."
echo ""
echo "Next steps:"
echo "  - Review changes: git diff origin/main"
echo "  - Commit: git add . && git commit -m 'your message'"
echo "  - Push: git push origin main"
