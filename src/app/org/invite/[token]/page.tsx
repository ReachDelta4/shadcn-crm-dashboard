"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PageProps = {
  params: {
    token: string;
  };
};

type InviteStatus = "idle" | "submitting" | "success" | "error";

export default function OrgInviteAcceptPage({ params }: PageProps) {
  const router = useRouter();
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function acceptInvite() {
      setStatus("submitting");
      try {
        const res = await fetch("/api/org/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: params.token }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.accepted) {
          if (!cancelled) {
            setStatus("error");
            setMessage(
              data?.error ||
                "Unable to accept this invite. It may have expired or been revoked."
            );
          }
          return;
        }

        if (!cancelled) {
          setStatus("success");
          setMessage("Invite accepted. Redirecting to your dashboard...");
          setTimeout(() => {
            if (!cancelled) {
              router.push("/dashboard");
            }
          }, 1500);
        }
      } catch (error: any) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            error?.message ||
              "Unexpected error while accepting this invite. Please try again."
          );
        }
      }
    }

    acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [params.token, router]);

  const title =
    status === "success"
      ? "Invite accepted"
      : status === "error"
      ? "Invite could not be accepted"
      : "Accepting your invite";

  const helper =
    status === "success"
      ? "You are now a member of the organization."
      : status === "error"
      ? "You can close this tab and ask your admin to resend the invite if needed."
      : "Please wait while we confirm your membership.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">{helper}</p>
        <div className="text-sm text-foreground">
          {status === "submitting" && (
            <span>Link verified. Finalizing your access…</span>
          )}
          {status !== "submitting" && message && <span>{message}</span>}
        </div>
      </div>
    </main>
  );
}

