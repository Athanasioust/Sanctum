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
   - `Sanctum Setup <ver>.exe` — installer, adds Start-menu and desktop
     shortcuts and an uninstall entry (~117 MB).

     **Both of these ship**, see [The release loop](#the-release-loop).
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

3. **Uploads** → nothing to drag in: both files arrive as butler channels (see
   [The release loop](#the-release-loop)). After the first push of each, itch
   lists them automatically — set the display name on each so the choice is
   obvious ("Portable — no install" and "Installer"), and check the **Windows**
   platform icon is ticked.

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
# 1. bump "version" in package.json  (e.g. 0.3.1 -> 0.4.0)
# 2. build
npm run desktop:build
# 3. push both downloads
butler push "dist/Sanctum-0.4.0-portable.exe" athanasioust/sanctum:windows-portable --userversion 0.4.0
butler push "dist/Sanctum Setup 0.4.0.exe" athanasioust/sanctum:windows-installer --userversion 0.4.0
# 4. confirm itch finished processing both builds
butler status athanasioust/sanctum:windows-portable
butler status athanasioust/sanctum:windows-installer
```

- `windows-portable` and `windows-installer` are **channel** names — itch infers
  the platform from the `windows` in them.
- `--userversion` must match `package.json`; nothing enforces this, so check it.
- `butler status` shows `√` next to the build number once processing is done.
  Until then the push is uploaded but not yet served, and a brand-new channel may
  report "no channel found" for a few seconds after its first push.
- Push **both** channels every release. A channel keeps serving its last build
  forever, so skipping one leaves a stale version on the page next to the new
  one — the most likely way to confuse a tester.

**Nothing on the itch page is uploaded by hand.** Both downloads are butler
channels, so a release is entirely CLI.

### The two published downloads

The page offers the portable exe (download, double-click, done — nothing is
written outside `%APPDATA%\Sanctum`) and the installer (Start-menu and desktop
shortcuts, an entry in Add/Remove Programs, choose-your-own install directory).
They are the same app; the choice is only whether it gets installed.

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

An earlier note here claimed the portable exe gets no useful delta savings
(0.28%). That did not hold up: the 0.4.0 push re-used 96.77% of the previous
build and sent a **3.63 MiB patch (96.90% savings)** for a 118 MB file. Expect
pushes after the first to be quick. A channel's first push has no baseline and
uploads in full, so the installer's debut cost the whole 118 MB.

### Linux builds

Linux artifacts must be built **on Linux** — WSL is fine. `npm run desktop:build`
refuses to cross-build rather than producing something subtly broken:
electron-builder needs `fpm` for deb/rpm (no Windows build), and AppImage/tar.gz
need real executable bits and the setuid `chrome-sandbox`, which NTFS cannot
carry. The native `better-sqlite3` binary is fine either way — the prebuilt
download strategy publishes `electron-v146-linux-x64` too — but the packaging
step is not.

From a WSL checkout of the repo (its own `npm ci`, not the Windows
`node_modules` — the native binaries differ):

```
npm ci
npm run desktop:build:linux
butler push "dist/Sanctum-0.4.3.AppImage" athanasioust/sanctum:linux --userversion 0.4.3
butler push "dist/sanctum-0.4.3.tar.gz" athanasioust/sanctum:linux-tar --userversion 0.4.3
butler status athanasioust/sanctum:linux
```

Note the casing: electron-builder names the AppImage from `productName`
(`Sanctum-…`) but the tarball from `executableName` (`sanctum-…`). Copy the
names from `ls dist/` rather than typing them.

- **AppImage is the primary download.** It is self-contained and handles its own
  sandboxing; the tar.gz is for people who prefer to unpack it, and on some
  distros an unpacked build needs `--no-sandbox` to launch.
- Tick **Linux** in the itch page's platform list, or the downloads are offered
  to Windows users only.
- Build on the oldest distro you intend to support. glibc is forward- but not
  backward-compatible, so an Ubuntu 24.04 build will not run on 22.04.
- Linux filesystems are case-sensitive. A wrongly-cased import builds fine on
  Windows and fails in WSL — that build is the check, so don't skip it before a
  release that touched imports.
- **AppImage bundles Sanctum, not Chromium's system libraries.** Electron links
  against the distro's NSS and ALSA, so a minimal install (a bare WSL Ubuntu, a
  slim container, some server images) cannot launch it. The 0.4.3 build was
  missing `libnspr4.so`, `libnss3.so`, `libnssutil3.so`, `libsmime3.so` and
  `libasound.so.2`, i.e.:

  ```
  sudo apt install -y libnss3 libnspr4 libasound2t64   # libasound2 pre-24.04
  ```

  A normal Ubuntu/Fedora desktop already has all of these — this only bites
  minimal environments. Say so on the itch page anyway; it is the single most
  likely "it doesn't start" report.

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
| Ship an update (portable) | `butler push "dist/Sanctum-X-portable.exe" athanasioust/sanctum:windows-portable --userversion X` |
| Ship an update (installer) | `butler push "dist/Sanctum Setup X.exe" athanasioust/sanctum:windows-installer --userversion X` |
| Check a push landed | `butler status athanasioust/sanctum:windows-portable` (and `:windows-installer`) |
| Private testing | Project visibility → **Restricted**, share link |
| Go live | Project visibility → **Public** |

## Don't forget
- Bump `version` in `package.json` every release, and pass the same value to
  `--userversion`.
- Commit and push the source (AGPL) — the repo is linked from the itch page.
- Push **both** channels, then check the page — two downloads, both on the new
  version, no stale files.
- Warn users about the SmartScreen prompt in the page body (the app is unsigned).
