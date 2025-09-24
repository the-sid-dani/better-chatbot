# MCP Server Validation and Health Check

Validate MCP (Model Context Protocol) server system and tool integrations: $ARGUMENTS (optional: connections|tools|auth|config|all)

## MCP System Overview

The better-chatbot project features extensive MCP integration:
- **10+ recommended MCP servers** with pre-configured settings
- **Custom MCP servers** (Archon, Weather example)
- **Three connection types**: SSE, STDIO, StreamableHTTP
- **OAuth integration** for third-party services
- **Database configuration storage** with fallback to file-based config
- **Real-time health monitoring** via `/mcp` dashboard
- **Tool testing interface** via `/mcp/test/[id]` endpoints

## Validation Categories

### 1. **MCP Core System Validation**
Test fundamental MCP infrastructure:

```bash
echo "🔗 Validating MCP Core System..."

# MCP Core Tests
pnpm test src/lib/ai/mcp/ || echo "❌ MCP core tests failed"

# MCP Clients Manager
pnpm test src/lib/ai/mcp/mcp-manager.ts || echo "❌ MCP manager tests failed"

# Tool ID Processing
pnpm test src/lib/ai/mcp/mcp-tool-id.test.ts || echo "❌ MCP tool ID tests failed"

# MCP Tool Conversion (MCP → Vercel AI SDK)
pnpm test --grep "mcp.*tool.*conversion|mcp.*vercel" || echo "❌ MCP tool conversion tests failed"

echo "✅ MCP core system validation complete"
```

### 2. **MCP Server Connection Validation**
Test MCP server connectivity and health:

```bash
echo "🌐 Validating MCP Server Connections..."

# MCP API Accessibility (requires dev server running)
curl -f http://localhost:3000/api/mcp/list >/dev/null 2>&1 && echo "✅ MCP API accessible" || echo "❌ MCP API not accessible"

# MCP Manager Initialization
node -e "
  import('./src/lib/ai/mcp/mcp-manager.ts').then(async (module) => {
    try {
      const manager = await module.initMCPManager();
      console.log('✅ MCP Manager initialized successfully');
      console.log('✅ Manager instance created:', !!manager);
    } catch (error) {
      console.log('❌ MCP Manager initialization failed:', error.message);
      process.exit(1);
    }
  });
" || echo "❌ MCP Manager initialization script failed"

# Active MCP Servers Status
curl -s http://localhost:3000/api/mcp/list | jq -r '.mcpServers | to_entries[] | "\(.key): \(.value.status // "unknown")"' 2>/dev/null || echo "⚠️ Could not fetch MCP server status"

echo "✅ MCP server connections validation complete"
```

### 3. **Currently Active MCP Servers**
Validate configured MCP servers:

```bash
echo "📋 Validating Active MCP Servers..."

# Archon MCP Server (SSE - localhost:8051)
echo "Checking Archon MCP server..."
curl -f http://localhost:8051/mcp >/dev/null 2>&1 && echo "✅ Archon MCP server responding" || echo "⚠️ Archon MCP server not responding"

# Database MCP Configuration
echo "Checking database MCP configurations..."
pnpm db:check && echo "✅ Database accessible for MCP config" || echo "❌ Database not accessible"

# File-based MCP Configuration (if FILE_BASED_MCP_CONFIG=true)
if [[ -f ".mcp.json" ]]; then
  echo "✅ File-based MCP config found: .mcp.json"
  node -e "
    const config = require('./.mcp.json');
    console.log('✅ MCP servers in config:', Object.keys(config.mcpServers || {}).length);
    Object.keys(config.mcpServers || {}).forEach(name =>
      console.log('  -', name, ':', config.mcpServers[name].url || config.mcpServers[name].command)
    );
  " || echo "❌ Invalid MCP config JSON"
else
  echo "⚠️ No file-based MCP config found (using database config)"
fi

echo "✅ Active MCP servers validation complete"
```

### 4. **Recommended MCP Servers** (10 pre-configured servers)
Test availability of recommended third-party MCP servers:

