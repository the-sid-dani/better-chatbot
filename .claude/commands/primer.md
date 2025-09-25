# /primer - Context Discovery & Analysis Command

**Purpose**: Prime Claude with comprehensive project context for task preparation (bug fixes, features, etc.)

**⚠️ IMPORTANT**: This command performs **analysis only** - no execution, no fixes, no changes.

## 📋 Context Discovery Process

### 1. **Project Structure Discovery**
**First Priority**: Get project layout understanding
- Use `tree` command to get comprehensive project structure
- Identify directory organization and file patterns
- Locate key configuration and documentation files

### 2. **Project Documentation Analysis**
**Core Documentation**: Read essential project files
- `CLAUDE.md` - Main project documentation (critical)
- `README.md` - Project overview and setup
- `.claude/` - Commands, agents, templates, memories
- Check for other `CLAUDE.md` files in subdirectories
- `package.json` - Dependencies, scripts, and metadata

### 3. **Architecture Understanding**
**System Overview**: Identify foundational patterns
- `src/lib/ai/models.ts` - AI provider configurations
- `src/app/api/chat/route.ts` - Main chat API patterns
- `instrumentation.ts` - Observability setup
- Key configuration files discovered in step 1

### 4. **Feature-Specific Analysis**
**Based on context, examine relevant systems:**

**Canvas System** (if relevant):
- `src/components/canvas-panel.tsx`
- `src/lib/ai/tools/artifacts/`
- `src/components/tool-invocation/`

**MCP Integration** (if relevant):
- `src/lib/ai/mcp/mcp-manager.ts`
- `src/app/api/mcp/`
- `.mcp.json`

**Database Layer** (if relevant):
- `src/lib/db/pg/schema.pg.ts`
- `src/lib/db/pg/repositories/`
- `drizzle.config.ts`

**Authentication** (if relevant):
- `src/lib/auth/`
- `src/middleware.ts`

### 5. **Codebase Exploration Strategy**
**Use all available MCP tools for comprehensive analysis:**

**Serena MCP (Primary code analysis):**
```bash
# Project structure analysis
mcp__serena__list_dir "." true
mcp__serena__get_symbols_overview "target-file.ts"
mcp__serena__find_symbol "target-function"
mcp__serena__search_for_pattern "relevant-pattern"
mcp__serena__list_memories  # Check existing project knowledge
```

**Other MCP Tools (as available and relevant):**
- **Archon MCP**: Project management, task tracking, documentation search
- **Vercel MCP**: Deployment status, project configuration
- **Neon MCP**: Database schema analysis, query optimization
- **Exa MCP**: Code examples, documentation research
- **Browser MCP**: UI testing, visual verification
- **Context-7 MCP**: Library documentation lookup

**Analysis Approach:**
- Start with `tree` and Serena for structure understanding
- Use specialized MCP tools based on project needs
- Leverage available memories and documentation
- Don't read entire files unless absolutely necessary

### 6. **Memory & Template Review**
**Check for existing context:**
- `.serena/memories/` - Project knowledge
- `.claude/agents/` - Agent configurations
- `.claude/commands/` - Available commands
- `PRPs/` - Requirements and plans

## 🎯 Analysis Output Format

After context discovery, provide:

### **Project Understanding Summary:**
1. **Architecture Overview**: Core frameworks and patterns
2. **System Components**: Key modules and their purposes
3. **Current State**: Git status, recent changes, active branches
4. **Dependencies**: Critical packages and versions
5. **Development Patterns**: Code conventions and workflows

### **Task Readiness Assessment:**
- **Relevant Files Identified**: Specific files related to user's intended work
- **Potential Impact Areas**: Components that might be affected
- **Testing Requirements**: What needs validation after changes
- **Dependencies to Consider**: Related systems or components

### **Contextual Recommendations:**
- **Best Approach**: Recommended strategy for the intended task
- **Risk Factors**: Potential issues or considerations
- **Validation Steps**: Health checks or tests to run
- **Documentation Needs**: Updates required after implementation

## ⚠️ Critical Guidelines

### **What This Command Does:**
- ✅ **Analyze** project structure and patterns
- ✅ **Review** documentation and configuration
- ✅ **Identify** relevant files and systems
- ✅ **Assess** current state and readiness
- ✅ **Recommend** approaches and considerations

### **What This Command Never Does:**
- ❌ **Execute** any fixes or changes
- ❌ **Install** dependencies or run builds
- ❌ **Modify** files or configuration
- ❌ **Run** validation commands or health checks
- ❌ **Start** development servers or processes

### **Output Focus:**
- **Analysis-Only**: Pure information gathering and assessment
- **Task-Oriented**: Context specific to user's next intended work
- **Risk-Aware**: Highlight potential complications or dependencies
- **Actionable**: Clear next steps for when ready to begin work

## 🚀 Usage Pattern

1. **Run `/primer`** - Get comprehensive project context
2. **Claude analyzes** - No execution, pure context discovery
3. **Review output** - Understanding summary and recommendations
4. **Proceed with task** - Now properly primed for bug fix/feature work

This command prepares Claude with the knowledge needed for informed task execution while maintaining strict boundaries between analysis and action.