-- Repair json columns whose default was declared as a string rather than a
-- value. A `mode: "json"` column encodes whatever it is handed, so the string
-- default "[]" was stored as '"[]"' and read back as a string, not an array —
-- which crashed the character/NPC pickers with `books.some is not a function`.
-- The SQL DEFAULT clauses were always correct; only rows inserted through
-- Drizzle (i.e. every row the app created) carry the double-encoded value.
--
-- Unwrap one layer of encoding where the inner text is itself the value we
-- want, so any real content is preserved, then reset whatever is still not the
-- right shape.
UPDATE `campaigns` SET `rulebooks` = json_extract(`rulebooks`, '$')
  WHERE json_valid(`rulebooks`)
    AND json_type(`rulebooks`) = 'text'
    AND json_valid(json_extract(`rulebooks`, '$'))
    AND json_type(json_extract(`rulebooks`, '$')) = 'array';--> statement-breakpoint
UPDATE `campaigns` SET `rulebooks` = '[]'
  WHERE json_valid(`rulebooks`) = 0 OR json_type(`rulebooks`) <> 'array';--> statement-breakpoint

UPDATE `characters` SET `currency` = json_extract(`currency`, '$')
  WHERE json_valid(`currency`)
    AND json_type(`currency`) = 'text'
    AND json_valid(json_extract(`currency`, '$'))
    AND json_type(json_extract(`currency`, '$')) = 'object';--> statement-breakpoint
UPDATE `characters` SET `currency` = '{"pp":0,"gp":0,"ep":0,"sp":0,"cp":0}'
  WHERE json_valid(`currency`) = 0 OR json_type(`currency`) <> 'object';
