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

  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        await fetch('/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, session }),
        })
      } catch {}

      const isElectron = params.get('mode') === 'electron';
      if (isElectron && event === 'SIGNED_IN' && session) {
        try {
          // Prefer device-code exchange (safer, avoids rotation race)
          let code: string | null = null;
          try {
            const res = await fetch('/api/device-auth/create', { method: 'POST' });
            if (res.ok) {
              const json = await res.json().catch(() => ({}));
              code = json?.code || null;
            }
          } catch {}

          if (code) {
            setDeviceCode(code);
            setDeepLink(`pickleglass://supabase-auth?code=${encodeURIComponent(code)}`);
          } else if (session.access_token && session.refresh_token) {
            // Fallback for older Electron builds
            setDeepLink(`pickleglass://supabase-auth?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`);
          }
          setLinkReady(true);
        } catch {}
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password, confirm: mode === "signup" ? confirm : undefined });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
          });
          if (error) throw new Error(mapAuthError(error.message));
        } else {
          const { error } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
          });
          if (error) throw new Error(mapAuthError(error.message));
        }

        const requested = params.get("redirect") || "/dashboard";
        const redirect = requested.startsWith('/') ? requested : '/dashboard';
        router.replace(redirect);
      } catch (err: any) {
        setError(typeof err?.message === "string" ? err.message : "Authentication failed");
      }
    });
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
                  <Button type="button" className="w-full" onClick={() => { window.location.href = deepLink! }}>
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
