import { NextRequest, NextResponse } from 'next/server';

// Helper function to decode JWT token payload
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Helper function to check if JWT token is expired
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

export function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // DISABLED: Admin route protection - handled by client-side RequireAdmin component
  // The middleware was interfering with localStorage-based auth
  // if (pathname.startsWith('/admin') && pathname !== '/admin') {
  //   // Get token from cookies or headers
  //   const token = request.cookies.get('token')?.value || 
  //                 request.headers.get('authorization')?.replace('Bearer ', '');
  //   
  //   // Get admin flag from cookies
  //   const adminAuthed = request.cookies.get('adminAuthed')?.value === 'true';
  //   
  //   // Check if user has valid admin access
  //   const hasValidToken = token && !isTokenExpired(token);
  //   const isAdminRoute = pathname.startsWith('/admin/');
  //   
  //   if (isAdminRoute && (!hasValidToken || !adminAuthed)) {
  //     // Redirect to admin login with return URL
  //     const loginUrl = new URL('/admin', request.url);
  //     loginUrl.searchParams.set('redirect', pathname);
  //     return NextResponse.redirect(loginUrl);
  //   }
  // }

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
      "default-src 'self' blob:",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:8080 https://martyx-industries-be-2xf3x.ondigitalocean.app https://mi-gallery.fra1.digitaloceanspaces.com https://fra1.digitaloceanspaces.com https://api.paypal.com https://api.sandbox.paypal.com https://www.sandbox.paypal.com wss: ws:",
      "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://www.youtube.com https://www.youtube-nocookie.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
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