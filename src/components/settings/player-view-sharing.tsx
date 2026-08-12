"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Monitor,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  TriangleAlert,
  Wifi,
} from "lucide-react";
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

type FirewallState = "allowed" | "unknown" | "unsupported";

type LanState = {
  enabled: boolean;
  addresses: string[];
  port: number;
  /** The running server is bound to the network, not just to loopback. */
  active: boolean;
  firewall: FirewallState;
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
  const [allowing, setAllowing] = useState(false);

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

  // Only offered once the server is really listening on the network. Handing
  // out a QR code that cannot resolve is what made this look broken: the phone
  // spins on a blank page and then says the site can't be reached.
  const reachable = state?.active === true;
  const url =
    reachable && address && state
      ? `http://${address}:${state.port}/screen/${campaignId}`
      : "";

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

  async function allowThroughFirewall() {
    setAllowing(true);
    try {
      // Windows shows a UAC prompt here, so this can sit for a while.
      const { firewall } = await api.post<{ firewall: FirewallState }>("/api/lan/firewall");
      setState((s) => (s ? { ...s, firewall } : s));
      if (firewall === "allowed") toast.success("Sanctum is allowed through the firewall");
      else toast.error("The firewall rule was not added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the firewall");
    } finally {
      setAllowing(false);
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
          Restart Sanctum to finish turning this on — until then the player view is
          only reachable on this computer.
        </p>
      )}

      {/* Only reachable here: a `next dev`/`next start` server listens on every
          interface of its own accord, so players can connect with the switch
          still off. The packaged app binds loopback until it is turned on. */}
      {state && !state.enabled && state.active && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Wifi className="mt-0.5 size-4 shrink-0" />
          This server is already listening on your network, so the link below works
          even with the switch off.
        </p>
      )}

      {state && !state.enabled && !state.active && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          Sharing is off, so Sanctum only answers on this computer. Turn it on above
          (then restart) to get a link and QR code for your players.
        </p>
      )}

      {/* Reachable on the network, but Windows drops inbound connections until
          the firewall is told otherwise, and it drops them silently. */}
      {reachable && state?.firewall === "unknown" && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            Phones stuck on a blank page, or told the site can&apos;t be reached? That
            is Windows Firewall dropping the connection, not the player view. Windows
            asks once, the first time Sanctum starts sharing — if that prompt was
            dismissed it never comes back.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={allowThroughFirewall}
            disabled={allowing}
          >
            <ShieldCheck className="size-3.5" />
            {allowing ? "Waiting for Windows…" : "Allow through Windows Firewall"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Windows will ask for permission. The rule covers private and work networks
            only, never public Wi-Fi.
          </p>
        </div>
      )}

      {reachable && state?.firewall === "allowed" && (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          Allowed through Windows Firewall on private networks.
        </p>
      )}

      {state?.enabled && (
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          While this is on, anyone on the same network can reach Sanctum, not only the
          player view. Leave it off on public Wi-Fi.
        </p>
      )}

      {!state ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking the network…</p>
      ) : !reachable ? null : state.addresses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No local network address found — this machine may be offline or only on a
          virtual adapter.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt={`QR code for ${url}`} className="size-40 rounded-lg bg-white p-2" />
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
      )}

      {/* The DM's own screen works whether or not sharing is on. */}
      {!reachable && (
        <div className="mt-4">
          <Button size="sm" variant="ghost" asChild>
            <a href={`/screen/${campaignId}`} target="_blank" rel="noopener noreferrer">
              <Monitor className="size-3.5" /> Open the player view here
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
