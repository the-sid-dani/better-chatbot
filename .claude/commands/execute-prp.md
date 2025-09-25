# Execute PRP Implementation

Execute a comprehensive PRP (Project Requirements Plan) to implement features systematically using context engineering principles and Better-Chatbot architectural patterns. This command ensures robust implementation with comprehensive validation, error handling, and quality assurance.

## PRP File: $ARGUMENTS

## Execution Process

### 1. **Enhanced System Health Check** (Better-Chatbot Specific)

   **Critical Infrastructure Validation:**
   - **REQUIRED**: Langfuse observability: `curl -f http://localhost:3000/api/health/langfuse`
   - **REQUIRED**: Port 3000 availability (Better-Chatbot localhost:3000 constraint)
   - **Database**: PostgreSQL connection and schema validation
   - **Build System**: Node.js and pnpm version compatibility
   - **Development Environment**: Environment variables and dependencies

   **Context-Specific System Checks:**
   - If Canvas work: `/validate-canvas` + verify chart tool registry
   - If MCP work: `/validate-mcp` + test server connections and tool availability
   - If Agent work: `/validate-agents` + check agent permissions and visibility
   - If Authentication work: Test auth flows and session management
   - If Workflow work: Verify workflow engine and XYFlow integration

   **Pre-Implementation Validation:**
   ```bash
   # Core system validation
   pnpm check-types --noEmit
   pnpm lint --max-warnings 0
   node -v && pnpm -v
   ```

### 2. **Comprehensive PRP Analysis & Context Loading**

   **PRP Structure Validation:**
   - Read PRP file: `$ARGUMENTS`
   - Validate PRP completeness and structure
   - Extract implementation requirements and success criteria
   - Identify Better-Chatbot specific integration points
   - Map to existing architectural patterns

   **Deep Context Research:**
   - Follow all PRP instructions and extend research as needed
   - Perform targeted web searches for technical patterns
   - Explore codebase using Serena MCP tools for relevant patterns
   - Use Archon MCP for project context and task management
   - Leverage Context-7 MCP for library documentation
   - Ensure comprehensive understanding before implementation

   **Architecture Pattern Identification:**
   - Verify Vercel AI SDK integration patterns
   - Check Canvas system integration requirements
   - Identify MCP tool conversion needs
   - Review observability integration points
   - Map database schema requirements

### 3. **ULTRATHINK - Comprehensive Implementation Planning**

   **Strategic Planning:**
   - Create comprehensive plan addressing ALL PRP requirements
   - Break down complex tasks into atomic, manageable steps
   - **MANDATORY**: Use TodoWrite tool for implementation tracking
   - Identify implementation patterns from existing Better-Chatbot code
   - Plan validation strategy and testing approach
   - Consider performance, security, and maintainability impacts

   **Risk Assessment:**
   - Identify potential breaking changes and mitigation strategies
   - Plan backward compatibility considerations
   - Assess impact on Canvas, MCP, and Agent systems
   - Consider observability and monitoring implications
   - Plan rollback scenarios if needed

### 4. **Systematic Implementation**

   **Code Implementation Phase:**
   - Execute the PRP systematically following the planned approach
   - Implement all code changes following Better-Chatbot patterns
   - Use established Vercel AI SDK patterns for AI operations
   - Follow Canvas integration patterns for visualization tools
   - Implement proper MCP tool conversion if needed
   - Ensure Langfuse observability integration

   **Implementation Standards:**
   - Follow TypeScript strict mode and Better-Chatbot code style
   - Use Biome formatting and linting standards
   - Implement proper error handling and edge cases
   - Add comprehensive logging and observability
   - Follow security best practices

