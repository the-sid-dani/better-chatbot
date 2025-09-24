# Agent System Validation

Validate agent functionality after adding new tools or functionality: $ARGUMENTS (optional: agent name to test specifically)

## Agent Validation Process

### 1. **Critical Anti-Pattern Detection**
Check for common agent-breaking patterns that have been fixed before:

```bash
# Search for dangerous tool disabling patterns
grep -r "allowedMcpServers.*mentions.*length.*?" src/app/api/chat/
grep -r "mentions?.length ? {} : servers" src/app/api/chat/
```

**🚨 CRITICAL FAILURES TO DETECT:**
- `allowedMcpServers: mentions?.length ? {} : servers` - BREAKS AGENTS
- Any logic that disables tools based on mentions
- Bypassing established tool loading pipeline

### 2. **Tool Loading Pipeline Validation**
Ensure the established tool loading pipeline remains intact:

```bash
# Verify core tool loading functions exist and work
pnpm test --grep "loadMcpTools"
pnpm test --grep "loadWorkFlowTools"
pnpm test --grep "loadAppDefaultTools"

# Check tool loading in chat routes
grep -r "loadMcpTools\|loadWorkFlowTools\|loadAppDefaultTools" src/app/api/chat/
```

### 3. **Agent Tool Access Validation**
Test that agents can access their configured tools:

```bash
# Test agent mentions are treated as ADDITIVE (specify which tools to use)
pnpm test --grep "allowedMcpServers|allowedAppDefaultToolkit"

# Verify agents preserve full tool configuration regardless of mentions
grep -r "allowedMcpServers.*mentions" src/app/api/chat/
grep -r "allowedAppDefaultToolkit.*mentions" src/app/api/chat/
```

### 4. **Specific Agent Testing**
Test individual agents to ensure they have tool access:

```bash
# Test documentation-manager agent (frequently used)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"@agent-documentation-manager test tools access"}]}'

# Test validation-gates agent
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"@agent-validation-gates test validation commands"}]}'
```

### 5. **MCP Server Agent Integration**
Validate that agents can access MCP servers properly:

```bash
# Check MCP server availability for agents
curl -s http://localhost:3000/api/mcp/list | jq '.mcpServers | keys[]' || echo "⚠️ MCP servers not accessible to agents"

# Test agent MCP tool access
pnpm test src/lib/ai/mcp/ --grep "agent"
```

### 6. **Canvas Tool Agent Integration**
Validate agents can use Canvas and chart tools:

```bash
# Test chart tool access for agents
pnpm test --grep "chart.*tool.*agent"

# Verify Canvas integration doesn't break agent workflows
pnpm test src/components/canvas-panel.tsx --grep "agent"
```

## Agent-Specific Validation Checklist

### ✅ **Correct Agent Implementation:**
- [ ] Agent mentions are ADDITIVE (specify tools to use, not restrictions)
- [ ] Full `allowedMcpServers` passed regardless of mentions
- [ ] Full `allowedAppDefaultToolkit` passed regardless of mentions
- [ ] Established tool loading pipeline used (`loadMcpTools()`, etc.)
- [ ] Agents tested after any chat interface changes

### ❌ **Critical Anti-Patterns (Must Fix):**
- [ ] **NEVER**: `allowedMcpServers: mentions?.length ? {} : servers`
- [ ] **NEVER**: Assume mentions mean "no tools needed"
- [ ] **NEVER**: Disable tools based on mentions
- [ ] **NEVER**: Bypass `loadMcpTools()`, `loadWorkFlowTools()`, `loadAppDefaultTools()`

## Common Agent Failure Scenarios

### **Scenario 1: New Chart Tool Added**
When new chart tools are added, agents may lose access:
```bash
# Validate chart tools are accessible to agents
pnpm test src/lib/ai/tools/artifacts/ --grep "agent"
grep -r "chart.*tool" src/app/api/chat/shared.chat.ts
```

### **Scenario 2: New MCP Server Added**
When MCP servers are added, agents may need reconfiguration:
```bash
# Check MCP server registration for agents
pnpm test src/lib/ai/mcp/db-mcp-config-storage.test.ts
curl -s http://localhost:3000/api/mcp/list | jq '.mcpServers | length'
```

### **Scenario 3: Canvas Integration Changes**
Canvas changes may break agent tool access:
```bash
# Test Canvas doesn't interfere with agent functionality
pnpm test src/components/chat-bot.tsx --grep "agent.*canvas"
```

## Quick Agent Health Check

Run this after any significant changes:

```bash
# Essential agent validation sequence
echo "🔍 Checking agent tool access patterns..."
grep -r "allowedMcpServers.*mentions" src/app/api/chat/ && echo "⚠️ Potential agent tool access issue found"

echo "🔍 Checking tool loading pipeline..."
pnpm test --grep "loadMcpTools|loadWorkFlowTools|loadAppDefaultTools" --reporter=silent && echo "✅ Tool loading pipeline OK"

echo "🔍 Checking agent-specific tests..."
pnpm test --grep "agent" --reporter=silent && echo "✅ Agent tests passing"

echo "🔍 Checking MCP agent access..."
curl -f http://localhost:3000/api/mcp/list >/dev/null 2>&1 && echo "✅ MCP servers accessible to agents"

echo "📝 Agent validation complete"
```

## Recovery Actions

If agent validation fails:

1. **Check for tool disabling logic** - Remove any `mentions?.length` conditions
2. **Verify tool loading pipeline** - Ensure all three `load*Tools()` functions are called
3. **Test individual agents** - Use curl commands above to test specific agents
4. **Check recent changes** - Review commits that may have affected agent tool access
5. **Validate with validation-gates agent** - Use the agent to validate its own access

Remember: **Agents ALWAYS need tool access** - mentions specify WHICH tools, not WHETHER to disable tools.