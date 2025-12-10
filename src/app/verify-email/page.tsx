"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

function VerifyEmailPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState(params.get("email") || "");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user || cancelled) return;
        if (!email && data.user.email) {
          setEmail(data.user.email);
        }
      } catch {
        // best-effort only; we fall back to email query param
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [supabase, email]);

  function handleUseDifferentEmail() {
    router.replace("/login?mode=signup");
  }

  async function handleIConfirmed() {
    startTransition(async () => {
      setError(null);
      setStatusMessage(null);
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user && data.user.email_confirmed_at) {
          router.replace("/dashboard");
          return;
        }
        setStatusMessage(
          "We still can’t detect a confirmed email. Make sure you clicked the link in your inbox, then try again.",
        );
      } catch {
        setError("We couldn’t verify your email status. Please try again in a moment.");
      }
    });
  }

  async function handleResend() {
    startTransition(async () => {
      setError(null);
      setStatusMessage(null);
      const targetEmail = email.trim().toLowerCase();
      if (!targetEmail) {
        setError("Enter your email on the sign up page so we can send a confirmation link.");
        return;
      }
      try {
        const anyAuth: any = supabase.auth;
        if (typeof anyAuth.resend === "function") {
          await anyAuth.resend({ type: "signup", email: targetEmail });
        }
        setStatusMessage(
          `If an account exists for ${targetEmail}, we’ve sent a new confirmation email.`,
        );
      } catch (err: any) {
        const message = String(err?.message || "");
        if (/too many/i.test(message) || /rate/i.test(message)) {
          setError(
            "We recently sent a confirmation email. Please wait a few minutes before trying again.",
          );
        } else {
          setError("We couldn’t resend the confirmation email. Please try again in a moment.");
        }
      }
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirm your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to your email. Click the link in your inbox to
            activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <p className="text-sm">
              We&apos;re using <span className="font-medium">{email}</span> for your account.
            </p>
          )}
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
            <li>Check your spam or promotions folder.</li>
            <li>Search for emails from &quot;Salesy&quot; or &quot;no-reply&quot;.</li>
            <li>It can take a few minutes for the email to arrive.</li>
          </ul>
          {statusMessage && (
            <div className="text-xs text-gray-700" role="status">
              {statusMessage}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600" role="alert">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Button type="button" className="w-full" disabled={pending} onClick={handleIConfirmed}>
              I’ve confirmed my email
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={handleResend}
            >
              Resend confirmation email
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs"
              onClick={handleUseDifferentEmail}
            >
              Use a different email
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </main>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}

