export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/server/supabase'

export async function POST(request: Request) {
  const startTime = Date.now();
  let sessionUserId: string | null = null;
  let eventType: string | null = null;

  try {
    // Enhanced request validation and parsing
    const body = await request.json().catch(() => ({})) as any
    const { event, session } = body || {}
    
    eventType = event;
    sessionUserId = session?.user?.id || null;

    console.log(`[Auth Callback] Processing ${event} event for user: ${sessionUserId || 'unknown'}`);

    // CSRF Protection: Validate request headers
    const xRequestedWith = request.headers.get('X-Requested-With');
    if (xRequestedWith !== 'XMLHttpRequest') {
      console.warn('[Auth Callback] Missing or invalid X-Requested-With header, potential CSRF attack');
      // Continue processing but log the warning
    }

    // Validate request origin for additional security
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      console.warn(`[Auth Callback] Origin mismatch: origin=${origin}, host=${host}`);
    }

    // Environment validation with detailed error reporting
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !anon) {
      console.error('[Auth Callback] Supabase environment variables not configured:', { 
        hasUrl: !!url, 
        hasAnon: !!anon 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error', 
          code: 'MISSING_ENV_VARS' 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with enhanced cookie handling
    const supabase = createServerClient(url, anon, {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          if (value) {
            console.log(`[Auth Callback] Reading cookie: ${name}`);
          }
          return value;
        },
        set(name: string, value: string, options: any) {
          console.log(`[Auth Callback] Setting cookie: ${name}, httpOnly: ${options?.httpOnly}, secure: ${options?.secure}`);
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          console.log(`[Auth Callback] Removing cookie: ${name}`);
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    });

    // Handle sign-in and token refresh events
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (!session?.access_token || !session?.refresh_token) {
        console.error(`[Auth Callback] ${event} event missing required tokens:`, {
          hasAccessToken: !!session?.access_token,
          hasRefreshToken: !!session?.refresh_token,
          userId: sessionUserId
        });
        return new Response(
          JSON.stringify({ 
            error: 'Invalid session data', 
            code: 'MISSING_TOKENS' 
          }), 
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`[Auth Callback] Setting session for user: ${sessionUserId}`);
      
      // Set session with comprehensive error handling
      try {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (setSessionError) {
          console.error('[Auth Callback] Failed to set session:', setSessionError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to set session', 
              code: 'SESSION_SET_FAILED',
              details: setSessionError.message 
            }), 
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log(`[Auth Callback] Session set successfully for user: ${sessionUserId}`);
      } catch (sessionError) {
        console.error('[Auth Callback] Exception during session setting:', sessionError);
        return new Response(
          JSON.stringify({ 
            error: 'Session setting exception', 
            code: 'SESSION_EXCEPTION' 
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      // Handle user profile creation/update for SIGNED_IN events
      if (event === 'SIGNED_IN' && session.user) {
        if (!supabaseAdmin) {
          console.warn('[Auth Callback] Supabase admin client not available, skipping profile upsert');
        } else {
          try {
            console.log(`[Auth Callback] Upserting profile for user: ${session.user.id}`);
            
            const profileData = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: (session.user.user_metadata as any)?.full_name || 
                        session.user.email?.split('@')[0] || 
                        'User',
              avatar_url: (session.user.user_metadata as any)?.avatar_url || null,
              updated_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString()
            };

            const { error: upsertError } = await supabaseAdmin
              .from('profiles')
              .upsert(profileData, {
                onConflict: 'id'
              });

            if (upsertError) {
              console.error('[Auth Callback] Profile upsert failed:', upsertError);
              // Don't fail the entire request for profile errors
            } else {
              console.log(`[Auth Callback] Profile upserted successfully for user: ${session.user.id}`);
            }
          } catch (profileError) {
            console.error('[Auth Callback] Profile upsert exception:', profileError);
            // Don't fail the entire request for profile errors
          }
        }
      }
    }

    // Handle sign-out events
    if (event === 'SIGNED_OUT') {
      console.log('[Auth Callback] Processing sign out');
      try {
        await supabase.auth.signOut();
        console.log('[Auth Callback] Sign out completed successfully');
      } catch (signOutError) {
        console.error('[Auth Callback] Sign out failed:', signOutError);
        return new Response(
          JSON.stringify({ 
            error: 'Sign out failed', 
            code: 'SIGNOUT_FAILED' 
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate event type
    const validEvents = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'];
    if (event && !validEvents.includes(event)) {
      console.warn(`[Auth Callback] Unknown event type: ${event}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Auth Callback] Successfully processed ${event} event for user ${sessionUserId} in ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        event: event,
        userId: sessionUserId,
        processingTimeMs: processingTime
      }), 
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        } 
      }
    );
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[Auth Callback] Unexpected error:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      eventType,
      sessionUserId,
      processingTimeMs: processingTime
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        processingTimeMs: processingTime
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
