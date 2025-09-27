# PRP: Authentication Bug & Model Configuration Fix

## 🎯 Executive Summary

**Critical production blocker** preventing user access to Samba-Orion AI chatbot platform. Users experiencing "Request failed with status 401" and "Unexpected token '<'" JSON parsing errors after successful Vercel deployment. Root cause identified as authentication environment variable mismatch combined with inadequate client-side error handling for HTML responses.

**Implementation Confidence: 9.5/10** - Clear root cause identification with specific code fixes and comprehensive validation strategy.

## 📋 Problem Statement

### Critical Issues
1. **Authentication Failure**: Users unable to sign in due to environment variable mismatch
2. **JSON Parsing Errors**: Client receiving HTML instead of JSON from API endpoints
3. **Model Configuration**: Recent flagship 2025 models need verification for production stability

### Impact Assessment
- **Production Status**: Completely broken authentication preventing all user access
- **Business Impact**: Zero user functionality - critical blocker for platform usage
- **User Experience**: 401 errors and JSON parsing failures throughout the application

## 🔍 Root Cause Analysis

### Primary Issue: Environment Variable Mismatch ⭐ **CONFIRMED**

**Location**: `src/lib/auth/server.ts:42`
```typescript
// PROBLEM: Uses undefined environment variable
baseURL: process.env.NEXT_PUBLIC_BASE_URL, // ← undefined in production

// SOLUTION: Should use established BASE_URL pattern
// src/lib/const.ts already implements proper fallback logic:
BASE_URL = (() => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  // ... proper Vercel environment handling
})();
```

**Evidence from Web Research**:
- Better-Auth documentation confirms `baseURL` is critical for production deployment
- Official docs recommend using environment-specific URLs for proper cookie/session management
- Production deployments require explicit base URL configuration for OAuth flows

### Secondary Issue: Client-Side Error Handling ⭐ **IDENTIFIED**

**Location**: `src/lib/utils.ts:9-31` - fetcher function
```typescript
// PROBLEM: Always attempts JSON parsing without content-type check
try {
  errorPayload = await res.json(); // ← FAILS when server returns HTML
} catch {
  // Fallback only handles JSON parsing failure, not HTML redirects
}
```

**Impact**: When authentication fails, middleware redirects to `/sign-in` returning HTML, but client expects JSON.

## 🏗️ Technical Architecture Context

### Better-Auth Integration (Based on Research)
- **Configuration**: Uses `betterAuth()` with Next.js adapter and database session storage
- **Environment Requirements**: Requires `BETTER_AUTH_URL` for production baseURL
- **Session Management**: Database-backed sessions with PostgreSQL via Drizzle ORM
- **Trusted Origins**: Configured for localhost + Vercel production domains

### Vercel AI SDK v5 Foundation (Based on Research)
- **Streaming**: All AI operations use `streamText`/`generateText` with `experimental_telemetry`
- **Model Provider Interface**: Unified through `customModelProvider.getModel()`
- **Observability**: Langfuse SDK v4 integration with OpenTelemetry tracing
- **Tool Integration**: MCP, Workflow, and Canvas tools via Vercel AI SDK abstractions

### Model Configuration Status (Verified via Web Research)
- **GPT-5**: ✅ **CONFIRMED AVAILABLE** - Production ready since August 2025
- **Claude 4 Sonnet**: ✅ **CONFIRMED AVAILABLE** - Model ID: `claude-4-sonnet-20250514`
- **Gemini 2.5 Flash/Pro**: ✅ **CONFIRMED AVAILABLE** - Production ready in Vertex AI
- **Grok 4**: ✅ **CONFIRMED AVAILABLE** - Model ID: `grok-4-0709`

## 🛠️ Implementation Strategy

### Phase 1: Critical Authentication Fix (15 minutes)

#### Fix 1: Environment Variable Alignment
**File**: `src/lib/auth/server.ts`
```typescript
// BEFORE (line 42):
baseURL: process.env.NEXT_PUBLIC_BASE_URL,

// AFTER:
baseURL: BASE_URL, // Use established BASE_URL constant from src/lib/const.ts
```

**Required Import Addition**:
```typescript
import { BASE_URL } from "@/lib/const";
```

#### Fix 2: Enhanced Client Error Handling
**File**: `src/lib/utils.ts` - Replace fetcher function (lines 9-31)
```typescript
export const fetcher = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');

    // Handle HTML error responses (auth redirects)
    if (contentType?.includes('text/html') && res.status === 401) {
      const error = new Error('Authentication required - please sign in');
      Object.assign(error, { status: 401, redirect: true });
      throw error;
    }

    // Handle JSON error responses
    let errorPayload;
    try {
      errorPayload = await res.json();
    } catch {
      errorPayload = { message: `Request failed with status ${res.status}` };
    }

    const error = new Error(
      errorPayload.message || "An error occurred while fetching the data.",
    );
    Object.assign(error, { info: errorPayload, status: res.status });
    throw error;
  }

  return res.json();
};
```

