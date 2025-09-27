# src/lib/auth/ - Authentication System

Better-Auth 1.3.7 implementation with OAuth providers and session-based authentication.

## Files

**Core Components:**
- `config.ts` - Authentication configuration with OAuth providers (GitHub, Google, Microsoft)
- `server.ts` - Server-side session management and user validation
- `client.ts` - Client-side React hooks and utilities

## Usage Patterns

**Server-Side Session Validation:**
```typescript
import { getSession } from "auth/server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ user: session.user });
}
```

**Client-Side Authentication:**
```typescript
import { useSession } from "auth/client";

export function UserProfile() {
  const { user, loading } = useSession();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  return <div>Welcome, {user.name}!</div>;
}
```

**Environment Requirements:**
```bash
GITHUB_CLIENT_ID=****
GITHUB_CLIENT_SECRET=****
GOOGLE_CLIENT_ID=****
GOOGLE_CLIENT_SECRET=****
MICROSOFT_CLIENT_ID=****
MICROSOFT_CLIENT_SECRET=****
```