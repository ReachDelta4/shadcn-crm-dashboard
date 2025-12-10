"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

function ForgotPasswordPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const supabase = createClient();

  function handleBackToLogin() {
    const url = new URL("/login", window.location.origin);
    if (email) url.searchParams.set("email", email);
    router.replace(url.toString());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    const parsed = schema.safeParse({ email: trimmed });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid email");
      return;
    }

    startTransition(async () => {
      try {
        await supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setSent(true);
      } catch (err: any) {
        const message = String(err?.message || "");
        if (/too many/i.test(message) || /rate/i.test(message)) {
          setError(
            "We recently sent a reset email. Please wait a few minutes before trying again.",
          );
        } else {
          setError("We couldn't send a reset email. Please try again in a moment.");
        }
      }
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter the email you use with Salesy. If an account exists, we&apos;ll email you
            a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-sm">
              <p>
                If there&apos;s an account for <span className="font-medium">{email}</span>,
                we&apos;ve sent a link to reset your password.
              </p>
              <p className="text-muted-foreground">
                It may take a few minutes to arrive. Check your spam or promotions folder
                if you don&apos;t see it.
              </p>
              <div className="flex gap-2">
                <Button type="button" className="w-full" onClick={handleBackToLogin}>
                  Back to sign in
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600" role="alert">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Sending…" : "Send reset link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
              >
                Back to sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </main>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}

