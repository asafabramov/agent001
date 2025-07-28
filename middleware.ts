import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If Supabase is not configured, allow access but log warning
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured in middleware');
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get session with error handling
  let session = null;
  try {
    const {
      data: { session: authSession },
      error
    } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Middleware auth error:', error.message);
    } else {
      session = authSession;
    }
  } catch (error) {
    console.warn('Middleware session error:', error);
  }

  const { pathname } = req.nextUrl;

  console.log('Middleware - Path:', pathname, 'Session:', !!session);

  // Allow access to auth page and static assets
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json'
  ) {
    return response;
  }

  // Redirect to auth if no session and trying to access protected routes
  if (!session && pathname !== '/auth') {
    console.log('No session, redirecting to auth');
    const redirectUrl = new URL('/auth', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Don't redirect from auth page in middleware - let the component handle it
  // This prevents redirect loops

  return response;
}

export const config = {
  matcher: [
    // Skip API routes, static files, and specific assets
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};