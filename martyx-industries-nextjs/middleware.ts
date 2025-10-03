import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { hostname } = request.nextUrl;

  // Redirect from www to apex domain
  if (hostname.startsWith('www.')) {
    const newHostname = hostname.slice(4);
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = newHostname;

    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://martyx-industries.fra1.cdn.digitaloceanspaces.com https://fra1.digitaloceanspaces.com",
      "font-src 'self' data:",
      "connect-src 'self' https://martyx-industries-be-2xf3x.ondigitalocean.app",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}