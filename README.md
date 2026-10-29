# Sanctum

A **local-first Dungeon Master's campaign manager** for Dungeons & Dragons 5e. Everything — characters, NPCs, combat, your world map, story timeline, factions, shops, calendars and notes — lives in a single SQLite database on your machine. No account, no cloud, no AI. Just open it and run your table.

> Built by **athanasioust**. © 2026 athanasioust — licensed under [AGPL-3.0](#license).

## Features

- **Characters** — full 5e character sheets with ability scores, skills, saves, HP, initiative, spells, inventory, features and feats, plus a **currency tracker** (pp/gp/ep/sp/cp), **hit dice & rest** management (spend hit dice on a short rest, restore on a long rest) and **limited-use abilities** (Second Wind, Channel Divinity, Rage…) that short and long rests recharge. Upload a **portrait** and it doubles as the character's battle-map token. A guided **character wizard** builds one from scratch, and **one-click level-up** walks the whole level in a single pass — hit points, proficiency, new features, spell slots and ASIs.
- **Bestiary & NPCs** — reusable stat-block templates with portraits, plus **one-click import of 140+ SRD monsters** from goblins to the tarrasque. Long lists stay fast, and you can **select several and delete them at once — with Undo**.
- **Combat tracker** — initiative order, drag-to-reorder turns, conditions, death saves, quick **+/- HP buttons** (tap for 1, hold to fly through 5 at a time), **concentration tracking** with automatic save-DC prompts on damage, and a per-round **combat log** you can copy or export as Markdown or text.
  - **Boss fights:** legendary-action pips that refresh on the creature's turn, a **Lair Actions** row at initiative 20, and a reaction marker per combatant.
  - **Minion groups:** add a pack as one "5× Goblin" initiative row that takes one turn, then expand it to hit any member individually.
  - **Timed conditions** ("Stunned, 1 round, ends at the end of its turn") drop off by themselves.
  - **Encounter difficulty:** the encounter builder and the live tracker rate the fight Easy → Deadly against your party (2014 DMG XP budget), and the builder hints which monsters fit.
  - **Saved encounters** to run again later, and **random encounters** rolled from a location's own table straight into a fight.
  - **Keyboard control** (Space/arrows for turns, +/- for HP, ? for the cheat-sheet) and a **pop-out window** for a second monitor.
- **Battle map** — a grid map with drag-and-drop tokens wired straight to the initiative order, so HP and conditions show on the token. Includes a **measuring tape and AoE templates** (circle, cone, line, cube) that respect your diagonal rule, freehand drawing, arrows and labels, and **fog of war** you paint by hand. Reveal a map to the player view and the players see only what the fog allows — hidden tokens and anything standing in the dark are never drawn on their screen. Tokens show **portrait art** clipped to a circle, and dropping a fireball template lets you **apply its damage to everyone under it**, with save-for-half. Optionally, players can **drag their own tokens** from their phones.
- **Dice roller** — roll from anywhere, with contextual rolls off a character's own modifiers (attacks, saves, skills, hit dice), advantage/disadvantage, and results dropped into the combat log.
- **Quests** — track active/on-hold/completed/failed quests with checkable sub-objectives and rewards.
- **Magic items** — catalogue items by rarity and type, track attunement, charges (with recharge conditions) and cursed status, and assign them to characters.
- **Handouts** — write player-facing handouts in Markdown (with images) and reveal them to the live player view.
- **Rumors** — jot down rumors and gossip with their source, and mark them followed-up once investigated.
- **NPC relationships** — map the web of allies, enemies, family and informants as an interactive relationship graph.
- **World atlas** — zoomable maps (Leaflet, fully offline) with categorised markers and Markdown popups, markers linked to your locations, NPCs, quests, shops, factions, handouts and rumors, portal markers that nest maps from continent to city, exploration fog for the player view, and export to a standalone interactive HTML file.
- **Mind map** — a free-form canvas for plotting threads: drag out nodes, link them up, colour-code them and tie them back to the campaign records they're about.
- **Homebrew** — author your own spells, items, monsters and feats alongside the SRD content, including **2024 weapon mastery** properties.
- **Soundpad** — an ambient audio desk with layered channels and saveable soundscapes, so a tavern, a storm or a dungeon is one click away. Your own audio files, played locally.
- **Story & sessions** — a timeline of events/plot threads/milestones, plus per-session prep with plot points and planned encounters.
- **Calendar** — real-world calendar (driven by your system clock) or a fully custom in-world calendar with its own months and weekdays.
- **Factions, shops & loot, roll tables and sticky notes** — with Markdown support in notes.
- **Progress clocks** — Blades-style segmented clocks for looming threats on the dashboard, optionally shown to players.
- **Global search** — a **⌘K / Ctrl+K command palette** searches across characters, NPCs, locations, quests, magic items, handouts and rumors.
- **Rules reference** — a built-in D&D 5e quick-reference panel (conditions, combat actions, exhaustion, rests, proficiency) always a click away.
- **Player view** — a live, auto-refreshing second screen showing initiative, party status, revealed handouts and clocks, and the battle map you're currently showing. Put it on a TV, or turn on **local-network sharing** and your players open it on their own phones over the same Wi-Fi — scan the QR code in Settings and they're in. It's read-only — the one exception is letting a player drag the token you've handed them, which is off unless you switch it on — and nothing leaves your network.
- **Languages** — the interface is available in **English, German, French, Spanish, Italian and Portuguese** (rules text stays in English).
- **Sample campaign** — a fresh install offers a ready-made campaign, *The Lost Souls*, with a fight already in progress, so you can look around before building your own. A "What's new" dialog shows the highlights after each update.
- **Built-in PDF viewer** — open rulebooks, adventures and any other PDF you keep with the campaign without leaving the app.
- **Import** — bring existing material in instead of retyping it:
  - **Markdown / Obsidian** — drop in individual `.md` files or point Sanctum at a whole vault folder. It reads YAML frontmatter, folder names and stat-block layouts to work out whether each note is an NPC, monster, spell, magic item, location, quest, faction or plain note; you review and correct every guess before anything is written. Structured notes are mapped field-by-field (AC, HP, ability scores, saves, skills, traits and actions for stat blocks; level/school/casting time for spells; and so on) and the original markdown is always kept on the record, so nothing is lost. One-way only — your vault is never touched, and re-running an import skips what's already there.
  - **Character sheet PDF** — upload a filled-in 5e sheet and Sanctum reads its form fields directly: abilities, proficiencies (inferred from the printed bonuses), HP, hit dice, currency, equipment, features, spells and slots. Spell details are filled in from the bundled SRD data where the names match. The sheet must be **fillable** — one you can click into and type in, like the official Wizards PDF. Printed, scanned or builder-exported sheets are flattened and carry no form data; the importer says so plainly instead of failing. Run `node scripts/inspect-sheet.mjs "<sheet.pdf>"` to see exactly what a given file contains. Only files **you** upload are read — no rules content beyond the SRD ships with the app.
- **Character sheet export** — **Export PDF** on any character produces a printable sheet: abilities, saves and skills with proficiency marks, HP and hit dice, defences, currency, personality, features and feats, equipment, magic items, spell slots and spell lists. The sheet is drawn by Sanctum itself with the standard PDF fonts — no template, artwork or font file is bundled or downloaded. Its values sit in form fields named the way the official sheet names them, so the exported PDF is still fillable in any reader **and** can be read straight back in by the character sheet importer.
- **Backups & portability** — automatic daily backups, plus per-campaign export/import as JSON. The export carries the whole campaign: battle maps and their fog, soundscapes, mind maps and homebrew included.
- **Update check (opt-in, off by default)** — turn on **Settings → Check for updates** and Sanctum makes one public, unauthenticated request to GitHub's releases API per launch, then quietly tells you if a newer version is out. Nothing about you or your campaigns is sent, it never downloads or installs anything, and with it off Sanctum makes no network requests at all.

## Download

Sanctum runs as a **desktop app on Windows, Linux and macOS** — no Node install, no terminal. Grab the latest build from [itch.io](https://athanasioust.itch.io/sanctum):

| Platform | Downloads |
| -------- | --------- |
| Windows  | Installer (`.exe`) or portable `.exe` |
| Linux    | `AppImage` or `.tar.gz` |
| macOS    | `.dmg` or `.zip` (Intel and Apple Silicon) |

The desktop app bundles its own server and database — the first launch creates everything it needs. The builds are not signed with a paid developer certificate, so the first launch needs **More info → Run anyway** on Windows (SmartScreen) or a right-click → **Open** on macOS (Gatekeeper).

Prefer to run it from source? See [Getting started](#getting-started).

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- TypeScript + Tailwind CSS v4 + shadcn/ui
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team)
- [Konva](https://konvajs.org) for the battle map, [Leaflet](https://leafletjs.com) for the world atlas, [React Flow](https://reactflow.dev) for the mind map, [pdf.js](https://mozilla.github.io/pdf.js/) + [pdf-lib](https://pdf-lib.js.org) for reading and writing PDFs
- [Electron](https://www.electronjs.org) + electron-builder for the desktop builds

## Prerequisites

- **Node.js 20 or later** ([download](https://nodejs.org)) — check with `node -v`.
- **npm** (bundled with Node).

> `better-sqlite3` is a native module. It ships prebuilt binaries for common platforms, so `npm install` usually just works. If your platform has no prebuilt binary, you'll also need standard build tools (on Windows: the "Desktop development with C++" workload from Visual Studio Build Tools; on macOS: Xcode Command Line Tools; on Linux: `build-essential` + `python3`).

## Getting started

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Sanctum

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser.

That's it. On first launch the app automatically creates the SQLite database at `./data/sanctum.db` and applies all migrations — there is **no manual database setup step**. Create a campaign and start building.

## Running in production

```bash
npm run build   # create an optimized production build
npm start       # serve it (defaults to http://localhost:3000)
```

## Where your data lives

Everything is on your machine and is **never committed to git**:

| Path         | Contents                                        |
| ------------ | ----------------------------------------------- |
| `./data/`    | The SQLite database (`sanctum.db`)              |
| `./backups/` | Automatic daily snapshots                       |
| `./uploads/` | Images, audio and PDFs you upload               |

In the packaged desktop app these live in a per-user directory instead:

| Platform | Location                                     |
| -------- | -------------------------------------------- |
| Windows  | `%APPDATA%\Sanctum`                          |
| macOS    | `~/Library/Application Support/Sanctum`      |
| Linux    | `~/.config/Sanctum`                          |

To back up or move your whole setup, copy the `data/` folder. To share a single campaign, use **Settings → Export** in the app.

## Available scripts

| Script                | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Start the dev server with hot reload                |
| `npm run build`       | Production build                                    |
| `npm start`           | Run the production build                            |
| `npm run lint`        | Run ESLint                                          |
| `npm run db:generate` | Generate a new Drizzle migration after schema edits |
| `npm run db:migrate`  | Apply migrations manually (also runs on app start)  |
| `npm run db:studio`   | Open Drizzle Studio to browse the database          |
| `npm run start:lan`   | Run the production build reachable on your local network |
| `npm run desktop:build` | Package the desktop app for the current platform  |

Desktop builds are per-platform and cannot be cross-built — run
`desktop:build:win` on Windows, `desktop:build:linux` under Linux/WSL and
`desktop:build:mac` on a Mac. A single macOS run produces both Intel and Apple
Silicon builds. Neither the macOS nor the Windows build carries a developer
certificate, so the first launch needs a right-click → **Open** (Gatekeeper) or
**More info → Run anyway** (SmartScreen).

## Attribution

Monster stat blocks bundled with the Bestiary importer are derived from the **System Reference Document 5.1** by Wizards of the Coast, available under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/legalcode).

## License

**Copyright © 2026 athanasioust. All rights reserved.**

Sanctum is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see the [`LICENSE`](./LICENSE) file for the full terms.

In short:

- You're free to use, study, modify and self-host Sanctum.
- If you **distribute** it, or **run a modified version as a network/web service**, you **must** release your complete source code under the same AGPL-3.0 license and **preserve attribution** to the original author.
- It **cannot** be taken closed-source or rebranded as your own proprietary product.

For any use outside these terms (e.g. a commercial license without the copyleft requirements), contact the author.
