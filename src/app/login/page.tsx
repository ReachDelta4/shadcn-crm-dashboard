"use client";

import { useState, useTransition, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

const schema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must include uppercase")
      .regex(/[a-z]/, "Must include lowercase")
      .regex(/\d/, "Must include a number"),
    confirm: z.string().optional(),
  })
  .refine((d) => !d.confirm || d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [linkReady, setLinkReady] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [redirectInProgress, setRedirectInProgress] = useState(false);

  const supabase = createClient();

  // Enterprise-grade redirect helper with comprehensive validation and error handling
  const performSecureRedirect = async (redirectReason: 'initial_check' | 'post_login' | 'continue_action') => {
    if (redirectInProgress) {
      console.log('[Auth] Redirect already in progress, skipping duplicate');
      return;
    }

    const isElectron = params.get('mode') === 'electron';
    if (isElectron) {
      console.log('[Auth] Electron mode detected, skipping web redirect');
      return;
    }

    try {
      setRedirectInProgress(true);
      
      // Get redirect target with robust validation
      const requested = params.get("redirect") || "/dashboard";
      let redirect = "/dashboard"; // Safe default
      
      // Validate redirect URL to prevent open redirect vulnerabilities
      if (requested.startsWith('/') && !requested.startsWith('//')) {
        // Allow relative paths only (not protocol-relative URLs)
        redirect = requested;
      } else if (requested === "/dashboard") {
        redirect = requested;
      }
      // Invalid redirects fall back to /dashboard

      console.log(`[Auth] Performing secure redirect (${redirectReason}): ${redirect}`);
      
      // Use replace to prevent back button issues
      router.replace(redirect);
    } catch (error) {
      console.error(`[Auth] Redirect failed (${redirectReason}):`, error);
      // Fallback to dashboard on any redirect error
      try {
        router.replace("/dashboard");
      } catch (fallbackError) {
        console.error('[Auth] Fallback redirect also failed:', fallbackError);
        // Last resort: reload page to reset state
        window.location.href = "/dashboard";
      }
    } finally {
      // Reset redirect flag after a delay to prevent permanent blocking
      setTimeout(() => setRedirectInProgress(false), 1000);
    }
  };

  // Enterprise-grade session synchronization helper
  const synchronizeSessionWithServer = async (session: any, event: string): Promise<boolean> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Auth] Syncing session with server (attempt ${attempt}/${MAX_RETRIES})`);
        
        const response = await fetch('/auth/callback', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // CSRF protection
          },
          body: JSON.stringify({ event, session }),
          credentials: 'same-origin' // Ensure cookies are included
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const result = await response.json().catch(() => ({}));
        console.log(`[Auth] Session sync successful (attempt ${attempt}):`, result);
        return true;

      } catch (error) {
        console.warn(`[Auth] Session sync attempt ${attempt} failed:`, error);
        
        if (attempt === MAX_RETRIES) {
          console.error('[Auth] All session sync attempts failed. Proceeding with caution.');
          return false;
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
    
    return false;
  };

  // Auto-redirect for already authenticated users (enterprise-grade initial check)
  useEffect(() => {
    let cancelled = false;
    
    const checkInitialAuthState = async () => {
      try {
        setIsCheckingAuth(true);
        
        // Get current user state
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (cancelled) return;
        
        if (error) {
          console.log('[Auth] Initial auth check - no valid session:', error.message);
          setIsCheckingAuth(false);
          return;
        }

        if (user) {
          console.log('[Auth] Initial auth check - user already authenticated:', user.email);
          
          const isElectron = params.get('mode') === 'electron';
          if (!isElectron) {
            // User is already authenticated, redirect to dashboard
            await performSecureRedirect('initial_check');
            return;
          }
        }
        
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('[Auth] Initial auth check failed:', error);
        if (!cancelled) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkInitialAuthState();
    
    return () => {
      cancelled = true;
    };
  }, [supabase, params, router]);

  // Enhanced auth state change handler with better error handling
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('[Auth] onAuthStateChange event:', event, 'hasSession:', !!session, 'userEmail:', session?.user?.email);
        
        // Always sync session with server for all auth events
        await synchronizeSessionWithServer(session, event);
        
      } catch (e) {
        console.warn('[Auth] Auth state change handler error:', (e as any)?.message);
      }

      const isElectron = params.get('mode') === 'electron';
      if (isElectron && event === 'SIGNED_IN' && session) {
        try {
          // Electron device linking flow (unchanged for backward compatibility)
          let code: string | null = null;
          try {
            console.log('[DeviceLink] requesting device code via /api/device-auth/create');
            const res = await fetch('/api/device-auth/create', { method: 'POST' });
            const text = await res.text();
            console.log('[DeviceLink] create status:', res.status, 'body:', text);
            if (res.ok) {
              const json = JSON.parse(text || '{}');
              code = json?.code || null;
            }
          } catch (err) {
            console.warn('[DeviceLink] create error:', (err as any)?.message);
          }

          if (code) {
            setDeviceCode(code);
            const dl = `pickleglass://supabase-auth?code=${encodeURIComponent(code)}`;
            setDeepLink(dl);
            console.log('[DeviceLink] device code ready:', code, 'deepLink:', dl);
          } else if (session.access_token && session.refresh_token) {
            // Fallback for older Electron builds
            const dl = `pickleglass://supabase-auth?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
            setDeepLink(dl);
            console.log('[DeviceLink] tokens ready (fallback); deepLink:', dl);
          }
          setLinkReady(true);
        } catch (err) {
          console.warn('[DeviceLink] setup error:', (err as any)?.message);
        }
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Input validation
    const parsed = schema.safeParse({ email, password, confirm: mode === "signup" ? confirm : undefined });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    const isElectron = params.get('mode') === 'electron';

    startTransition(async () => {
      try {
        console.log(`[Auth] Starting ${mode} for:`, email.toLowerCase().trim());
        
        // Perform authentication
        let authResult;
        if (mode === "login") {
          authResult = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
          });
        } else {
          authResult = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
          });
        }
        
        if (authResult.error) {
          throw new Error(mapAuthError(authResult.error.message));
        }

        console.log(`[Auth] ${mode} successful, session:`, !!authResult.data.session);

        // For Electron mode, let onAuthStateChange handle the device linking
        if (isElectron) {
          console.log('[Auth] Electron mode: deferring to onAuthStateChange for device linking');
          return;
        }

        // For web mode, ensure session is properly synchronized before redirect
        if (authResult.data.session) {
          console.log('[Auth] Web mode: synchronizing session before redirect');
          
          // Wait for session sync to complete for better reliability
          const syncSuccess = await synchronizeSessionWithServer(authResult.data.session, 'SIGNED_IN');
          
          if (syncSuccess) {
            console.log('[Auth] Session sync completed successfully, proceeding with redirect');
          } else {
            console.warn('[Auth] Session sync failed, proceeding with redirect anyway');
          }
          
          // Small delay to ensure server-side cookie setting completes
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await performSecureRedirect('post_login');
        } else {
          console.log('[Auth] No session returned, user may need to verify email');
          if (mode === "signup") {
            setError("Account created! Please check your email to verify your account before signing in.");
          }
        }

      } catch (err: any) {
        console.error(`[Auth] ${mode} failed:`, err);
        const errorMessage = typeof err?.message === "string" ? err.message : "Authentication failed";
        setError(errorMessage);
        
        // Clear any pending redirect state on error
        setRedirectInProgress(false);
      }
    });
  }

  function handleOpenInApp() {
    if (!deepLink) return;
    console.log('[DeviceLink] Clicking open in app with link:', deepLink);
    window.location.href = deepLink;
  }

  async function handleContinue() {
    console.log('[DeviceLink] Continue to dashboard requested');
    await performSecureRedirect('continue_action');
  }

  // Show loading state during initial auth check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
            )}
            {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (mode === "login" ? "Signing in…" : "Signing up…") : (mode === "login" ? "Sign In" : "Create Account")}
            </Button>
            {linkReady && (
              <div className="text-center space-y-2 pt-2">
                {deepLink && (
                  <Button type="button" className="w-full" onClick={handleOpenInApp}>
                    Open in app
                  </Button>
                )}
                {deviceCode && (
                  <div className="text-xs text-gray-700 p-2 border rounded bg-white">
                    <div className="font-semibold">Device code</div>
                    <div className="font-mono break-all select-all">{deviceCode}</div>
                  </div>
                )}
                <div className="text-xs text-gray-500">If nothing happens, copy the code and paste it in the desktop app’s Settings → Link device.</div>
                <div className="pt-1">
                  <Button type="button" variant="outline" className="w-full" onClick={handleContinue}>
                    Continue to dashboard
                  </Button>
                </div>
              </div>
            )}
            <div className="text-center text-sm">
              {mode === "login" ? (
                <button type="button" className="underline" onClick={() => setMode("signup")}>Create an account</button>
              ) : (
                <button type="button" className="underline" onClick={() => setMode("login")}>Have an account? Sign in</button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">Loading…</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function mapAuthError(message: string) {
  if (!message) return "Authentication failed";
  if (message.includes("Invalid login credentials")) return "Email or password is incorrect.";
  if (message.includes("Email not confirmed")) return "Please verify your email before signing in.";
  if (message.includes("User already registered")) return "An account with this email exists. Try signing in.";
  if (message.includes("Failed to fetch") || message.includes("504")) return "Network timeout contacting auth server. Try again.";
  return "Authentication failed";
}
