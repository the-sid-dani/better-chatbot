import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    try {
      const session = await getEnhancedSession();

      if (!session) {
        // Redirect to sign-in if no session
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      if (session.user.role !== 'admin') {
        // Redirect to unauthorized page if not admin
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    } catch (error) {
      // On error, redirect to sign-in
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Continue with the request if not an admin route or if admin access is authorized
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match admin routes
    '/admin/:path*',
    // Exclude static files and API routes that don't need protection
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};