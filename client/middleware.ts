import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

// This middleware will handle authentication for your application
export default async function middleware(req: NextRequest) {
  // Get the user session from Auth0
  const res = NextResponse.next();
  const session = await getSession(req, res);
  
  // Add user info to request headers so it can be accessed in API routes
  if (session?.user) {
    // Clone the request headers
    const requestHeaders = new Headers(req.headers);
    
    // Add user information to headers
    requestHeaders.set('x-user-email', session.user.email || '');
    requestHeaders.set('x-user-name', session.user.name || '');
    requestHeaders.set('x-user-sub', session.user.sub || '');
    
    // Create a new response with the updated headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // If no user session, just continue without adding headers
  return res;
}

// Configure which paths require authentication
export const config = {
  // Protect API routes and app routes
  matcher: [
    // Apply middleware to all routes to pass user data when available
    '/(.*)',
  ],
};
