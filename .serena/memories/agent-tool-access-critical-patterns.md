# CRITICAL: Agent Tool Access Patterns & Prevention Guidelines

## Root Cause of Canvas Breaking Agent Tools

### What Happened
When Canvas features were added to the better-chatbot platform, someone introduced **defensive conditional logic** in `/src/components/chat-bot.tsx:364-369` that completely disabled tool access for agents:

```typescript
// PROBLEMATIC CODE (found and fixed)
allowedAppDefaultToolkit: latestRef.current.mentions?.length
  ? []  // ❌ Disables ALL app tools when mentions exist
  : latestRef.current.allowedAppDefaultToolkit,
allowedMcpServers: latestRef.current.mentions?.length  
  ? {}  // ❌ Disables ALL MCP servers when mentions exist
  : latestRef.current.allowedMcpServers,
```

### Why This Broke Agents Specifically
1. **Agents ALWAYS have mentions** - that's how they're configured with tool access
2. **When mentions exist**, the logic set both `allowedAppDefaultToolkit: []` and `allowedMcpServers: {}`
3. **Regular chat unaffected** - doesn't use agent mentions
4. **Canvas chart tools still worked** - they bypass this filtering mechanism

### Architecture Understanding

#### Tool Loading Pipeline (3 Layers)
1. **MCP Tools**: External server tools loaded via `loadMcpTools()`
2. **Workflow Tools**: User-created workflow tools via `loadWorkFlowTools()`  
3. **App Default Tools**: Built-in tools via `loadAppDefaultTools()`

#### Canvas Tool Architecture
- **New Artifact Tools**: Individual chart tools in `src/lib/ai/tools/artifacts/`
  - bar-chart-tool.ts, line-chart-tool.ts, pie-chart-tool.ts, area-chart-tool.ts
  - funnel-chart-tool.ts, radar-chart-tool.ts, scatter-chart-tool.ts, etc.
- **Chart Tool Integration**: Main chart tools in `src/lib/ai/tools/chart-tool.ts`
- **Dashboard Orchestration**: dashboard-orchestrator-tool.ts for multi-chart dashboards
- **Canvas Naming**: Intelligent naming system in `src/lib/ai/canvas-naming.ts`

#### Agent Tool Access Flow
1. **Agent Configuration**: Agents configured with `agent.instructions.mentions` array
2. **Client Request**: chat-bot.tsx passes `allowedMcpServers` and `allowedAppDefaultToolkit`
3. **Server Processing**: `/api/chat/route.ts` merges agent mentions with request mentions
4. **Tool Loading**: Server loads tools using both mention filtering AND server/toolkit allowances
5. **Tool Execution**: Filtered tools available for agent to call

## CRITICAL PREVENTION GUIDELINES

### 🚨 NEVER Do These When Adding New Features

#### ❌ DON'T Disable Tools Based on Mentions
```typescript
// NEVER do this - breaks agent functionality
allowedMcpServers: mentions?.length ? {} : allowedMcpServers,
allowedAppDefaultToolkit: mentions?.length ? [] : allowedAppDefaultToolkit,
```

#### ❌ DON'T Assume Mentions Mean "No Tools Needed"
- **Mentions are FOR AGENTS** - they specify which tools agents can use
- **Mentions should be ADDITIVE** - they add context, don't restrict access
- **Empty mentions ≠ no tools** - could be regular chat needing full tool access

#### ❌ DON'T Bypass Tool Loading Logic
- Always use the established `loadMcpTools()`, `loadWorkFlowTools()`, `loadAppDefaultTools()` pipeline
- Don't create separate tool loading paths that bypass security filtering
- Don't hardcode tool lists in client components

### ✅ DO Follow These Patterns

#### ✅ Respect Tool Loading Architecture
```typescript
// CORRECT - always pass full configuration
allowedAppDefaultToolkit: latestRef.current.allowedAppDefaultToolkit,
allowedMcpServers: latestRef.current.allowedMcpServers,
```

#### ✅ Use Established Tool Integration Patterns
1. **MCP Tools**: Add to MCP servers, configure in allowedMcpServers
2. **Workflow Tools**: Create workflows, they become tools automatically
3. **App Default Tools**: Add to `APP_DEFAULT_TOOL_KIT` in `src/lib/ai/tools/tool-kit.ts`
4. **Canvas Artifact Tools**: Add to `src/lib/ai/tools/artifacts/` directory

#### ✅ Test Agent Functionality When Adding Features
- **Always test agents** after adding new tool-related features
- **Check tool availability** in agent conversations
- **Verify MCP tools load** properly for agents
- **Test with different agent configurations** (with/without mentions)

### Key Files to Monitor for Agent Impact

#### Critical Touch Points
1. **`/src/components/chat-bot.tsx`** - Main chat interface, tool request building
2. **`/src/app/api/chat/route.ts`** - Server-side tool loading and agent integration
3. **`/src/app/api/chat/shared.chat.ts`** - Tool filtering and loading logic
4. **`/src/lib/ai/tools/tool-kit.ts`** - App default tool registry

#### Safe Modification Areas (Low Agent Impact)
1. **`/src/components/canvas/`** - Canvas-specific components
2. **`/src/lib/ai/tools/artifacts/`** - Individual artifact tools
3. **`/src/components/tool-invocation/`** - Tool result visualization
4. **Canvas naming and display logic** - doesn't affect tool loading

### Testing Checklist for New Features

#### Before Deploying Changes
- [ ] Regular chat can access MCP tools
- [ ] Regular chat can access app default tools
- [ ] Agents can access MCP tools (check with @agent mentions)
- [ ] Agents can access app default tools  
- [ ] Canvas chart tools work in both regular chat and agents
- [ ] Tool error messages don't show "unavailable tool" errors

#### Debug Commands for Tool Issues
```bash
# Check server logs for tool loading
pnpm dev | grep "mcp-tools count\|allowedMcpTools\|binding tool count"

# Check MCP server status  
curl http://localhost:3000/api/mcp/list

# Check agent configurations
curl http://localhost:3000/api/agent?filters=all&limit=10
```

### Recovery Patterns

#### If Agents Lose Tool Access
1. **Check client-side filtering** in `chat-bot.tsx` around line 364
2. **Verify server-side tool loading** in `shared.chat.ts` loadMcpTools function
3. **Check mention processing** in chat route.ts around line 141-143
4. **Test with agent without mentions** to isolate filtering vs loading issues

#### If New Tools Don't Appear
1. **Add to appropriate toolkit** in `tool-kit.ts`
2. **Verify tool registration** in server logs
3. **Check tool permissions** in allowedAppDefaultToolkit state
4. **Test tool loading** independent of agent configuration

## Emergency Rollback Strategy

If agent tool access breaks again:
1. **Revert client-side filtering logic** in `chat-bot.tsx`
2. **Check for new conditional logic** around tool configuration passing
3. **Test with minimal agent configuration** (no mentions) to isolate issue
4. **Compare with working regular chat functionality**

This pattern of **disabling tools when mentions exist** is the most common way to break agent functionality. Always preserve full tool configuration passing regardless of mention state.