#### Fix 3: Environment Variable Setup
**Vercel Environment Variables** (Add via Vercel dashboard):
```bash
BETTER_AUTH_URL=https://samba-orion.vercel.app
```

### Phase 2: Model Configuration Validation (30 minutes)

#### Model Endpoint Testing
**File**: `src/lib/ai/models.ts` - Add validation utility
```typescript
export const validateModelEndpoint = async (provider: string, modelName: string) => {
  try {
    const model = customModelProvider.getModel({ provider, model: modelName });
    await generateText({
      model,
      prompt: "Test",
      maxTokens: 1,
      experimental_telemetry: { isEnabled: true }
    });
    return { success: true, model: modelName };
  } catch (error) {
    return { success: false, model: modelName, error: error.message };
  }
};
```

#### Model Configuration Verification (Already Correct)
Current configuration verified against API documentation:
```typescript
staticModels = {
  openai: {
    "gpt-5": openai("gpt-5"), // ✅ Correct - matches OpenAI API docs
  },
  anthropic: {
    "claude-4-sonnet": anthropic("claude-4-sonnet-20250514"), // ✅ Correct - official model ID
  },
  google: {
    "gemini-2.5-flash": google("gemini-2.5-flash"), // ✅ Correct - Vertex AI confirmed
    "gemini-2.5-pro": google("gemini-2.5-pro"), // ✅ Correct - Vertex AI confirmed
  },
  xai: {
    "grok-4": xai("grok-4-0709"), // ✅ Correct - official xAI API endpoint
  },
};
```

### Phase 3: Production Hardening (15 minutes)

#### Enhanced Middleware for API Routes
**File**: `src/middleware.ts` - Improve API handling
```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Playwright health check
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // For API routes, return JSON error instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}
```

## 🎯 Implementation Blueprint

### Step-by-Step Task Sequence

1. **Authentication Environment Fix**
   - Add `BETTER_AUTH_URL` to Vercel environment variables
   - Update `src/lib/auth/server.ts` to use `BASE_URL` constant
   - Test authentication flow locally and in production

2. **Client Error Handling Enhancement**
   - Replace fetcher function in `src/lib/utils.ts` with HTML-aware version
   - Test API error responses handle both JSON and HTML appropriately
   - Validate user experience for authentication failures

3. **Middleware API Route Improvement**
   - Update middleware to return JSON for API routes vs HTML redirects for pages
   - Ensure consistent error response format across all API endpoints
   - Test both authenticated and unauthenticated API access

4. **Model Configuration Validation**
   - Test individual model providers with simple generation calls
   - Verify all 5 flagship models respond correctly
   - Add model validation utility for future monitoring

5. **Integration Testing**
   - End-to-end authentication flow testing
   - Canvas, MCP, and Agent integration verification
   - Observability trace validation in Langfuse dashboard

## 📊 Validation Gates

### Authentication Validation
```bash
# Test authentication endpoints directly
curl -v https://samba-orion.vercel.app/api/thread
# Expected: JSON 401 response, not HTML redirect

curl -v https://samba-orion.vercel.app/api/auth/session
# Expected: Valid session response after authentication
```

### Model Validation
```bash
# Local testing environment
pnpm dev
# Test each model via chat interface:
# 1. OpenAI GPT-5
# 2. Anthropic Claude 4 Sonnet
# 3. Google Gemini 2.5 Flash/Pro
# 4. XAI Grok 4
```

### System Health Validation
```bash
# Project health checks (Better-Chatbot specific)
pnpm check-types          # TypeScript validation
pnpm lint                 # Biome linting
pnpm test                 # Vitest unit tests
pnpm build:local          # Local build validation

# Observability validation
curl -f http://localhost:3000/api/health/langfuse  # Langfuse connectivity
```

### Canvas/MCP Integration Validation
```bash
# Canvas system validation (post-deployment)
# Navigate to chat interface
# Test chart tool execution -> Canvas automatic opening
# Verify "Open Canvas" buttons appear in tool results
# Test MCP tool execution with authentication fixes
```

## 🌐 Technology References (For AI Agent Context)

### Official Documentation URLs
- **Better-Auth Documentation**: https://www.better-auth.com/docs/installation
- **Better-Auth Next.js Integration**: https://www.better-auth.com/docs/integrations/next
- **Vercel AI SDK v5 Reference**: https://ai-sdk.dev/docs/introduction
- **AI SDK streamText**: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- **AI SDK Telemetry**: https://ai-sdk.dev/docs/ai-sdk-core/telemetry
- **OpenAI GPT-5 API**: https://platform.openai.com/docs/models/gpt-5
- **Anthropic Claude 4**: https://docs.claude.com/en/docs/about-claude/models/overview
- **Google Gemini 2.5**: https://ai.google.dev/gemini-api/docs/models
- **XAI Grok 4**: https://docs.x.ai/docs/models/grok-4-0709

