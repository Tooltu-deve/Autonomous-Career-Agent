import { NextRequest, NextResponse } from 'next/server';

// Pages that require a valid session (all pages inside app/(app)/ group + onboarding)
const PROTECTED = [
  '/applications',
  '/dashboard',
  '/jobs',
  '/cv-tailoring',
  '/profile-setup',
  '/profile-preferences',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (!isProtected) return NextResponse.next();

  // We store session in sessionStorage (client-only), so we can't read it in
  // middleware directly. Instead we use a short-lived cookie that LoginForm sets.
  const session = request.cookies.get('careernav_session');
  if (!session?.value) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/signin';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/applications/:path*',
    '/dashboard/:path*',
    '/jobs/:path*',
    '/cv-tailoring/:path*',
    '/profile-setup/:path*',
    '/profile-preferences/:path*',
  ],
};
