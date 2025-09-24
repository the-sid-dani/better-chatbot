# MCP Server Debugging and Troubleshooting

Debug MCP (Model Context Protocol) server issues and connection problems: $ARGUMENTS (server name and issue description)

## MCP Debugging Overview

This command helps diagnose and resolve common MCP server issues in the better-chatbot project. Use this when MCP servers are not connecting, tools are not working, or authentication is failing.

## Usage

```bash
# Debug specific server
/debug-mcp archon "server not responding"

# Debug authentication issues
/debug-mcp github-mcp "oauth flow failing"

# Debug tool execution
/debug-mcp notion-mcp "tools not appearing in chat"

# General MCP debugging
/debug-mcp all "general connectivity issues"
```

## Debugging Categories

### 1. **Connection Diagnostics**
Diagnose MCP server connectivity issues:

```bash
echo "🔍 MCP Connection Diagnostics..."

# Development Server Health
curl -f http://localhost:3000/api/health || echo "❌ Main server not responding - run 'pnpm dev'"

# MCP API Endpoint Health
curl -f http://localhost:3000/api/mcp/list || echo "❌ MCP API not accessible - check server startup"

# MCP Manager Status
node -e "
  import('./src/lib/ai/mcp/mcp-manager.ts').then(async (module) => {
    try {
      console.log('🔍 Testing MCP Manager initialization...');
      const manager = await module.initMCPManager();
      console.log('✅ MCP Manager initialized successfully');

      // Test manager methods
      if (manager && typeof manager.getAllConfigs === 'function') {
        console.log('✅ MCP Manager methods available');
      } else {
        console.log('⚠️ MCP Manager missing expected methods');
      }
    } catch (error) {
      console.log('❌ MCP Manager initialization failed:');
      console.log('   Error:', error.message);
      console.log('   Stack:', error.stack?.split('\n')[1]?.trim());
    }
  });
"

echo "✅ Connection diagnostics complete"
```

### 2. **Server-Specific Debugging**
Debug individual MCP servers based on the first argument:

```bash
SERVER_NAME="$1"
ISSUE_DESC="$2"

echo "🎯 Debugging MCP Server: $SERVER_NAME"
echo "📝 Issue Description: $ISSUE_DESC"

case "$SERVER_NAME" in
  "archon"|"localhost")
    echo "🔍 Debugging Archon MCP Server (localhost:8051)..."

    # Check Archon server direct connection
    curl -f http://localhost:8051/mcp && echo "✅ Archon server responding" || echo "❌ Archon server not responding"

    # Check Archon server in MCP config
    if [[ -f ".mcp.json" ]]; then
      cat .mcp.json | jq '.mcpServers.archon' && echo "✅ Archon config found" || echo "❌ Archon not in config"
    else
      echo "⚠️ Using database config - check via /mcp dashboard"
    fi

    # Check Archon server authentication
    grep -r "Bearer dummy-token" .mcp.json 2>/dev/null && echo "✅ Archon auth token configured" || echo "⚠️ Archon auth token not found"
    ;;

  "github"*|"GitHub"*)
    echo "🔍 Debugging GitHub MCP Server..."

    # Check GitHub MCP endpoint
    curl -I https://api.githubcopilot.com/mcp/ 2>/dev/null | head -1 && echo "✅ GitHub MCP endpoint accessible"

    # Check GitHub PAT configuration
    echo "⚠️ GitHub MCP requires GitHub MCP PAT (Personal Access Token)"
    echo "   Configure via: /mcp dashboard → Add Server → GitHub MCP"
    ;;

  "notion"*|"Notion"*)
    echo "🔍 Debugging Notion MCP Server..."

    # Check Notion MCP endpoint
    curl -I https://mcp.notion.com/mcp 2>/dev/null | head -1 && echo "✅ Notion MCP endpoint accessible"

    echo "ℹ️ Notion MCP typically requires workspace authentication"
    echo "   Configure via: /mcp dashboard → Add Server → Notion MCP"
    ;;

  "linear"*|"Linear"*)
    echo "🔍 Debugging Linear MCP Server..."

    # Check Linear MCP endpoint (SSE)
    curl -I https://mcp.linear.app/sse 2>/dev/null | head -1 && echo "✅ Linear MCP endpoint accessible"

    echo "ℹ️ Linear MCP uses SSE (Server-Sent Events) connection"
    echo "   Configure via: /mcp dashboard → Add Server → Linear MCP"
    ;;

  "playwright"*|"Playwright"*)
    echo "🔍 Debugging Playwright MCP Server..."

    # Check npx availability
    which npx >/dev/null 2>&1 && echo "✅ npx available for Playwright MCP" || echo "❌ npx not found - install Node.js"

    # Test Playwright MCP command
    timeout 5 npx @playwright/mcp@latest --help >/dev/null 2>&1 && echo "✅ Playwright MCP package available" || echo "⚠️ Playwright MCP package not accessible"

    echo "ℹ️ Playwright MCP uses STDIO connection with npx command"
    ;;

  "all"|"general"|"")
    echo "🔍 General MCP System Debugging..."

    # Database connectivity
    pnpm db:check && echo "✅ Database accessible" || echo "❌ Database connection failed"

    # MCP configuration type
    if [[ -f ".mcp.json" ]]; then
      echo "✅ Using file-based MCP configuration"
      cat .mcp.json | jq '.mcpServers | keys[]' 2>/dev/null || echo "❌ Invalid JSON in .mcp.json"
    else
      echo "✅ Using database MCP configuration"
      echo "   Manage via: /mcp dashboard"
    fi

    # Environment variables
    echo "🔍 Checking environment variables..."
    [[ -n "$OPENAI_API_KEY" ]] && echo "✅ OPENAI_API_KEY set" || echo "⚠️ OPENAI_API_KEY not set"
    [[ -n "$ANTHROPIC_API_KEY" ]] && echo "✅ ANTHROPIC_API_KEY set" || echo "⚠️ ANTHROPIC_API_KEY not set"
    [[ "$FILE_BASED_MCP_CONFIG" == "true" ]] && echo "✅ FILE_BASED_MCP_CONFIG enabled" || echo "ℹ️ Using database MCP config"
    ;;

  *)
    echo "❓ Unknown MCP server: $SERVER_NAME"
    echo "   Available servers: archon, github, notion, linear, playwright, all"
    ;;
esac
```