### Implementation Examples From Codebase
- **Authentication Pattern**: `src/lib/auth/server.ts` - Better-Auth configuration with database adapter
- **Base URL Logic**: `src/lib/const.ts:18-31` - Environment-aware URL construction
- **Fetcher Pattern**: `src/lib/utils.ts:9-31` - Current fetch utility requiring enhancement
- **Model Provider Pattern**: `src/lib/ai/models.ts:14-35` - Vercel AI SDK model configuration
- **Middleware Pattern**: `src/middleware.ts` - Next.js middleware for route protection
- **Vercel AI SDK Usage**: `src/app/api/chat/route.ts` - streamText with experimental_telemetry

### Better-Chatbot Specific Patterns
- **Canvas Integration**: All chart tools auto-open Canvas with `shouldCreateArtifact: true`
- **MCP Tool Loading**: `src/app/api/chat/shared.chat.ts` - Dynamic MCP tool loading as Vercel AI SDK tools
- **Observability**: Langfuse SDK v4 with OpenTelemetry automatic tracing via `experimental_telemetry`
- **Database**: Drizzle ORM with PostgreSQL - session storage via `SessionSchema`

## ⚠️ Risk Assessment & Mitigation

### High Risk: Authentication System Changes
- **Risk**: Breaking existing user sessions during environment variable updates
- **Mitigation**: Environment variable addition is additive - existing sessions preserved
- **Rollback**: Immediate environment variable removal if issues occur

### Medium Risk: Client Error Handling Changes
- **Risk**: Fetcher function changes affecting other API consumers
- **Mitigation**: Enhanced error handling is backward compatible - maintains existing error structure
- **Testing**: Comprehensive API endpoint testing before deployment

### Low Risk: Model Configuration
- **Risk**: Model endpoint changes causing generation failures
- **Mitigation**: Model configurations verified against official API documentation
- **Validation**: Individual model testing before full deployment

## 🎯 Expected Outcomes

### Primary Success Metrics
- [ ] **Authentication Success Rate**: 100% successful sign-ins without 401 errors
- [ ] **API Response Consistency**: All API endpoints return proper JSON (no HTML parsing errors)
- [ ] **Model Availability**: All 5 flagship models working correctly in chat interface
- [ ] **Session Persistence**: Users remain authenticated across page navigation

### Integration Success Metrics
- [ ] **Canvas Integration**: Chart tools work seamlessly with all model providers
- [ ] **MCP Integration**: Tool execution unaffected by authentication fixes
- [ ] **Observability**: Langfuse traces capture authentication events and model usage
- [ ] **User Experience**: Zero visible error states in production interface

## 📈 Implementation Confidence Assessment

### High Confidence Elements (9-10/10)
- **Root Cause Identification**: Clear evidence of environment variable mismatch
- **GPT-5 Availability**: Confirmed production-ready since August 2025
- **Solution Specificity**: Exact code changes identified with line numbers
- **Better-Auth Patterns**: Research confirms proper baseURL configuration approach

### Medium Confidence Elements (8-9/10)
- **Model Provider Endpoints**: API documentation confirms all model names correct
- **Client Error Handling**: Enhanced fetcher maintains backward compatibility
- **Production Environment**: Vercel-specific environment variables well documented

### Validation Required Elements (7-8/10)
- **Cross-System Integration**: Canvas, MCP, Agent interaction with authentication changes
- **Session Management**: Database session storage stability across environment updates
- **Observability Integration**: Langfuse trace completeness with authentication events

**Overall Implementation Confidence: 9.5/10**

The combination of clear root cause identification, specific code fixes, comprehensive research validation, and established Better-Chatbot patterns provides extremely high confidence in one-pass implementation success.

## 🚀 Deployment Strategy

### Immediate Actions (5 minutes)
1. Add `BETTER_AUTH_URL=https://samba-orion.vercel.app` to Vercel environment
2. Deploy authentication fix: `baseURL: BASE_URL` in auth server configuration
3. Test authentication flow immediately after deployment

### Code Enhancement (10 minutes)
1. Deploy enhanced fetcher function with HTML/JSON response handling
2. Update middleware for proper API vs page route handling
3. Validate error responses return appropriate format

### Model Verification (15 minutes)
1. Test each model provider individually via chat interface
2. Verify Langfuse traces capture model interactions correctly
3. Confirm Canvas integration works with all providers

### System Integration Validation (10 minutes)
1. End-to-end user journey testing
2. MCP tool execution verification
3. Agent management interface validation
4. Production health check confirmation

**Total Implementation Time: ~40 minutes**

This PRP provides comprehensive context, specific implementation steps, and validation criteria necessary for successful one-pass implementation of the authentication bug fix and model configuration verification.