### 5. **Multi-Layer Validation Framework**

   **Structure Validation:**
   ```bash
   # Verify file structure and imports
   find src -name "*.ts" -o -name "*.tsx" | head -20 | xargs ls -la
   grep -r "import.*from" src/lib/ai/ | head -10
   ```

   **Content Validation:**
   ```bash
   # Check for incomplete implementations
   grep -r "TODO\|PLACEHOLDER\|FIXME" src/ || echo "✅ No incomplete markers"
   grep -r "console.log\|console.error" src/ && echo "⚠️ Remove debug logs" || echo "✅ Clean logging"
   ```

   **Functionality Validation:**
   ```bash
   # Core system checks
   pnpm check-types
   pnpm lint
   pnpm test
   pnpm build:local
   ```

   **Better-Chatbot Specific Validation:**
   ```bash
   # Canvas integration check (if applicable)
   grep -r "shouldCreateArtifact" src/lib/ai/tools/artifacts/ || echo "Canvas integration verification"

   # MCP integration check (if applicable)
   grep -r "createTool" src/lib/ai/mcp/ || echo "MCP tool conversion verification"

   # Observability check
   curl -f http://localhost:3000/api/health/langfuse

   # Agent system check (if applicable)
   grep -r "allowedMcpServers" src/app/api/chat/ || echo "Agent tool configuration verification"
   ```

### 6. **Quality Assurance Process**

   **Code Quality Verification:**
   - [ ] Follows Vercel AI SDK patterns for all AI operations
   - [ ] Uses established Canvas integration patterns (if applicable)
   - [ ] Implements proper MCP tool conversion (if applicable)
   - [ ] Includes comprehensive error handling and edge cases
   - [ ] Maintains Better-Chatbot architectural conventions
   - [ ] Implements proper observability integration

   **Integration Testing:**
   - [ ] Manual testing of all implemented features
   - [ ] Cross-system integration testing (Canvas, MCP, Agents)
   - [ ] Performance impact assessment
   - [ ] Security considerations reviewed and implemented
   - [ ] Mobile responsiveness verified (if UI changes)

   **System Compatibility:**
   - [ ] No breaking changes to existing functionality
   - [ ] Backward compatibility maintained where possible
   - [ ] Database migrations properly implemented (if needed)
   - [ ] Environment configuration updated (if needed)

### 7. **Documentation and Knowledge Management**

   **Required Documentation Updates:**
   - [ ] Update relevant CLAUDE.md sections if architectural patterns change
   - [ ] Update component documentation and code comments
   - [ ] Add/update API documentation for new endpoints
   - [ ] Update .claude/commands if new patterns emerge
   - [ ] Document new MCP integrations in appropriate locations
   - [ ] Update Canvas system documentation if chart tools added
   - [ ] Create/update PRP documentation for future reference

   **Knowledge Preservation:**
   - [ ] Use Serena memory system to document new patterns
   - [ ] Update Archon project management with implementation notes
   - [ ] Document any architectural decisions or trade-offs made

### 8. **Final Verification & Completion**

   **Comprehensive Final Check:**
   - Re-read the original PRP to ensure 100% requirement coverage
   - Verify all success criteria from PRP are met
   - Run complete validation suite one final time
   - Test end-to-end functionality in development environment
   - Verify observability and monitoring are functioning

   **Completion Report:**
   - Document implementation status and any deviations from PRP
   - Note any follow-up items or recommendations
   - Confirm system health and stability
   - Provide clear handoff documentation if needed

## Success Criteria

The implementation is complete when ALL of the following criteria are met:

- [ ] **PRP Requirements**: All requirements from the PRP document are fully implemented
- [ ] **Code Quality**: TypeScript compilation passes with zero errors
- [ ] **Testing**: All unit tests pass without failures
- [ ] **Linting**: Code passes all linting checks with zero warnings
- [ ] **Build**: Production build completes successfully
- [ ] **System Health**: All Better-Chatbot health checks pass
- [ ] **Observability**: Langfuse integration working and traces visible
- [ ] **Canvas Integration**: Chart tools and Canvas functionality work (if applicable)
- [ ] **MCP Integration**: MCP servers and tools accessible (if applicable)
- [ ] **Agent System**: Agent permissions and visibility correct (if applicable)
- [ ] **Performance**: No significant performance degradation introduced
- [ ] **Security**: Security best practices followed and no vulnerabilities introduced
- [ ] **Documentation**: All relevant documentation updated and accurate
- [ ] **Backward Compatibility**: No breaking changes to existing functionality
- [ ] **Manual Testing**: End-to-end manual testing passes
- [ ] **PRP Verification**: Final review confirms 100% PRP requirement coverage