```bash
echo "🌟 Validating Recommended MCP Servers..."

# GitHub MCP
echo "Testing GitHub MCP..."
curl -I https://api.githubcopilot.com/mcp/ 2>/dev/null | head -1 | grep -q "200\|302" && echo "✅ GitHub MCP accessible" || echo "⚠️ GitHub MCP not accessible"

# Notion MCP
echo "Testing Notion MCP..."
curl -I https://mcp.notion.com/mcp 2>/dev/null | head -1 | grep -q "200\|302" && echo "✅ Notion MCP accessible" || echo "⚠️ Notion MCP not accessible"

# Linear MCP (SSE)
echo "Testing Linear MCP..."
curl -I https://mcp.linear.app/sse 2>/dev/null | head -1 | grep -q "200\|302" && echo "✅ Linear MCP accessible" || echo "⚠️ Linear MCP not accessible"

# Neon MCP
echo "Testing Neon MCP..."
curl -I https://mcp.neon.tech/mcp 2>/dev/null | head -1 | grep -q "200\|302" && echo "✅ Neon MCP accessible" || echo "⚠️ Neon MCP not accessible"

# Stripe MCP
echo "Testing Stripe MCP..."
curl -I https://mcp.stripe.com 2>/dev/null | head -1 | grep -q "200\|302" && echo "✅ Stripe MCP accessible" || echo "⚠️ Stripe MCP not accessible"

# Playwright MCP (STDIO - local)
echo "Testing Playwright MCP..."
which npx >/dev/null 2>&1 && echo "✅ Playwright MCP (npx) available" || echo "❌ Playwright MCP not available"

echo "✅ Recommended MCP servers validation complete"
```

### 5. **MCP Tool Integration Validation**
Test MCP tool conversion and integration:

```bash
echo "🛠️ Validating MCP Tool Integration..."

# MCP Tool Conversion Tests
pnpm test --grep "mcp.*tool.*convert|convertMcpTools" || echo "❌ MCP tool conversion tests failed"

# Tool Loading in Chat Routes
grep -r "loadMcpTools" src/app/api/chat/ >/dev/null && echo "✅ MCP tools loaded in chat routes" || echo "❌ MCP tools not loaded in chat routes"

# MCP Tool Permissions
pnpm test --grep "mcp.*permission|mcp.*auth" || echo "❌ MCP tool permission tests failed"

# MCP Tool Execution
pnpm test --grep "mcp.*execute|mcp.*call" || echo "❌ MCP tool execution tests failed"

echo "✅ MCP tool integration validation complete"
```

### 6. **MCP Authentication Validation**
Test OAuth flows and authentication for MCP servers:

```bash
echo "🔐 Validating MCP Authentication..."

# OAuth Flow Tests
pnpm test --grep "oauth.*mcp|mcp.*oauth" || echo "❌ MCP OAuth tests failed"

# MCP Server Authentication
pnpm test --grep "mcp.*auth|auth.*mcp" || echo "❌ MCP authentication tests failed"

# Authorization Headers
grep -r "Authorization.*Bearer" .mcp.json 2>/dev/null && echo "✅ Bearer tokens found in MCP config" || echo "⚠️ No Bearer tokens in MCP config"

echo "✅ MCP authentication validation complete"
```

### 7. **MCP Database Configuration**
Test database storage of MCP configurations:

```bash
echo "🗄️ Validating MCP Database Configuration..."

# Database MCP Storage Tests
pnpm test src/lib/ai/mcp/db-mcp-config-storage.test.ts || echo "❌ MCP database storage tests failed"

# Database Schema for MCP
pnmp test --grep "McpServer.*schema|mcp.*database" || echo "❌ MCP database schema tests failed"

# MCP Configuration CRUD
pnpm test --grep "mcp.*crud|mcp.*config.*storage" || echo "❌ MCP config CRUD tests failed"

echo "✅ MCP database configuration validation complete"
```

## Targeted Validation Commands

### **Connections Only** (if ARGUMENTS contains "connections")
```bash
if [[ "$1" == *"connections"* ]]; then
  echo "🎯 Validating MCP Connections Only..."
  curl -f http://localhost:3000/api/mcp/list
  node -e "import('./src/lib/ai/mcp/mcp-manager.ts').then(m => m.initMCPManager())"
fi
```

