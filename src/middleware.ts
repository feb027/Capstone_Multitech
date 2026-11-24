import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  const isAdminSubdomain = host.startsWith('admin.');
  const isAdminPath = pathname.startsWith('/admin');

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/dataset')) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = token ? await verifyAdminSessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const effectiveAdminPath = isAdminSubdomain && !isAdminPath
    ? `/admin${pathname === '/' ? '/dashboard' : pathname}`
    : pathname;

  if (isAdminSubdomain || isAdminPath) {
    const isLoginPage = effectiveAdminPath === '/admin/login';
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = token ? await verifyAdminSessionToken(token) : null;

    if (!session && !isLoginPage) {
      const loginUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', req.url);
      loginUrl.searchParams.set('from', effectiveAdminPath);
      return NextResponse.redirect(loginUrl);
    }

    if (session && isLoginPage) {
      const targetPath = isAdminSubdomain ? '/dashboard' : '/admin/dashboard';
      return NextResponse.redirect(new URL(targetPath, req.url));
    }
  }

  if (isAdminSubdomain && !isAdminPath) {
    const url = req.nextUrl.clone();
    url.pathname = effectiveAdminPath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
