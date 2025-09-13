"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

export default function LinkDevicePage() {
  const supabase = createClient();
  const [status, setStatus] = React.useState<string>("");
  const [code, setCode] = React.useState<string>("");
  const [deepLink, setDeepLink] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);

  const log = (msg: string, extra?: any) => {
    const line = `[LinkDevice] ${msg}${extra !== undefined ? ` ${JSON.stringify(extra)}` : ""}`;
    console.log(line);
    setStatus((s) => (s ? s + "\n" + line : line));
  };

  const ensureSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    return user;
  };

  const generateCode = async () => {
    try {
      setBusy(true);
      setStatus("");
      await ensureSignedIn();
      log("POST /api/device-auth/create start");
      const res = await fetch('/api/device-auth/create', { method: 'POST' });
      const text = await res.text();
      log(`create status ${res.status}`, { body: text });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const json = JSON.parse(text || '{}');
      const c = json?.code || '';
      if (!c) throw new Error('No code returned');
      setCode(c);
      const dl = `pickleglass://supabase-auth?code=${encodeURIComponent(c)}`;
      setDeepLink(dl);
      log('Device code ready', { code: c, deepLink: dl });
    } catch (e: any) {
      log('Error', { message: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const openInApp = () => {
    if (!deepLink) return;
    log('Opening deep link', { deepLink });
    window.location.href = deepLink;
  };

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Link Device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Generate a short-lived code to link your desktop app. If the app doesn't open automatically,
            copy the code and paste it in Settings → Link device.
          </p>
          <div className="flex gap-2">
            <Button onClick={generateCode} disabled={busy}>Generate Code</Button>
            {deepLink ? (
              <Button variant="outline" onClick={openInApp}>Open in App</Button>
            ) : null}
          </div>
          {code ? (
            <div className="text-xs text-gray-700 p-2 border rounded bg-white">
              <div className="font-semibold">Device code</div>
              <div className="font-mono break-all select-all">{code}</div>
            </div>
          ) : null}
          {status ? (
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 border rounded max-h-60 overflow-auto">{status}</pre>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
