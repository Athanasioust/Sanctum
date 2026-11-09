/**
 * The local-network guard: which requests from *other devices* Sanctum answers.
 *
 * With sharing on, the server binds every interface so phones can open the
 * player view. Without this guard that would also hand every DM endpoint
 * (`/api/battle-maps`, `/api/npcs`, the campaign pages…) to anyone on the
 * Wi-Fi. The rules:
 *
 *   - From this machine (loopback): everything, no token — the DM's app.
 *   - From another device, sharing off: nothing.
 *   - From another device, sharing on:
 *       · app code and public assets (`/_next/static/*`, icons, `/leaflet/*`),
 *         which carry no campaign data, without a token;
 *       · the player view (`/screen/*`, `/api/screen/*`) and the images it
 *         points at (`/uploads/*`) only with the share token from lan.json;
 *       · anything else: 403.
 *
 * "Which machine" is decided from the TCP socket's remote address, never from
 * a header. Next fills `X-Forwarded-For` only when it is absent, so a client
 * can claim to be 127.0.0.1 by sending it; this runs before Next, overwrites
 * that header with the real address, and never reads it.
 *
 * The token arrives once in the link (`/screen/1?token=…`), is checked, and is
 * swapped for an HttpOnly cookie with a redirect to the clean URL, so it does
 * not linger in the address bar. Polling and images then carry the cookie.
 *
 * Plain CommonJS with no dependencies, because it has to load before Next: the
 * desktop app requires it ahead of the standalone `server.js` (see
 * `scripts/sanctum-server.cjs`), and `next start` / `next dev` load it from
 * `next.config.ts`.
 */

"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const INSTALLED = Symbol.for("sanctum.lanGuard");

/** Cookie that carries the share token after the first visit. */
const COOKIE = "sanctum_share";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/** Where an expired or missing token lands, as a translated page. */
const DENIED_PAGE = "/screen/link-expired";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22,128}$/;

/** Same location as src/lib/lan.ts: lan.json beside the data folder. */
function configPath() {
  const root = process.env.SANCTUM_DATA_ROOT
    ? path.resolve(process.env.SANCTUM_DATA_ROOT)
    : process.cwd();
  return path.join(root, "lan.json");
}

// lan.json is read on every request from another device (never for the DM's
// own), cached against its modification time so a Regenerate applies at once.
let cache = { file: "", mtimeMs: -1, config: null };

function readConfig() {
  const file = configPath();
  try {
    const { mtimeMs } = fs.statSync(file);
    if (cache.file === file && cache.mtimeMs === mtimeMs) return cache.config;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const config = {
      enabled: parsed && parsed.enabled === true,
      shareToken:
        parsed && typeof parsed.shareToken === "string" && TOKEN_PATTERN.test(parsed.shareToken)
          ? parsed.shareToken
          : null,
    };
    cache = { file, mtimeMs, config };
    return config;
  } catch {
    // Missing or unreadable: the safe default, which lets no other device in.
    return { enabled: false, shareToken: null };
  }
}

function isLoopback(address) {
  if (!address) return false;
  const a = address.toLowerCase();
  return a === "::1" || a.startsWith("127.") || a.startsWith("::ffff:127.");
}

