# Sanctum

A **local-first Dungeon Master's campaign manager** for Dungeons & Dragons 5e. Everything — characters, NPCs, combat, your world map, story timeline, factions, shops, calendars and notes — lives in a single SQLite database on your machine. No account, no cloud, no AI. Just open it and run your table.

> Built by **athanasioust**.

## Features

- **Characters** — full 5e character sheets with ability scores, skills, saves, HP, initiative, spells, inventory, features and feats.
- **Bestiary & NPCs** — reusable stat-block templates, plus **one-click import of 140+ SRD monsters** from goblins to the tarrasque.
- **Combat tracker** — initiative order, drag-to-reorder turns, conditions, death saves, and quick **+/- HP buttons** (tap for 1, hold to fly through 5 at a time).
- **World** — nested locations with image maps, pins and a tactical grid builder.
- **Story & sessions** — a timeline of events/plot threads/milestones, plus per-session prep with plot points and planned encounters.
- **Calendar** — real-world calendar (driven by your system clock) or a fully custom in-world calendar with its own months and weekdays.
- **Factions, shops & loot, roll tables and sticky notes.**
- **Backups & portability** — automatic daily backups, plus per-campaign export/import as JSON.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- TypeScript + Tailwind CSS v4 + shadcn/ui
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team)

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

| Path              | Contents                                  |
| ----------------- | ----------------------------------------- |
| `./data/`         | The SQLite database (`sanctum.db`)        |
| `./backups/`      | Automatic daily snapshots                 |
| `./public/uploads/` | Map images you upload                   |

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

## Attribution

Monster stat blocks bundled with the Bestiary importer are derived from the **System Reference Document 5.1** by Wizards of the Coast, available under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/legalcode).
