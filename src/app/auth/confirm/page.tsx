"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

function ConfirmEmailPageContent() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();

  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function syncSessionFromUrl() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session || cancelled) {
          setStatus("error");
          return;
        }

        try {
          await fetch("/auth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "SIGNED_IN", session }),
          });
        } catch (e) {
          console.warn(
            "[ConfirmEmail] failed to sync session via /auth/callback:",
            (e as any)?.message,
          );
        }

        const { data: userData } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!userData.user) {
          setStatus("error");
          return;
        }

        setEmail(userData.user.email || null);
        setStatus("ok");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    syncSessionFromUrl();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function handleGoToDashboard() {
    startTransition(() => {
      const redirect = params.get("redirect") || "/dashboard";
      router.replace(redirect);
    });
  }

  function handleResend() {
    router.replace("/verify-email" + (email ? `?email=${encodeURIComponent(email)}` : ""));
  }

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Confirming your email…</div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link expired or invalid</CardTitle>
            <CardDescription>
              This confirmation link is no longer valid. We can send you a new confirmation
              email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" className="w-full" onClick={handleResend}>
              Send me a new confirmation email
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email confirmed</CardTitle>
          <CardDescription>
            Your email is confirmed. You can now use Salesy CRM on the web and desktop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <p className="text-sm">
              Signed in as <span className="font-medium">{email}</span>.
            </p>
          )}
          <Button type="button" className="w-full" disabled={pending} onClick={handleGoToDashboard}>
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-sm text-muted-foreground">Confirming your email…</div>
        </main>
      }
    >
      <ConfirmEmailPageContent />
    </Suspense>
  );
}

