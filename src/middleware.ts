import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  const isAdminSubdomain = host.startsWith('admin.');
  const isAdminPath = pathname.startsWith('/admin');

  // Skip static assets, internal Next.js requests, favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Handle Admin Subdomain rewrite: if visiting admin.multitech.xxx/dashboard -> /admin/dashboard
  if (isAdminSubdomain && !isAdminPath) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '/dashboard' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Admin authentication guard
  if (isAdminPath) {
    const isLoginPage = pathname === '/admin/login';
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = token ? await verifyAdminSessionToken(token) : null;

    if (!session && !isLoginPage) {
      // Redirect to login if unauthenticated
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session && isLoginPage) {
      // If already logged in, redirect away from login page to admin dashboard
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
