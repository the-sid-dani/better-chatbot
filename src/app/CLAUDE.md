# src/app/ - Next.js App Router

Next.js 15 App Router structure with authentication, chat interface, and API endpoints.

## Structure
- `(auth)/` - Sign-in/sign-up pages with Better-Auth
- `(chat)/` - Main chat interface with Canvas integration
- `api/` - Backend API routes (chat, auth, agents, MCP, workflows)
- `store/` - Zustand state management with persistence

## Key Files

**Chat System:**
- `api/chat/route.ts` - Main chat endpoint with Vercel AI SDK streaming
- `api/chat/shared.chat.ts` - Tool loading pipeline (MCP, agents, workflows)

**Authentication:**
- `(auth)/sign-in/page.tsx` - OAuth + email/password sign-in
- `api/auth/[...all]/route.ts` - Better-Auth handler

**Core Pages:**
- `(chat)/chat/[thread]/page.tsx` - Dynamic chat interface
- `(chat)/agents/page.tsx` - Agent management
- `(chat)/mcp/` - MCP server configuration pages

**State Management:**
- `store/index.ts` - Main Zustand store with persistence

## Notes

**Route Groups:** Use `(auth)` and `(chat)` for logical organization without affecting URLs

**API Routes:** Must export named HTTP methods (GET, POST, etc.) and validate sessions

**Critical:** Never modify `api/auth/[...all]/route.ts` - it's the Better-Auth handler