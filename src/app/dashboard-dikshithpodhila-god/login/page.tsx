"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PasswordField } from "@/components/ui/password-field";
import Particles from "@/components/Particles";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

function GodLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = params.get("redirect") || "/dashboard-dikshithpodhila-god/orgs";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        throw authError;
      }
      // Verify God access by calling the protected probe endpoint.
      const res = await fetch("/api/god/probe", { method: "GET" });
      if (!res.ok) {
        throw new Error("Authenticated but not authorized as God admin");
      }
      const data = await res.json().catch(() => null);
      if (!data?.isGod) {
        throw new Error("Authenticated but not authorized as God admin");
      }
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#02010A]">
      <div className="absolute inset-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
      <div className="relative z-[6] mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          <span>God Admin Login</span>
        </div>
        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" aria-hidden />
              Secure Access
            </CardTitle>
            <CardDescription>Sign in with God credentials to manage organizations and plans.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="god-email">Email</Label>
                <Input
                  id="god-email"
                  type="email"
                  placeholder="god@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <PasswordField
                id="god-password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              <Button type="submit" className={cn("w-full")} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              God access is enforced server-side. Ensure the account is flagged as god (env `GOD_USER_IDS` or `user_roles.role=&apos;god&apos;`)
              before using this panel.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GodLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <GodLoginContent />
    </Suspense>
  );
}