/** Constant-time comparison; differing lengths are simply unequal. */
function tokenMatches(candidate, expected) {
  if (typeof candidate !== "string" || !expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cookieValue(header, name) {
  if (typeof header !== "string") return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i !== -1 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Paths that try to step around a prefix check — dot segments, encoded
 * separators, backslashes, doubled slashes. A browser never sends these for the
 * player view, so another device sending one is refused outright rather than
 * trusting this guard and Next to normalise them identically.
 */
function suspiciousPath(rawPath) {
  return /\.\.|%2e|%2f|%5c|\\|\/\//i.test(rawPath);
}

const PUBLIC_PREFIXES = ["/_next/static/", "/leaflet/"];
const PUBLIC_FILES = new Set(["/favicon.ico", "/icon.png", "/icon.svg", "/apple-icon.png"]);

function isPublicAsset(pathname) {
  return PUBLIC_FILES.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/** The player view's page routes (rendered HTML / RSC). */
function isPlayerPage(pathname) {
  return pathname === "/screen" || pathname.startsWith("/screen/");
}

function isPlayerResource(pathname) {
  return pathname.startsWith("/api/screen/") || pathname.startsWith("/uploads/");
}

/**
 * Decide what to do with a request from another device.
 * Returns "allow", "deny", "denied-page" (serve the translated expired-link
 * page in its place) or { redirect, cookie } for a valid token in the URL.
 * Exported for tests.
 */
function decide({ method, rawUrl, cookieHeader, accept, hasActionHeader }, config) {
  if (!config.enabled) return "deny";
  const rawPath = String(rawUrl || "/").split("?")[0];
  if (suspiciousPath(rawPath)) return "deny";

  let url;
  try {
    url = new URL(rawUrl || "/", "http://sanctum.invalid");
  } catch {
    return "deny";
  }
  const pathname = url.pathname;
  const readOnly = method === "GET" || method === "HEAD";

  if (isPublicAsset(pathname)) return readOnly ? "allow" : "deny";

  const pagePath = isPlayerPage(pathname);
  const resourcePath = isPlayerResource(pathname);
  if (!pagePath && !resourcePath) return "deny";

  // Server actions are POSTs to page URLs; the player view has none, and a
  // page path must never become a way to invoke one. Pages and images are
  // read-only; only /api/screen/* takes writes (the opt-in token move).
  if (hasActionHeader) return "deny";
  if (!readOnly && !pathname.startsWith("/api/screen/")) return "deny";

  const wantsHtml = readOnly && pagePath && /text\/html/i.test(accept || "");
  const deniedPage = wantsHtml ? "denied-page" : "deny";
  if (pathname === DENIED_PAGE) return "allow";

  const fromUrl = url.searchParams.get("token");
  if (fromUrl !== null) {
    if (!pagePath || !readOnly || !tokenMatches(fromUrl, config.shareToken)) return deniedPage;
    url.searchParams.delete("token");
    const query = url.searchParams.toString();
    return {
      redirect: pathname + (query ? `?${query}` : ""),
      cookie:
        `${COOKIE}=${encodeURIComponent(config.shareToken)}; Path=/; HttpOnly; ` +
        `SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
    };
  }

  if (tokenMatches(cookieValue(cookieHeader, COOKIE), config.shareToken)) return "allow";
  return deniedPage;
}

function refuse(req, res) {
  const isApi = String(req.url || "").startsWith("/api/");
  res.statusCode = 403;
  res.setHeader("Cache-Control", "no-store");
  if (isApi) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Not available from other devices" }));
  } else {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("403 — not available from other devices");
  }
}

/** Gate one request. Returns true when it should carry on into Next. */
function gate(req, res) {
  const remote = req.socket && req.socket.remoteAddress;
  // Whatever the client claimed, downstream code sees the real address.
  req.headers["x-forwarded-for"] = remote || "";
  if (isLoopback(remote)) return true;

  const verdict = decide(
    {
      method: req.method,
      rawUrl: req.url,
      cookieHeader: req.headers.cookie,
      accept: req.headers.accept,
      hasActionHeader: req.headers["next-action"] !== undefined,
    },
    readConfig(),
  );

  if (verdict === "allow") return true;
  if (verdict === "denied-page") {
    // Rendered by Next in the request's place, with no campaign data on it.
    req.url = DENIED_PAGE;
    return true;
  }
  if (verdict && typeof verdict === "object") {
    res.statusCode = 303;
    res.setHeader("Location", verdict.redirect);
    res.setHeader("Set-Cookie", verdict.cookie);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.end();
    return false;
  }
  refuse(req, res);
  return false;
}

/**
 * WebSocket upgrades (only the dev server's hot-reload socket) follow the same
 * rule: another device gets one only with a valid share cookie.
 */
function gateUpgrade(req, socket) {
  const remote = req.socket && req.socket.remoteAddress;
  req.headers["x-forwarded-for"] = remote || "";
  if (isLoopback(remote)) return true;
  const config = readConfig();
  const pathname = String(req.url || "").split("?")[0];
  const ok =
    config.enabled &&
    pathname.startsWith("/_next/") &&
    !suspiciousPath(pathname) &&
    tokenMatches(cookieValue(req.headers.cookie, COOKIE), config.shareToken);
  if (!ok) socket.destroy();
  return ok;
}

/**
 * Patch every HTTP server in this process — including ones already created —
 * so the guard runs before any 'request' listener, Next's included.
 */
function install() {
  if (globalThis[INSTALLED]) return;
  globalThis[INSTALLED] = true;
  const emit = http.Server.prototype.emit;
  http.Server.prototype.emit = function guardedEmit(event, ...args) {
    if (event === "request") {
      const [req, res] = args;
      let pass;
      try {
        pass = gate(req, res);
      } catch {
        // Fail closed: an error deciding is a refusal, never a pass.
        pass = false;
        try {
          if (!res.headersSent) refuse(req, res);
        } catch {
          /* socket already gone */
        }
      }
      if (!pass) return true;
    } else if (event === "upgrade") {
      const [req, socket] = args;
      let pass = false;
      try {
        pass = gateUpgrade(req, socket);
      } catch {
        socket.destroy();
      }
      if (!pass) return true;
    }
    return emit.call(this, event, ...args);
  };
}

install();

module.exports = { install, decide, isLoopback, tokenMatches, COOKIE, DENIED_PAGE };
