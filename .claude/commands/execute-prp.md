# Execute BASE PRP

Implement a feature using using the PRP file.

## PRP File: $ARGUMENTS

## Execution Process

1. **System Health Check** (NEW - Better-Chatbot Specific)
   - **CRITICAL**: Check Langfuse observability: `curl -f http://localhost:3000/api/health/langfuse`
   - Validate system health: `/validate-system quick`
   - If working with Canvas: `/validate-canvas`
   - If working with MCP: `/validate-mcp`
   - If working with agents: `/validate-agents`

2. **Load PRP**
   - Read the specified PRP file
   - Understand all context and requirements
   - Follow all instructions in the PRP and extend the research if needed
   - Ensure you have all needed context to implement the PRP fully
   - Do more web searches and codebase exploration as needed

3. **ULTRATHINK**
   - Think hard before you execute the plan. Create a comprehensive plan addressing all requirements.
   - Break down complex tasks into smaller, manageable steps using your todos tools.
   - Use the TodoWrite tool to create and track your implementation plan.
   - Identify implementation patterns from existing code to follow.

3. **Execute the plan**
   - Execute the PRP
   - Implement all the code

4. **Validate**
   - Run each validation command
   - Fix any failures
   - Re-run until all pass

5. **Complete**
   - Ensure all checklist items done
   - Run final validation suite
   - Report completion status
   - Read the PRP again to ensure you have implemented everything

6. **Reference the PRP**
   - You can always reference the PRP again if needed

Note: If validation fails, use error patterns in PRP to fix and retry.