### 3. **OAuth Flow Debugging**
Debug authentication issues with third-party MCP servers:

```bash
echo "🔐 OAuth Flow Debugging..."

# OAuth-related tests
pnpm test --grep "oauth.*mcp|mcp.*oauth" && echo "✅ OAuth tests passing" || echo "❌ OAuth tests failing"

# OAuth environment variables
echo "🔍 Checking OAuth configuration..."
grep -E "(CLIENT_ID|CLIENT_SECRET|OAUTH)" .env 2>/dev/null | wc -l | xargs -I {} echo "Found {} OAuth-related environment variables"

# OAuth flow endpoints
curl -f http://localhost:3000/api/mcp/oauth/callback 2>/dev/null && echo "✅ OAuth callback endpoint accessible" || echo "⚠️ OAuth callback endpoint not accessible"

echo "✅ OAuth flow debugging complete"
```

### 4. **Tool Loading Debugging**
Debug MCP tool integration and loading issues:

```bash
echo "🛠️ Tool Loading Debugging..."

# Check tool loading in chat routes
echo "🔍 Checking tool loading pipeline..."
grep -r "loadMcpTools" src/app/api/chat/shared.chat.ts && echo "✅ MCP tools loaded in chat" || echo "❌ MCP tools not loaded in chat"

# Tool conversion tests
pnpm test --grep "mcp.*tool.*convert" && echo "✅ Tool conversion working" || echo "❌ Tool conversion failing"

# Agent tool access (critical anti-patterns)
echo "🔍 Checking for agent-breaking patterns..."
grep -r "allowedMcpServers.*mentions.*length" src/app/api/chat/ && echo "❌ CRITICAL: Agent-breaking pattern found" || echo "✅ No agent-breaking patterns"

# Tool permissions
pnpm test --grep "mcp.*permission" && echo "✅ Tool permissions working" || echo "❌ Tool permission issues"

echo "✅ Tool loading debugging complete"
```

### 5. **Database Configuration Debugging**
Debug MCP configuration storage issues:

```bash
echo "🗄️ Database Configuration Debugging..."

# Database schema validation
pnpm db:check && echo "✅ Database schema OK" || echo "❌ Database schema issues"

# MCP configuration storage tests
pnpm test src/lib/ai/mcp/db-mcp-config-storage.test.ts && echo "✅ MCP database storage OK" || echo "❌ MCP database storage failing"

# Database MCP records
echo "🔍 Checking MCP configurations in database..."
node -e "
  import('./src/lib/db/pg/repositories/mcp.ts').then(async (module) => {
    try {
      // This would require proper database connection setup
      console.log('ℹ️ Database MCP configuration check would require full DB connection');
      console.log('   Use /mcp dashboard to view configurations visually');
    } catch (error) {
      console.log('⚠️ Could not check database MCP configs:', error.message);
    }
  });
"

echo "✅ Database configuration debugging complete"
```

### 6. **Network and Connectivity Debugging**
Debug network issues affecting MCP servers:

```bash
echo "🌐 Network Connectivity Debugging..."

# DNS resolution for MCP endpoints
echo "🔍 Testing DNS resolution..."
nslookup api.githubcopilot.com >/dev/null 2>&1 && echo "✅ GitHub MCP DNS OK" || echo "❌ GitHub MCP DNS failed"
nslookup mcp.notion.com >/dev/null 2>&1 && echo "✅ Notion MCP DNS OK" || echo "❌ Notion MCP DNS failed"
nslookup mcp.linear.app >/dev/null 2>&1 && echo "✅ Linear MCP DNS OK" || echo "❌ Linear MCP DNS failed"

# Network connectivity tests
echo "🔍 Testing network connectivity..."
curl -I --connect-timeout 5 https://api.githubcopilot.com/mcp/ 2>/dev/null | head -1 | grep -q "HTTP" && echo "✅ GitHub MCP network OK" || echo "❌ GitHub MCP network failed"
curl -I --connect-timeout 5 https://mcp.notion.com/mcp 2>/dev/null | head -1 | grep -q "HTTP" && echo "✅ Notion MCP network OK" || echo "❌ Notion MCP network failed"

# Localhost connectivity (for Archon)
curl -I --connect-timeout 2 http://localhost:8051/mcp 2>/dev/null | head -1 | grep -q "HTTP" && echo "✅ Archon localhost OK" || echo "❌ Archon localhost failed"

# Port availability
lsof -ti:3000 >/dev/null && echo "✅ Port 3000 in use (dev server)" || echo "❌ Port 3000 not in use"
lsof -ti:8051 >/dev/null && echo "✅ Port 8051 in use (Archon)" || echo "⚠️ Port 8051 not in use"

echo "✅ Network connectivity debugging complete"
```

## Common Issues & Solutions

### **"MCP API not accessible"**
```bash
echo "🔧 Solution for MCP API not accessible:"
echo "1. Ensure dev server is running: pnpm dev"
echo "2. Check port 3000 is not blocked: curl http://localhost:3000/api/health"
echo "3. Restart dev server if needed: Ctrl+C then pnpm dev"
```

### **"MCP Manager initialization failed"**
```bash
echo "🔧 Solution for MCP Manager initialization failed:"
echo "1. Check database connectivity: pnpm db:check"
echo "2. Verify MCP configuration: cat .mcp.json | jq ."
echo "3. Check environment variables: grep MCP .env"
echo "4. Restart dev server: pnpm dev"
```

### **"Archon server not responding"**
```bash
echo "🔧 Solution for Archon server not responding:"
echo "1. Check if Archon server is running on localhost:8051"
echo "2. Verify Archon configuration in .mcp.json or database"
echo "3. Check firewall settings for port 8051"
echo "4. Verify Bearer token configuration"
```

### **"OAuth flow failing"**
```bash
echo "🔧 Solution for OAuth flow failing:"
echo "1. Check CLIENT_ID and CLIENT_SECRET in environment"
echo "2. Verify OAuth callback URL: http://localhost:3000/api/mcp/oauth/callback"
echo "3. Check third-party service OAuth settings"
echo "4. Test OAuth endpoint accessibility"
```

### **"Tools not appearing in chat"**
```bash
echo "🔧 Solution for tools not appearing in chat:"
echo "1. Run: /validate-agents to check agent tool access"
echo "2. Verify tool loading pipeline: grep -r 'loadMcpTools' src/app/api/chat/"
echo "3. Check for agent-breaking patterns: grep -r 'mentions?.length ? {} :' src/"
echo "4. Test MCP tool conversion: pnpm test --grep 'mcp.*tool.*convert'"
```

## MCP Debugging Checklist

- [ ] Development server running on localhost:3000
- [ ] Database connectivity working
- [ ] MCP API endpoint accessible
- [ ] MCP Manager initializes without errors
- [ ] MCP servers configured (file or database)
- [ ] Network connectivity to third-party MCP servers
- [ ] OAuth configuration (if needed)
- [ ] Tool loading pipeline intact
- [ ] No agent-breaking patterns in code
- [ ] MCP tool conversion tests passing

## Quick MCP Health Summary

```bash
echo "🏥 Quick MCP Health Summary:"
echo "1. Server Health: $(curl -f http://localhost:3000/api/health >/dev/null 2>&1 && echo "✅ OK" || echo "❌ Failed")"
echo "2. MCP API: $(curl -f http://localhost:3000/api/mcp/list >/dev/null 2>&1 && echo "✅ OK" || echo "❌ Failed")"
echo "3. Database: $(pnpm db:check >/dev/null 2>&1 && echo "✅ OK" || echo "❌ Failed")"
echo "4. Archon Server: $(curl -f http://localhost:8051/mcp >/dev/null 2>&1 && echo "✅ OK" || echo "⚠️ Down")"
echo "5. Tool Loading: $(grep -r "loadMcpTools" src/app/api/chat/ >/dev/null 2>&1 && echo "✅ OK" || echo "❌ Missing")"
```

## Next Steps After Debugging

1. **If connection issues**: Check network, DNS, and server availability
2. **If authentication issues**: Verify OAuth setup and credentials
3. **If tool issues**: Run `/validate-agents` and `/validate-mcp tools`
4. **If configuration issues**: Use `/mcp` dashboard for visual management
5. **If persistent issues**: Check recent code changes for agent-breaking patterns

## Usage Examples

```bash
# Debug Archon server connection
/debug-mcp archon "server not responding"

# Debug GitHub MCP OAuth
/debug-mcp github "authentication failing"

# General MCP debugging
/debug-mcp all "tools not loading"

# Debug Playwright MCP setup
/debug-mcp playwright "STDIO connection issues"
```