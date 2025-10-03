import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { hostname, pathname, search } = request.nextUrl;

  // Check if the hostname starts with 'www.'
  if (hostname.startsWith('www.')) {
    // Extract the domain without 'www.'
    const newHostname = hostname.slice(4);

    // Create the redirect URL to the apex domain
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = newHostname;

    // Return a permanent redirect (301)
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Continue with the request if no redirect is needed
  return NextResponse.next();
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