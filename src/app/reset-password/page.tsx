"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { createClient } from "@/utils/supabase/client";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must include uppercase")
      .regex(/[a-z]/, "Must include lowercase")
      .regex(/\d/, "Must include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "ready" | "expired" | "success">(
    "checking",
  );
  const [pending, startTransition] = useTransition();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user || cancelled) {
          setStatus("expired");
          return;
        }
        setUserEmail(data.user.email || null);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("expired");
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid password");
      return;
    }

    startTransition(async () => {
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          password: parsed.data.password,
        });
        if (updateError) {
          setError(updateError.message || "Failed to update password");
          return;
        }
        setStatus("success");
      } catch (err: any) {
        setError(err?.message || "Failed to update password");
      }
    });
  }

  function handleBackToLogin() {
    const url = new URL("/login", window.location.origin);
    if (userEmail) url.searchParams.set("email", userEmail);
    router.replace(url.toString());
  }

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Verifying reset link…</div>
      </main>
    );
  }

  if (status === "expired") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset link expired</CardTitle>
            <CardDescription>
              For security reasons, reset links expire after a short time. You can request a
              new reset email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => router.replace("/forgot-password")}
            >
              Request new reset link
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password updated</CardTitle>
            <CardDescription>
              Your password has been updated. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" className="w-full" onClick={handleBackToLogin}>
              Continue to sign in
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
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password for your Salesy CRM account. You&apos;ll use this to sign
            in from now on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              id="password"
              label="New password"
              value={password}
              onChange={setPassword}
              placeholder="Enter a new password"
              autoComplete="new-password"
              required
            />
            <PasswordField
              id="confirm"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
            />
            {error && (
              <div className="text-sm text-red-600" role="alert">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

