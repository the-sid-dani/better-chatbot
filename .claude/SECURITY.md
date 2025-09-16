# Security Configuration for Remote MCP Agents

## Overview

This document outlines the security configurations and best practices for using Model Context Protocol (MCP) servers with Claude Code remote agents in GitHub Actions.

## Permission Strategy

### Three-Tier Permission Model

1. **Allow List**: Explicitly permitted tools and operations
2. **Deny List**: Explicitly forbidden tools and operations (security-critical)
3. **Confirm List**: Operations requiring manual confirmation

### Core Security Principles

- **Principle of Least Privilege**: Grant only minimum required permissions
- **Defense in Depth**: Multiple security layers (environment variables, file access, tool restrictions)
- **Audit Trail**: Comprehensive logging and monitoring
- **Secret Management**: Secure handling of API keys and credentials

## File Access Security

### Protected Files and Directories

```json
"deny": [
  "Read(./.env)",           // Environment variables
  "Read(./.env.*)",         // Environment variable variants
  "Read(./secrets/**)",     // Secret directories
  "Read(./.aws/**)",        // AWS credentials
  "Read(./.ssh/**)",        // SSH keys
  "Read(~/.ssh/**)",        // User SSH keys
  "Read(~/.aws/**)"         // User AWS credentials
]
```

### Rationale

- **Environment Files**: Contain sensitive API keys, database URLs, and configuration secrets
- **AWS/SSH Directories**: Critical authentication credentials that should never be exposed
- **Secret Directories**: Custom secret storage locations

## Command Execution Security

### Dangerous Commands (Blocked)

```json
"deny": [
  "Bash(rm:*)",           // File deletion
  "Bash(sudo:*)",         // Privilege escalation
  "Bash(su:*)",           // User switching
  "Bash(chmod:*)",        // Permission changes
  "Bash(chown:*)",        // Ownership changes
  "Bash(curl:*)",         // Network requests (potential data exfiltration)
  "Bash(wget:*)",         // Network downloads
  "Bash(ssh:*)",          // Remote connections
  "Bash(scp:*)",          // Secure copy
  "Bash(rsync:*)",        // Sync operations
  "Bash(dd:*)",           // Disk operations
  "Bash(mkfs:*)",         // Filesystem creation
  "Bash(fdisk:*)"         // Disk partitioning
]
```

### High-Risk Commands (Require Confirmation)

```json
"confirm": [
  "Bash(git push origin main)",     // Production deployments
  "Bash(git push origin master)",   // Production deployments
  "Bash(git reset --hard:*)",       // Destructive git operations
  "Bash(git clean -fd:*)",          // File deletion
  "Bash(npm publish:*)",            // Package publishing
  "Bash(pnpm publish:*)",           // Package publishing
  "Bash(docker build:*)",           // Container builds
  "Bash(docker push:*)"             // Container registry pushes
]
```

## MCP Server Security

### Approved MCP Servers

All MCP servers are explicitly approved and configured with security considerations:

1. **browserbasehq-mcp-browserbase**: Cloud browser automation
   - **Risk Level**: Medium
   - **Mitigation**: API key required, session isolation
   - **Monitoring**: Track browser session usage

2. **exa**: Web search and research
   - **Risk Level**: Low-Medium
   - **Mitigation**: Read-only operations, API rate limiting
   - **Monitoring**: Search query logging

3. **janwilmake-openapi-mcp-server**: API documentation
   - **Risk Level**: Low
   - **Mitigation**: Read-only API analysis
   - **Monitoring**: API endpoint analysis tracking

4. **upstash-context-7-mcp**: Library documentation
   - **Risk Level**: Low
   - **Mitigation**: Documentation access only
   - **Monitoring**: Library lookup tracking

5. **cloudflare-playwright-mcp**: Local browser automation
   - **Risk Level**: Medium-High
   - **Mitigation**: Sandboxed browser environment
   - **Monitoring**: Browser action logging

## Environment Variable Security

### GitHub Secrets Configuration

Required secrets for MCP server authentication:

```bash
# Required secrets (add to GitHub repository settings)
ANTHROPIC_API_KEY          # Claude Code authentication
EXA_API_KEY               # Web search capabilities
BROWSERBASE_API_KEY       # Cloud browser automation
BROWSERBASE_PROJECT_ID    # Browser session management
UPSTASH_REDIS_REST_URL    # Context-7 documentation cache
UPSTASH_REDIS_REST_TOKEN  # Context-7 authentication
```

### Secret Management Best Practices

1. **Never commit secrets to repository**
2. **Use environment variable expansion in .mcp.json**
3. **Rotate secrets regularly**
4. **Monitor secret usage in GitHub Actions logs**
5. **Use repository-level secrets, not organization-level for sensitive projects**

## Monitoring and Audit

### Telemetry Configuration

```json
"env": {
  "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
  "MAX_MCP_OUTPUT_TOKENS": "50000",
  "OTEL_METRICS_EXPORTER": "console"
}
```

### Key Metrics to Monitor

- **Tool Usage**: Track which MCP tools are being used most frequently
- **Permission Violations**: Log denied operations
- **API Usage**: Monitor MCP server API consumption
- **Cost Tracking**: Claude API usage per workflow
- **Error Rates**: MCP server connection failures

## Incident Response

### Security Event Types

1. **Permission Violations**: Attempts to access denied files/commands
2. **Unusual Tool Usage**: Unexpected MCP server interactions
3. **High API Usage**: Potential abuse or runaway processes
4. **Authentication Failures**: MCP server connection issues

### Response Procedures

1. **Immediate**: Review GitHub Actions logs
2. **Investigation**: Analyze tool usage patterns
3. **Mitigation**: Revoke/rotate API keys if needed
4. **Prevention**: Update permission configurations

## Regular Security Reviews

### Monthly Tasks

- [ ] Review GitHub Actions workflow logs
- [ ] Audit MCP server API usage
- [ ] Check for new security vulnerabilities in MCP servers
- [ ] Validate GitHub secrets are still required and active

### Quarterly Tasks

- [ ] Update MCP server versions
- [ ] Review and update permission configurations
- [ ] Conduct security assessment of new workflow patterns
- [ ] Review and rotate API keys

## Emergency Procedures

### Immediate Actions for Security Incidents

1. **Disable GitHub Actions**: Temporarily disable workflow if needed
2. **Revoke API Keys**: Rotate all MCP server API keys
3. **Review Logs**: Analyze recent workflow executions
4. **Update Configurations**: Strengthen permissions if needed
5. **Document Incident**: Record findings and improvements

### Contact Information

- **Security Team**: [Add your security contact]
- **GitHub Admin**: [Add GitHub admin contact]
- **MCP Server Support**: [Add relevant support contacts]