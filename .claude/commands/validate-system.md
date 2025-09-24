# System Health Validation for Better-Chatbot

Comprehensive health check for the better-chatbot system: $ARGUMENTS (optional: quick|canvas|mcp|agents|full)

## Validation Sequence

### 1. **Critical Infrastructure Health**
Essential systems that must be running:

```bash
# Langfuse Observability (CRITICAL - traced in all AI operations)
echo "🔍 Checking Langfuse observability..."
curl -f http://localhost:3000/api/health/langfuse || echo "❌ Langfuse health check failed - check .env credentials"

# Development Server Health
echo "🔍 Checking development server..."
curl -f http://localhost:3000/api/health || echo "❌ Server not responding on localhost:3000"

# Database Connectivity
echo "🔍 Checking database health..."
pnpm db:check || echo "❌ Database connectivity issues"
```

### 2. **Core Quality Gates**
Standard validation that mirrors `pnpm check`:

```bash
echo "🔍 Running core quality gates..."

# Code Quality (Biome + ESLint)
pnpm lint || echo "❌ Linting failed"

# Type Safety (TypeScript strict mode)
pnpm check-types || echo "❌ Type checking failed"

# Unit Tests (Vitest - 19+ test files)
pnpm test || echo "❌ Unit tests failed"

# Build Validation (Next.js App Router)
pnpm build:local || echo "❌ Build failed"
```

### 3. **System-Specific Validation**

#### **Canvas System** (if ARGUMENTS contains "canvas" or "full")
```bash
if [[ "$1" == *"canvas"* || "$1" == *"full"* ]]; then
  echo "🎨 Validating Canvas system..."

  # Canvas and Chart Tools (15 specialized tools)
  pnpm test --grep "canvas|chart" || echo "❌ Canvas tests failed"

  # Chart Artifact Tools
  pnpm test src/lib/ai/tools/artifacts/ || echo "❌ Chart artifact tools failed"

  # Chart Components
  pnpm test src/components/tool-invocation/ || echo "❌ Chart components failed"

  # Canvas Naming System
  pnpm test src/lib/ai/canvas-naming.ts || echo "❌ Canvas naming failed"

  # Geographic Data Files
  ls public/geo/us-*.json public/geo/world-*.json >/dev/null 2>&1 || echo "⚠️ Geographic data files missing"

  echo "✅ Canvas system validation complete"
fi
```

#### **MCP Server System** (if ARGUMENTS contains "mcp" or "full")
```bash
if [[ "$1" == *"mcp"* || "$1" == *"full"* ]]; then
  echo "🔗 Validating MCP server system..."

  # MCP Core System Tests
  pnpm test src/lib/ai/mcp/ || echo "❌ MCP core tests failed"

  # MCP Database Configuration
  pnpm db:check || echo "❌ MCP database config failed"

  # MCP API Accessibility (requires dev server)
  curl -s http://localhost:3000/api/mcp/list >/dev/null || echo "⚠️ MCP API not accessible"

  # MCP Manager Initialization
  node -e "
    import('./src/lib/ai/mcp/mcp-manager.ts').then(m =>
      m.initMCPManager()
        .then(() => console.log('✅ MCP Manager initialized successfully'))
        .catch(e => console.log('❌ MCP Manager failed:', e.message))
    )" || echo "❌ MCP Manager test failed"

  echo "✅ MCP server validation complete"
fi
```

#### **Agent System** (if ARGUMENTS contains "agents" or "full")
```bash
if [[ "$1" == *"agents"* || "$1" == *"full"* ]]; then
  echo "🤖 Validating agent system..."

  # Critical Anti-Pattern Detection
  if grep -r "allowedMcpServers.*mentions.*length.*?" src/app/api/chat/ 2>/dev/null; then
    echo "❌ CRITICAL: Found agent-breaking tool disabling pattern"
  fi

  # Tool Loading Pipeline
  pnpm test --grep "loadMcpTools|loadWorkFlowTools|loadAppDefaultTools" || echo "❌ Tool loading pipeline failed"

  # Agent Tool Access Tests
  pnpm test --grep "allowedMcpServers|allowedAppDefaultToolkit" || echo "❌ Agent tool access tests failed"

  # Agent-specific Tests
  pnpm test src/app/api/chat/ --grep "agent" || echo "❌ Agent integration tests failed"

  echo "✅ Agent system validation complete"
fi
```

