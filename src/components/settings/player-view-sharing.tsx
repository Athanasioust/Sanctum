"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Monitor, RefreshCw, TriangleAlert, Wifi } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

type LanState = {
  enabled: boolean;
  addresses: string[];
  port: number;
  active: boolean;
};

/**
 * Local-network sharing for the player view: players open the read-only screen
 * on their own phones over the same Wi-Fi, with nothing leaving the LAN.
 *
 * Off by default and explicit about why — enabling it binds the whole app to
 * every network interface, not just `/screen`.
 */
export function PlayerViewSharing({ campaignId }: { campaignId: number }) {
  const [state, setState] = useState<LanState | null>(null);
  const [address, setAddress] = useState<string>("");
  // Keyed by the URL it encodes, so a stale code is never shown next to a new
  // address while the replacement renders.
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.get<LanState>("/api/lan");
        if (cancelled) return;
        setState(data);
        setAddress((current) =>
          current && data.addresses.includes(current) ? current : (data.addresses[0] ?? ""),
        );
      } catch {
        if (!cancelled) toast.error("Could not read network settings");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const url =
    address && state ? `http://${address}:${state.port}/screen/${campaignId}` : "";

  // Render the QR locally with the bundled library — no image service involved.
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    void (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
        if (!cancelled) setQr({ url, dataUrl });
      } catch {
        // Leave whatever was there; the address is shown as text regardless.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const qrSrc = qr && qr.url === url ? qr.dataUrl : null;

  async function toggle(enabled: boolean) {
    setSaving(true);
    try {
      await api.put("/api/lan", { enabled });
      setState((s) => (s ? { ...s, enabled } : s));
      toast.success(
        enabled
          ? "Sharing enabled — restart Sanctum to apply"
          : "Sharing disabled — restart Sanctum to apply",
      );
    } catch {
      toast.error("Could not save the setting");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the address");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Wifi className="size-4 text-primary" /> Play together on your Wi-Fi
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Let players open the read-only player view on their own phones. Everything
            stays on your local network — no account, no cloud, nothing uploaded.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <Switch
            checked={state?.enabled ?? false}
            onCheckedChange={toggle}
            disabled={!state || saving}
            aria-label="Share on the local network"
          />
          {state?.enabled ? "Sharing on" : "Sharing off"}
        </label>
      </div>

      {state?.enabled && !state.active && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <RefreshCw className="mt-0.5 size-4 shrink-0" />
          Restart Sanctum for this to take effect. On the first run your firewall will
          ask whether to allow it — say yes for private networks.
        </p>
      )}

      {state?.enabled && (
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          While this is on, anyone on the same network can reach Sanctum, not only the
          player view. Leave it off on public Wi-Fi.
        </p>
      )}

      {state && state.addresses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No local network address found — this machine may be offline or only on a
          virtual adapter.
        </p>
      ) : state ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt={`QR code for ${url}`}
                className={cn(
                  "size-40 rounded-lg bg-white p-2",
                  !state.enabled && "opacity-40 grayscale",
                )}
              />
            ) : (
              <div className="size-40 rounded-lg border border-dashed border-border" />
            )}
          </div>

          <div className="space-y-3">
            {state.addresses.length > 1 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">
                  Network address
                </p>
                <Select value={address} onValueChange={setAddress}>
                  <SelectTrigger className="w-full sm:max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {state.addresses.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  If one doesn&apos;t work, try another — virtual adapters show up here too.
                </p>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">
                Players open
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm">
                  {url || "—"}
                </code>
                <Button size="sm" variant="outline" onClick={copy} disabled={!url}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={`/screen/${campaignId}`} target="_blank" rel="noopener noreferrer">
                    <Monitor className="size-3.5" /> Open here
                  </a>
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Players scan the code (or type the address) and see live initiative, party
              status, revealed handouts and the battle map you&apos;re showing. The page is
              read-only — nothing they do can change your campaign.
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Checking the network…</p>
      )}
    </div>
  );
}
