import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const config = {
  matcher: ['/dashboard/:path*'],
}

export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const pathname = req.nextUrl.pathname;
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  console.log(`[Auth Middleware] Checking access to ${pathname} for IP: ${ip}`);

  try {
    const url = req.nextUrl
    const response = NextResponse.next()
    
    // Environment validation with detailed logging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth Middleware] Supabase environment variables missing:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        pathname,
        ip
      });
      return redirectToLogin(req, pathname, 'MISSING_ENV_VARS');
    }

    // Create Supabase client with enhanced error handling
    let supabase;
    try {
      supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            const value = req.cookies.get(name)?.value;
            if (value && name.includes('supabase')) {
              console.log(`[Auth Middleware] Reading auth cookie: ${name.substring(0, 20)}...`);
            }
            return value;
          },
          set(name: string, value: string, options: any) {
            console.log(`[Auth Middleware] Setting cookie: ${name.substring(0, 20)}...`);
            response.cookies.set(name, value, options);
          },
          remove(name: string, options: any) {
            console.log(`[Auth Middleware] Removing cookie: ${name.substring(0, 20)}...`);
            response.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      });
    } catch (clientError) {
      console.error('[Auth Middleware] Failed to create Supabase client:', clientError);
      return redirectToLogin(req, pathname, 'CLIENT_CREATION_FAILED');
    }

    // Get user with comprehensive error handling and retry logic
    let user = null;
    let authError = null;
    
    const MAX_AUTH_RETRIES = 2;
    for (let attempt = 1; attempt <= MAX_AUTH_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.auth.getUser();
        user = data?.user || null;
        authError = error;
        
        if (user) {
          console.log(`[Auth Middleware] User authenticated successfully (attempt ${attempt}):`, {
            userId: user.id,
            email: user.email,
            pathname,
            processingTimeMs: Date.now() - startTime
          });
          break;
        }
        
        if (error) {
          console.warn(`[Auth Middleware] Auth check attempt ${attempt} failed:`, {
            error: error.message,
            pathname,
            ip,
            attempt
          });
          
          // Don't retry for certain error types
          if (error.message.includes('invalid') || error.message.includes('expired')) {
            break;
          }
        }
        
        // Small delay before retry
        if (attempt < MAX_AUTH_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (exception) {
        console.error(`[Auth Middleware] Auth check exception (attempt ${attempt}):`, {
          error: exception,
          pathname,
          ip
        });
        authError = exception;
        break;
      }
    }
    
    // Handle authentication failure
    if (authError || !user) {
      const processingTime = Date.now() - startTime;
      console.log(`[Auth Middleware] Access denied to ${pathname}:`, {
        hasUser: !!user,
        error: authError?.message || 'No user session',
        ip,
        userAgent: userAgent.substring(0, 100),
        processingTimeMs: processingTime
      });
      
      return redirectToLogin(req, pathname, authError?.message || 'NO_SESSION');
    }

    // Log successful authentication
    const processingTime = Date.now() - startTime;
    console.log(`[Auth Middleware] Access granted to ${pathname}:`, {
      userId: user.id,
      email: user.email,
      ip,
      processingTimeMs: processingTime
    });

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[Auth Middleware] Unexpected error:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      pathname,
      ip,
      processingTimeMs: processingTime
    });
    
    // On unexpected errors, redirect to login as a safety measure
    return redirectToLogin(req, pathname, 'MIDDLEWARE_ERROR');
  }
}

function redirectToLogin(req: NextRequest, pathname: string, reason?: string) {
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('redirect', pathname);
  
  if (reason) {
    console.log(`[Auth Middleware] Redirecting to login:`, {
      from: pathname,
      reason,
      ip: req.ip || 'unknown'
    });
  }
  
  const response = NextResponse.redirect(loginUrl);
  
  // Add cache control headers to prevent caching of redirects
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  
  return response;
}