## Error Handling & Retry Logic

### Systematic Error Resolution Process

**When Validation Fails:**
1. **Error Analysis**: Identify root cause from logs, output, and error messages
2. **Pattern Recognition**: Match error to common Better-Chatbot patterns
3. **Targeted Fix**: Address specific issue without affecting working components
4. **Incremental Validation**: Test fix in isolation before full validation
5. **Re-validation**: Run complete validation suite
6. **Maximum 3 Retry Cycles**: Escalate or seek help if still failing

### Common Error Patterns & Solutions

**TypeScript Compilation Errors:**
- Check import statements and module resolution
- Verify type definitions and interface compatibility
- Check Vercel AI SDK type usage patterns
- Review Canvas and MCP type integrations

**Build Failures:**
- Verify all dependencies are installed and compatible
- Check environment variable requirements
- Review Next.js configuration changes
- Validate public asset requirements (especially for Canvas geographic data)

**Test Failures:**
- Update test cases to match new implementation
- Mock new dependencies appropriately
- Check test environment setup and data
- Verify async/await patterns in tests

**Better-Chatbot Specific Issues:**
- **Canvas Problems**: Check artifact tool registration and chart component integration
- **MCP Issues**: Verify server connections, tool conversion, and availability
- **Agent Problems**: Check tool loading pipeline and permission configurations
- **Observability Issues**: Verify Langfuse configuration and instrumentation setup

**Performance Issues:**
- Check for memory leaks in Canvas state management
- Review database query efficiency
- Validate proper cleanup in React components
- Monitor bundle size impact

### Escalation Process

**If 3 retry cycles fail:**
1. Document all error patterns encountered
2. Capture full logs and system state
3. Create detailed issue report with reproduction steps
4. Seek architectural guidance or external review
5. Consider alternative implementation approaches

## Validation Commands Reference

### Core System Validation
```bash
# Essential checks that must always pass
pnpm check-types                    # TypeScript validation
pnpm lint                          # Code quality and style
pnpm test                          # Unit test suite
pnpm build:local                   # Production build test
```

### Better-Chatbot Health Checks
```bash
# System health validation
curl -f http://localhost:3000/api/health/langfuse  # Observability check
lsof -i :3000                     # Port availability check
node -v && pnpm -v                # Version compatibility check
```

### Feature-Specific Validation
```bash
# Canvas system (if applicable)
find src/lib/ai/tools/artifacts -name "*-tool.ts" | wc -l  # Chart tools count
grep -r "shouldCreateArtifact" src/lib/ai/tools/artifacts/ # Canvas integration

# MCP system (if applicable)
find src/lib/ai/mcp -name "*.ts" | head -5 # MCP integration files
grep -r "mcpClientsManager" src/lib/ai/ # MCP manager usage

# Agent system (if applicable)
grep -r "allowedMcpServers" src/app/api/chat/ # Agent tool configuration
grep -r "AgentSchema" src/lib/db/ # Agent database integration
```

## Reference Notes

**PRP Re-Reference**: Always available to reference the original PRP document at any stage if clarification is needed on requirements, context, or success criteria.

**Architecture Patterns**: Leverage existing Better-Chatbot patterns for Vercel AI SDK integration, Canvas system usage, MCP tool conversion, and observability implementation.

**System Constraints**: Remember Better-Chatbot's localhost:3000 requirement and specific integration patterns for Canvas, MCP, and Agent systems.

**Quality Standards**: Maintain high code quality standards with comprehensive testing, proper error handling, and full observability integration throughout the implementation process.