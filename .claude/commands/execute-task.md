# /execute-task - Intelligent Task Execution with Parallel Agents

**Purpose**: Execute straightforward tasks using primer context and parallel agent orchestration

**Usage**: `/execute-task <task_description> [--parallel] [--validate-only]`

## Variables
TASK_DESCRIPTION: $ARGUMENTS
EXECUTION_MODE: single|parallel (default: single)
VALIDATION_LEVEL: quick|full (default: quick)

## 🎯 Task Execution Strategy

### 1. **Context Validation**
**Prerequisite Check**: Ensure primer context is available
- Verify `/primer` has been run recently (check memories, documentation understanding)
- If primer context is missing, automatically run `/primer` first
- Load relevant project knowledge from Serena memories

### 2. **Task Analysis & Planning**
**Intelligent Task Breakdown**:
- Analyze task complexity and scope
- Determine if task needs parallel execution
- Identify required file changes and impact areas
- Create execution plan using TodoWrite tool
- Assess validation requirements

### 3. **Execution Mode Selection**

#### **Single Agent Mode** (Default)
For straightforward tasks requiring focused execution:
```bash
# Task execution with specialized agents
1. Implementation: Direct code changes with validation gates
2. Testing: validation-gates agent for comprehensive testing
3. Documentation: documentation-manager agent for doc updates
```

#### **Parallel Agent Mode** (--parallel flag)
For tasks benefiting from multiple approaches:
```bash
# Create 2-3 parallel implementations
1. Launch specialized agents in parallel using Task tool
2. Each agent works independently on the same task
3. Compare results and select best implementation
4. Merge winning solution with validation
```

### 4. **Agent Orchestration Pattern**

#### **Primary Execution Flow**:
```bash
# 1. Pre-execution validation
/validate-system quick
curl -f http://localhost:3000/api/health/langfuse

# 2. Implementation Phase
if [parallel_mode]; then
  # Launch parallel agents using Task tool
  Task(subagent_type: "general-purpose", description: "Implementation approach A")
  Task(subagent_type: "general-purpose", description: "Implementation approach B")
  # Compare and merge best solution
else
  # Direct implementation with context
  # Use primer knowledge for informed changes
fi

# 3. Validation Phase
Task(subagent_type: "validation-gates", description: "Validate implementation")

# 4. Documentation Phase
Task(subagent_type: "documentation-manager", description: "Update docs for changes")
```

### 5. **Smart Validation Integration**
**Context-Aware Testing**:
- Use primer context to determine relevant validation commands
- Canvas tasks → run Canvas validation
- MCP changes → run MCP validation
- Agent changes → run Agent validation
- Database changes → run database validation

### 6. **Available Subagent Types**
**Specialized Agents for Different Tasks**:
- **general-purpose**: Complex multi-step implementation tasks
- **validation-gates**: Testing, linting, type checking, quality assurance
- **documentation-manager**: README, CLAUDE.md, API docs updates
- **statusline-setup**: Configure user's Claude Code status line
- **output-style-setup**: Create Claude Code output styles

## 🚀 Execution Process

### Phase 1: Context & Planning
1. **Primer Context Check**: Ensure project understanding is current
2. **Task Analysis**: Break down requirements using TodoWrite
3. **Impact Assessment**: Identify files and systems affected
4. **Agent Selection**: Choose optimal execution strategy

### Phase 2: Implementation
1. **Pre-flight Checks**: System health validation
2. **Parallel Launch**: Deploy agents based on execution mode
3. **Progress Tracking**: Monitor agent completion via TodoWrite
4. **Result Consolidation**: Merge best implementations if parallel

### Phase 3: Quality Assurance
1. **Validation Gates**: Comprehensive testing via validation-gates agent
2. **Code Quality**: Linting, type checking, build validation
3. **Integration Testing**: System-specific validation commands
4. **Fix Iteration**: Repeat until all tests pass

### Phase 4: Documentation & Completion
1. **Documentation Updates**: Auto-update via documentation-manager
2. **Final Validation**: Complete system health check
3. **Completion Report**: Summary of changes and validation status

## 🛠️ Command Arguments

### Basic Usage
```bash
/execute-task "Fix the authentication redirect bug after login"
/execute-task "Add dark mode toggle to user settings"
/execute-task "Optimize canvas chart rendering performance"
```

### Advanced Usage
```bash
/execute-task "Implement user profile editing" --parallel
/execute-task "Update API documentation" --validate-only
/execute-task "Fix Canvas layout issues" --parallel --validate-full
```

### Argument Options
- `--parallel`: Use parallel agent execution for multiple approaches
- `--validate-only`: Skip implementation, only run validation on existing code
- `--validate-full`: Run comprehensive validation instead of quick checks
- `--skip-docs`: Skip automatic documentation updates (not recommended)

## ⚡ Better-Chatbot Specific Optimizations

### Canvas System Tasks
- Auto-detect Canvas-related tasks (chart, visualization, layout)
- Use Canvas validation: `/validate-canvas`
- Test with geographic data files in `/public/geo/`
- Verify chart tool artifact integration

### MCP Integration Tasks
- Auto-detect MCP server changes
- Use MCP validation: `/validate-mcp`
- Test MCP tool loading pipeline
- Verify database vs file-based config consistency

### Agent System Tasks
- Auto-detect agent-related changes
- Use agent validation: `/validate-agents`
- Test critical anti-patterns (tool access configurations)
- Verify agent mention patterns don't break tool access

### Vercel AI SDK Tasks
- Verify `streamText`/`generateText` patterns
- Test `experimental_telemetry` integration
- Validate Langfuse observability: `curl -f http://localhost:3000/api/health/langfuse`
- Check tool conversion to Vercel AI SDK interface

## 🔄 Error Handling & Recovery

### Common Failure Patterns
1. **Health Check Failures**: Auto-retry with different validation approaches
2. **Test Failures**: Use validation-gates agent for iterative fixes
3. **Parallel Agent Conflicts**: Automatic conflict resolution and best solution selection
4. **Documentation Inconsistencies**: Auto-correction via documentation-manager

### Recovery Strategies
- **Incremental Validation**: Fix one issue at a time with re-validation
- **Rollback Capability**: Git-based recovery if validation fails completely
- **Alternative Approaches**: Switch to parallel mode if single agent fails
- **Human Escalation**: Clear failure reporting when automatic recovery fails

## 📊 Success Criteria

### Task Completion Checklist
- [ ] All TodoWrite tasks completed
- [ ] Implementation matches task description
- [ ] All validation gates pass (lint, types, tests, build)
- [ ] System health checks pass
- [ ] Documentation updated appropriately
- [ ] No regressions introduced
- [ ] Changes follow project conventions

### Quality Gates
- **Code Quality**: Biome linting + TypeScript strict mode
- **Test Coverage**: All affected areas have tests
- **System Integration**: Langfuse observability functional
- **Performance**: No significant degradation in build/test times
- **Documentation**: CLAUDE.md and README.md accuracy maintained

This command bridges the gap between primer analysis and efficient task execution, leveraging Claude Code's powerful agent system while maintaining quality through comprehensive validation.