import { NextResponse } from 'next/server';

// Public routes that do not require authentication
const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files like .svg, .png, .ico
  ) {
    return NextResponse.next();
  }

  // 2. Allow public endpoints
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // 3. Extract token from cookie or Authorization header
  const tokenFromCookie = request.cookies.get('nexis_token')?.value || request.cookies.get('erp_token')?.value;
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = tokenFromCookie || tokenFromHeader;

  // 4. If unauthenticated:
  if (!token) {
    // For API requests, return HTTP 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Access token missing.' },
        { status: 401 }
      );
    }

    // For page requests, redirect to /login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
