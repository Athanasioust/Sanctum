# Fix: json column defaults were double-encoded

Character creation crashed with `books.some is not a function` on any campaign
that had never had a rulebook ticked in Settings. This note records what caused
it, what changed, and how to avoid reintroducing it.

## Symptom

Opening **Characters → New** (or **Bestiary → New**) threw:

```
TypeError: books.some is not a function
  at optionsFor (src/lib/character-options.ts:420)
```

It affected every campaign created through the app, because it was triggered by
the column *default* rather than by anything the user did. Ticking a rulebook in
Settings happened to write a correct value, which is why the crash looked
intermittent.

## Root cause

`campaigns.rulebooks` is a `mode: "json"` column and was declared with a
**string** default:

```ts
rulebooks: text("rulebooks", { mode: "json" })
  .notNull()
  .default("[]")        // ← a string, not an array
  .$type<string[]>(),
```

A json-mode column encodes whatever value it is handed. Given the string `"[]"`
it stored the text `'"[]"'` (a JSON string containing two brackets) instead of
`'[]'` (a JSON array). Reading it back produced the **string** `"[]"`, so every
`rulebooks.some(...)` / `rulebooks.includes(...)` caller blew up.

The `?? []` guard in `optionsFor` did not help: a string is not nullish, so it
passed straight through.

Importantly, the SQL `DEFAULT '[]'` in `0004_strange_maestro.sql` was always
correct. Drizzle's JS-side default overrode it on every insert, so the bad value
came from the ORM, not the database.

Measured directly:

| Declaration | Stored text | Reads back as |
| --- | --- | --- |
| `.default("[]")` | `'"[]"'` | `"[]"` (string) — **broken** |
| `.default([])` | `'[]'` | `[]` (array) |
| `.$defaultFn(() => [])` | `'[]'` | `[]` (array) |

Introduced in `4ad8100` (*Pick 5e options from dropdowns; release 0.4.0*).

### Second instance of the same defect

`characters.currency` had the identical mistake
(`.default('{"pp":0,...}')`, from `8830cc4`). It did not crash, but the stored
string meant `currency[key]` was `undefined`, so the currency tracker rendered
**blank coin boxes instead of `0`**.

Every other json column in the schema uses `$defaultFn(() => [])` and was
unaffected.

## Changes

**`src/db/schema.ts`** — pass real values to both defaults:

```ts
rulebooks: ... .default([]).$type<string[]>(),
currency:  ... .default({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }).$type<Currency>(),
```

`.default(value)` was chosen over `$defaultFn` deliberately: it keeps the
generated SQL `DEFAULT` clause byte-identical to the existing migrations, so
there is no schema drift. `drizzle-kit generate` reports *"No schema changes,
nothing to migrate"*.

**`drizzle/0005_json_default_repair.sql`** (new) — repairs rows already written
by an affected build. It *unwraps* one layer of encoding where the inner text is
the value we want, so real rulebook selections are preserved, and only then
resets anything still of the wrong shape. Migrations run automatically on
startup (`src/db/index.ts`), so existing databases heal on next launch.

**`src/lib/character-options.ts`** — new `bookList()` helper normalises the
input for `optionsFor()` and `subclassOptions()`. Rulebooks arrive from a json
column and from imported bundles, so anything unusable is treated as "no books
ticked", which offers every option — the same graceful behaviour as a fresh
campaign.

**`src/components/settings/campaign-settings-form.tsx`** — guards
`campaign.rulebooks` with `Array.isArray`. Settings is where a broken campaign
would be repaired by hand, so it must not crash on bad data.

**`src/components/characters/character-detail.tsx`** — the currency tracker
falls back to zeroed coins unless it receives an actual object.

**`package-lock.json`** — incidental: the committed lockfile said `0.2.0` while
`package.json` said `0.4.0`. `npm install` corrected it.

## Verification

- New rows store `'[]'` / a real currency object; the original crash path now
  returns 70 races.
- A legacy row holding `'"[]"'` repairs to `[]`; a legacy row holding
  `'"[\"phb\",\"xgte\"]"'` is **preserved, not wiped**.
- Malformed inputs (`null`, `42`, `{a:1}`, `"phb"`) no longer throw.
- `tsc --noEmit` clean; `npm run build` succeeds; `drizzle-kit check` passes.
- Ran the app end to end: a campaign created with the buggy build reads back as
  `json_type=array` after migration, and `/characters/new` plus `/settings`
  return 200 with a clean server log.

## Avoiding a repeat

When adding a `mode: "json"` column, **pass the value, never its JSON text**:

```ts
.default([])                    // correct
.default({ a: 1 })              // correct
.$defaultFn(() => [])           // correct (no SQL DEFAULT emitted)
.default("[]")                  // wrong — stores '"[]"'
.default('{"a":1}')             // wrong — stores '"{\"a\":1}"'
```

A quick audit: `grep -n 'mode: "json"' -A4 src/db/schema.ts` and check that no
`.default(` on those columns is followed by a quoted string.
