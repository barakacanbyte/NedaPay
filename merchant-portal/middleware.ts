import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require wallet connection
const PROTECTED_ROUTES = [
  '/dashboard',
  '/payments',
  '/stablecoins',
  '/settings'
];

export function middleware(request: NextRequest) {
  // Check if the requested path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Since we can't access localStorage directly in middleware,
    // we'll create a special cookie when the wallet connects
    // and check for that cookie here
    const walletConnected = request.cookies.get('wallet_connected');
    
    // If wallet is not connected, redirect to home page
    if (!walletConnected) {
      const url = new URL('/', request.url);
      url.searchParams.set('walletRequired', 'true');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/payments/:path*',
    '/stablecoins/:path*',
    '/settings/:path*',
  ],
};