### **Tools Only** (if ARGUMENTS contains "tools")
```bash
if [[ "$1" == *"tools"* ]]; then
  echo "🎯 Validating MCP Tools Only..."
  pnpm test --grep "mcp.*tool"
  grep -r "loadMcpTools" src/app/api/chat/
fi
```

### **Authentication Only** (if ARGUMENTS contains "auth")
```bash
if [[ "$1" == *"auth"* ]]; then
  echo "🎯 Validating MCP Authentication Only..."
  pnpm test --grep "oauth.*mcp|mcp.*auth"
fi
```

### **Configuration Only** (if ARGUMENTS contains "config")
```bash
if [[ "$1" == *"config"* ]]; then
  echo "🎯 Validating MCP Configuration Only..."
  pnpm test src/lib/ai/mcp/db-mcp-config-storage.test.ts
  [[ -f ".mcp.json" ]] && cat .mcp.json | jq '.' || echo "Using database config"
fi
```

## Quick MCP Health Check

Default validation when no arguments provided:

```bash
if [[ -z "$1" ]]; then
  echo "⚡ Quick MCP validation..."

  # Essential MCP Tests
  curl -f http://localhost:3000/api/mcp/list >/dev/null 2>&1 && echo "✅ MCP API OK" || echo "❌ MCP API failed"
  pnpm test src/lib/ai/mcp/ --reporter=silent && echo "✅ MCP core OK" || echo "❌ MCP core failed"
  pnpm db:check >/dev/null 2>&1 && echo "✅ MCP database OK" || echo "❌ MCP database failed"

  # Active servers
  curl -s http://localhost:3000/api/mcp/list | jq -r '.mcpServers | length' 2>/dev/null | xargs -I {} echo "✅ {} MCP server(s) configured" || echo "⚠️ Could not count MCP servers"

  echo "✅ Quick MCP validation complete"
fi
```

## MCP System Status Summary

```bash
echo "🔗 MCP System Status Summary:"
echo "• Core System: MCP clients manager with tool conversion pipeline"
echo "• Connection Types: SSE, STDIO, StreamableHTTP supported"
echo "• Active Servers: Archon (localhost:8051) + configured third-party servers"
echo "• Recommended Servers: 10 pre-configured (GitHub, Notion, Linear, Neon, etc.)"
echo "• Tool Integration: MCP → Vercel AI SDK tool interface conversion"
echo "• Authentication: OAuth flows for third-party service integration"
echo "• Configuration: Database storage with file-based fallback"
echo "• Management Interface: /mcp dashboard with real-time monitoring"
echo "• Testing Interface: /mcp/test/[id] for individual tool testing"
```

## Common MCP Issues & Solutions

### **MCP API Not Accessible**
```bash
# Check if development server is running on localhost:3000
curl http://localhost:3000/api/health
# Restart dev server: pnpm dev
```

### **MCP Manager Initialization Failed**
```bash
# Check database connectivity
pnpm db:check
# Check MCP configuration format
[[ -f ".mcp.json" ]] && cat .mcp.json | jq '.' || echo "Using database config"
```

### **MCP Tools Not Loading in Chat**
```bash
# Verify tool loading pipeline
grep -r "loadMcpTools" src/app/api/chat/shared.chat.ts
# Run: /validate-agents to check for tool access issues
```

## Usage Examples

```bash
# Quick MCP validation
/validate-mcp

# Full comprehensive MCP validation
/validate-mcp all

# Test MCP server connections only
/validate-mcp connections

# Test MCP tool integration only
/validate-mcp tools

# Test MCP authentication flows
/validate-mcp auth

# Test MCP configuration storage
/validate-mcp config

# Multiple categories
/validate-mcp connections tools auth
```

## Integration Notes

- **Complements `/validate-system mcp`** for system-wide validation
- **Works with `/debug-mcp`** for detailed troubleshooting
- **Supports MCP dashboard** at `/mcp` for visual management
- **Validates MCP tool testing** via `/mcp/test/[id]` endpoints
- **Ensures MCP readiness** for agent and chat system integration