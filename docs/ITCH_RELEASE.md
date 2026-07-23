# Releasing Sanctum on itch.io

A step-by-step guide for publishing the Windows desktop build to itch.io and
shipping updates. Two phases: **one-time setup** (do once), then the **release
loop** (repeat for every update).

> Replace `USERNAME` throughout with your itch.io username, and assume the
> project URL slug is `sanctum`.

---

## Phase 0 — Before your first upload

1. **Build the app** (if you haven't since your last change):
   ```
   npm run desktop:build
   ```
   This produces, in `dist/`:
   - `Sanctum-0.1.0-portable.exe` — no-install, double-click to run
   - `Sanctum Setup 0.1.0.exe` — installer
   - `win-unpacked/` — the raw app folder (used by butler, see Phase 3)

2. **Make sure the source is publicly available.** Sanctum is **AGPL-3.0**, which
   means anyone you give the binary to is entitled to the corresponding source.
   The simplest way to satisfy this: make the GitHub repo public and link it on
   the itch page. (If the repo stays private, you must provide the source another
   way — a public repo is by far the easiest.)

---

## Phase 1 — Create the itch.io page (one time)

1. Sign in at <https://itch.io> → top-right menu → **Upload new project**
   (or Dashboard → **Create new project**).

2. Fill in the core fields:
   | Field | Recommended value |
   |-------|-------------------|
   | **Title** | Sanctum |
   | **Project URL** | `USERNAME.itch.io/sanctum` |
   | **Short description** | e.g. "A local-first D&D 5e campaign manager for Dungeon Masters." |
   | **Classification** | **Tools** (a utility; TTRPG projects also fit under Games — your call) |
   | **Kind of project** | **Downloadable** (NOT "HTML" — Sanctum is a desktop app, not a web game) |
   | **Pricing** | **No payments** or **"Name your own price"** with $0 minimum (lets people tip but keeps it free) |

3. **Uploads** → drag in your file. For the first release, the simplest choice is
   the **portable exe** (`Sanctum-0.1.0-portable.exe`). After it uploads:
   - Tick the **Windows** platform icon on that file.
   - (Optional) also upload `Sanctum Setup 0.1.0.exe` and label it "Installer".

4. **Details / page body** — this is what testers read:
   - Write what Sanctum does and what feedback you want.
   - **Add this note** so the SmartScreen warning doesn't scare people off:
     > This app isn't code-signed, so Windows may show a blue "Windows protected
     > your PC" screen on first launch. Click **More info → Run anyway**. Your
     > data is stored in `%APPDATA%\Sanctum`.
   - Link the source repo (AGPL requirement): "Source code: <your GitHub URL>".
   - **Cover image**: 630×500 px recommended (this is the thumbnail people see).
   - **Screenshots**: add 3–5 — the dashboard, combat tracker, a map, etc.
   - **Tags**: `dungeons-and-dragons`, `dnd`, `ttrpg`, `dungeon-master`,
     `campaign-manager`, `tabletop`.

5. **Community**: enable **Comments** (simplest feedback channel) — Dashboard for
   the project → Edit → *Community* → Comments.

6. **System requirements** (in the page body or the metadata): Windows 10/11,
   64-bit.

7. **Visibility** (bottom of the edit page):
   - **Draft** — only you can see it. Finish the page here.
   - **Restricted** — live but private; only people with the link/password get in.
     **Use this for your feedback round.**
   - **Public** — anyone can find it. Flip to this when you're ready for the world.

8. Click **Save**. Preview it, then set visibility to **Restricted** and share the
   link with your testers.

---

## Phase 2 — Shipping an update the simple way (web upload)

For each new version:

1. Bump the version in `package.json` (e.g. `0.1.0` → `0.1.1`).
2. `npm run desktop:build`
3. On the project's **Edit** page → **Uploads**, delete the old exe and upload the
   new one (keep the Windows platform tick).
4. Save. Done — browser-download testers get the new file next time they visit.

This is fine for early feedback. The downside: every update re-uploads the full
~180 MB, and users must manually re-download. **Phase 3 fixes both.**

---

## Phase 3 — Smoother updates with butler (recommended once rolling)

`butler` is itch's command-line tool. It uploads only the **changed bytes**
(delta patching) and, combined with the free **itch desktop app**, gives testers
**automatic updates**.

### One-time butler setup
1. Download butler: <https://itchio.itch.io/butler> (or `itch` app → it bundles it).
2. Log in:
   ```
   butler login
   ```

### Push a release
Push the **unpacked app folder** (not the installer) so itch can patch it and the
itch app can auto-update users:
```
butler push "dist/win-unpacked" USERNAME/sanctum:windows --userversion 0.1.1
```
- `USERNAME/sanctum` — your project.
- `windows` — the **channel** name (itch infers the platform from it).
- `--userversion 0.1.1` — keep this in sync with `package.json`.

Check status anytime:
```
butler status USERNAME/sanctum:windows
```

### The full release loop with butler
```
# 1. bump "version" in package.json
# 2. build
npm run desktop:build
# 3. push
butler push "dist/win-unpacked" USERNAME/sanctum:windows --userversion <new-version>
```
End to end: ~3 min to build + seconds-to-minutes to push. Testers on the itch app
update automatically; the push appears on your page immediately.

> You can keep BOTH: a butler-pushed `windows` channel (for itch-app auto-update)
> and a manually-uploaded portable exe (for people who just want a direct
> download). They coexist on the page as separate files.

---

## Quick reference

| Task | Command / action |
|------|------------------|
| Develop (no exe) | `npm run dev` |
| Build release exes | `npm run desktop:build` |
| First publish | itch.io web uploader (Phase 1) |
| Simple update | re-upload exe on Edit page (Phase 2) |
| Smooth update | `butler push "dist/win-unpacked" USERNAME/sanctum:windows --userversion X` |
| Private testing | Project visibility → **Restricted**, share link |
| Go live | Project visibility → **Public** |

## Don't forget
- Bump `version` in `package.json` every release.
- Keep the source repo public (AGPL) and linked on the page.
- Warn users about the SmartScreen prompt in the page body.