### 4. **Authentication & Database**
```bash
echo "🔐 Validating authentication and database..."

# Database Schema Health
pnpm db:push --check || echo "⚠️ Database schema mismatch detected"

# Authentication System (Better-Auth)
pnpm test src/lib/auth/ || echo "❌ Authentication tests failed"

echo "✅ Authentication and database validation complete"
```

### 5. **Extended Validation** (if ARGUMENTS contains "full")
```bash
if [[ "$1" == *"full"* ]]; then
  echo "🚀 Running full system validation..."

  # End-to-End Tests (requires PostgreSQL)
  pnpm test:e2e --project=chromium || echo "❌ E2E tests failed"

  # Vercel AI SDK Integration Tests
  pnpm test --grep "streamText|generateText" || echo "❌ Vercel AI SDK tests failed"

  # Tool Integration Tests
  pnpm test src/lib/ai/tools/ || echo "❌ Tool integration tests failed"

  echo "✅ Full system validation complete"
fi
```

## Quick Validation (Default)

If no arguments provided, run essential checks:

```bash
if [[ -z "$1" || "$1" == "quick" ]]; then
  echo "⚡ Running quick system validation..."

  # Essential Infrastructure
  curl -f http://localhost:3000/api/health/langfuse >/dev/null 2>&1 && echo "✅ Langfuse OK" || echo "❌ Langfuse failed"
  curl -f http://localhost:3000/api/health >/dev/null 2>&1 && echo "✅ Server OK" || echo "❌ Server failed"

  # Core Quality Gates
  pnpm lint >/dev/null 2>&1 && echo "✅ Lint OK" || echo "❌ Lint failed"
  pnpm check-types >/dev/null 2>&1 && echo "✅ Types OK" || echo "❌ Types failed"
  pnpm test >/dev/null 2>&1 && echo "✅ Tests OK" || echo "❌ Tests failed"

  echo "✅ Quick validation complete"
fi
```

## Usage Examples

```bash
# Quick validation (default)
/validate-system

# Quick validation (explicit)
/validate-system quick

# Canvas-specific validation
/validate-system canvas

# MCP server validation
/validate-system mcp

# Agent system validation
/validate-system agents

# Full comprehensive validation
/validate-system full

# Multiple systems
/validate-system canvas mcp agents
```

## Validation Status Indicators

- **✅ Success**: All checks passed
- **⚠️ Warning**: Non-critical issues detected
- **❌ Failure**: Critical issues requiring attention

## Critical Failure Recovery

### **Langfuse Health Failed**
```bash
# Check environment variables
grep -E "(LANGFUSE_|OPENAI_|ANTHROPIC_)" .env
# Restart dev server: pnpm dev
```

### **Agent Tool Access Failed**
```bash
# Check for dangerous patterns
grep -r "allowedMcpServers.*mentions.*length" src/app/api/chat/
# Run: /validate-agents for detailed diagnosis
```

### **Canvas System Failed**
```bash
# Check geographic data files
ls -la public/geo/
# Run: /validate-canvas for detailed diagnosis
```

### **MCP System Failed**
```bash
# Check MCP server status
curl http://localhost:3000/api/mcp/list
# Run: /debug-mcp for detailed diagnosis
```

## Integration with Existing Commands

This command complements:
- `/validate-agents` - Detailed agent system diagnosis
- `/validate-canvas` - Canvas-specific validation
- `/validate-mcp` - MCP server management
- `/debug-mcp` - MCP troubleshooting
- `@agent-validation-gates` - Iterative validation and fixing

Use this as the **primary health check** before starting development work or after making significant changes to the better-chatbot system.