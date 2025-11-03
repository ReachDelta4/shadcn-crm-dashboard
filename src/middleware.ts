import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const response = NextResponse.next()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase env vars missing in middleware')
    return redirectToLogin(req, url.pathname)
  }

  const isApi = url.pathname.startsWith('/api')
  const allowlistApi = new Set<string>([
    '/api/device-auth/create',
    '/api/device-auth/exchange',
  ])
  const isAllowlisted = isApi && allowlistApi.has(url.pathname)

  // Fast-path: if no auth cookies at all, avoid calling Supabase (except allowlisted API)
  const hasSupabaseSessionCookie = req.cookies.getAll().some(c => c.name.startsWith('sb-'))
  if (!hasSupabaseSessionCookie && !isAllowlisted) {
    return isApi ? unauthenticatedResponse() : redirectToLogin(req, url.pathname)
  }

  try {
    // Fast path for non-API routes: if a Supabase session cookie exists, avoid network auth call.
    if (!isApi) {
      return response
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser()
    if ((error || !user) && !isAllowlisted) {
      return unauthenticatedResponse()
    }

    return response
  } catch (error) {
    console.error('Middleware auth check failed:', error)
    return isApi ? unauthenticatedResponse() : redirectToLogin(req, url.pathname)
  }
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

function unauthenticatedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
