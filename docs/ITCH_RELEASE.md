# Releasing Sanctum on itch.io

A step-by-step guide for publishing the Windows desktop build to itch.io and
shipping updates. Two phases: **one-time setup** (done), then the **release
loop** (repeat for every update).

> The project lives at <https://athanasioust.itch.io/sanctum>; the butler target
> is `athanasioust/sanctum`.

**If you just want to ship an update, skip to [The release loop](#the-release-loop).**
Everything before it is one-time setup that has already been done.

---

## Phase 0 — Before your first upload

1. **Build the app** (if you haven't since your last change):
   ```
   npm run desktop:build
   ```
   This produces, in `dist/` (`<ver>` is whatever `package.json` says):
   - `Sanctum-<ver>-portable.exe` — no-install, double-click to run (~117 MB).
     **This is the file that ships**, see [The release loop](#the-release-loop).
   - `Sanctum Setup <ver>.exe` — installer (~117 MB); not currently published
   - `win-unpacked/` — the raw app folder (~444 MB); used for smoke-testing, and
     what a `windows` channel would push if auto-updates are ever wanted back

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
   | **Project URL** | `athanasioust.itch.io/sanctum` |
   | **Short description** | e.g. "A local-first D&D 5e campaign manager for Dungeon Masters." |
   | **Classification** | **Tools** (a utility; TTRPG projects also fit under Games — your call) |
   | **Kind of project** | **Downloadable** (NOT "HTML" — Sanctum is a desktop app, not a web game) |
   | **Pricing** | **No payments** or **"Name your own price"** with $0 minimum (lets people tip but keeps it free) |

3. **Uploads** → drag in your file. For the first release, the simplest choice is
   the **portable exe** (`Sanctum-<ver>-portable.exe`). After it uploads:
   - Tick the **Windows** platform icon on that file.
   - (Optional) also upload `Sanctum Setup <ver>.exe` and label it "Installer".

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

## Phase 2 — butler setup (done)

`butler` is itch's command-line tool. It uploads only the **changed bytes**
(delta patching) and, combined with the free **itch desktop app**, gives testers
**automatic updates**. It is already installed and authenticated on the dev
machine:

- **Binary**: `C:\Users\athan\.local\bin\butler.exe` (that directory is on the
  Windows user PATH — note `C:\Users\athan\bin` is **not**, it is only on Git
  Bash's PATH). Downloaded from
  <https://broth.itch.zone/butler/windows-amd64/LATEST/archive/default>.
- **Credentials**: `%USERPROFILE%\.config\itch\butler_creds`, written by
  `butler login`. If that file is gone, re-run `butler login` in a terminal —
  it opens a browser for authorisation and cannot be scripted.

---

## The release loop

Every update, from a clean tree:

```
# 1. bump "version" in package.json  (e.g. 0.3.0 -> 0.3.1)
# 2. build
npm run desktop:build
# 3. push the portable exe
butler push "dist/Sanctum-0.3.1-portable.exe" athanasioust/sanctum:windows-portable --userversion 0.3.1
# 4. confirm itch finished processing the build
butler status athanasioust/sanctum:windows-portable
```

- `windows-portable` is the **channel** name — itch infers the platform from the
  `windows` in it.
- `--userversion` must match `package.json`; nothing enforces this, so check it.
- `butler status` shows `√` next to the build number once processing is done.
  Until then the push is uploaded but not yet served, and a brand-new channel may
  report "no channel found" for a few seconds after its first push.

**Nothing on the itch page is uploaded by hand.** The single download is a butler
channel, so a release is entirely CLI.

### Why only the portable exe

The page deliberately offers **one** file: `Sanctum-<ver>-portable.exe`. Download,
double-click, done.

butler can also push `dist/win-unpacked` (the raw app folder) to a channel — that
is in fact butler's native shape, and it buys two things: real delta patching
(the first such push sent 443 MiB as a 179 MiB patch, later ones only what
changed) and **automatic updates** for people running Sanctum through the itch
desktop app. That channel existed briefly and was removed: itch serves it to
browser users as a ~180 MB zip that expands to a 444 MB folder they must dig
through to find `Sanctum.exe`, which is a poor first impression sitting next to a
file that just runs. The auto-update benefit only reaches itch-app users, and
during a small feedback round that is close to nobody.

Revisit this once there is a stable group of testers taking frequent updates.
Restoring it is one command — build history on itch is unaffected:

```
butler push "dist/win-unpacked" athanasioust/sanctum:windows --userversion <ver>
```

Note the portable exe gets no meaningful delta savings (measured: 0.28%) because
it is a compressed self-extracting blob — change one line of source and nearly
every byte differs. Each release re-uploads its full ~117 MB. That is the price
of the one-click download, not a misconfiguration.

### Before you push

- **Smoke-test the packaged build.** Copy `dist/win-unpacked` *outside* the
  project tree first (inside it, Node resolves `better-sqlite3` up to the
  project's root `node_modules` and reports a bogus ABI mismatch). Launch it and
  check that **API routes** answer, not just that the window opens — the
  Turbopack standalone trace has silently dropped the next-server runtimes
  before, which 500s every route while pages still render fine.
- **Push the source to GitHub.** Sanctum is AGPL-3.0: anyone given a binary is
  entitled to the corresponding source, and the itch page points them at the
  public repo. Ship the commit before (or with) the release, not weeks after.

---

## Quick reference

| Task | Command / action |
|------|------------------|
| Develop (no exe) | `npm run dev` |
| Build release exes | `npm run desktop:build` |
| Ship an update | `butler push "dist/Sanctum-X-portable.exe" athanasioust/sanctum:windows-portable --userversion X` |
| Check a push landed | `butler status athanasioust/sanctum:windows-portable` |
| Private testing | Project visibility → **Restricted**, share link |
| Go live | Project visibility → **Public** |

## Don't forget
- Bump `version` in `package.json` every release, and pass the same value to
  `--userversion`.
- Commit and push the source (AGPL) — the repo is linked from the itch page.
- Check the page after pushing — one download, one version, no stale files.
- Warn users about the SmartScreen prompt in the page body (the app is unsigned).
