/**
 * 5e character sheet (PDF) export.
 *
 * Draws a sheet from scratch with pdf-lib primitives and the 14 standard PDF
 * fonts, so nothing third-party ships with the app and no artwork, template or
 * font file is ever fetched at runtime.
 *
 * Values are written into AcroForm fields named the way the official sheet
 * names them. That buys two things: the exported sheet stays fillable in any
 * PDF reader, and `pdf-character-sheet.ts` can read a sheet Sanctum wrote
 * straight back in. Long free text (features, equipment, notes) is drawn as
 * flowing text — those get a hidden field carrying the same content so the
 * round trip doesn't lose it.
 */

import "server-only";
import {
  PDFDocument,
  PDFPage,
  StandardFonts,
  TextAlignment,
  rgb,
  type PDFFont,
  type PDFForm,
  type RGB,
} from "pdf-lib";
import { ABILITIES, SKILLS, hitDieForClass } from "./constants";
import type { AbilityKey } from "./constants";
import { abilityModifier, formatModifier, savingThrowBonus, skillBonus } from "./dnd";
import { spellFieldIds } from "./pdf-character-sheet";
import type {
  Character,
  Currency,
  InventoryItem,
  MagicItem,
  Spell,
  SpellSlot,
} from "@/db/schema";

export type CharacterSheetData = {
  character: Character;
  spells: Spell[];
  spellSlots: SpellSlot[];
  inventory: InventoryItem[];
  magicItems: MagicItem[];
  campaignName?: string;
};

/* -------------------------------------------------------------------------- */
/*  Palette & geometry                                                         */
/* -------------------------------------------------------------------------- */

// A sheet gets printed, so it is drawn light-on-white rather than in the app's
// dark theme. The accent is Sanctum's violet (#7c3aed), darkened for ink.
const INK = rgb(0.11, 0.11, 0.13);
const MUTED = rgb(0.44, 0.44, 0.5);
const RULE = rgb(0.78, 0.78, 0.83);
const ACCENT = rgb(0.486, 0.227, 0.929);
const ACCENT_DEEP = rgb(0.29, 0.12, 0.58);
const TINT = rgb(0.957, 0.949, 0.988);
const PAPER = rgb(1, 1, 1);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 34;
const CONTENT_W = PAGE_W - MARGIN * 2; // 544
const COL_GAP = 14;
const COL_W = (CONTENT_W - COL_GAP * 2) / 3; // 172
const COL_X = [0, 1, 2].map((i) => MARGIN + i * (COL_W + COL_GAP));

const PANEL_TITLE_H = 14;
const PANEL_PAD = 5;
const PANEL_GAP = 9;
const INNER_W = COL_W - PANEL_PAD * 2; // 162

const FOOTER_H = 20;
const COLUMN_BOTTOM = MARGIN + FOOTER_H;
const RUNNING_HEADER_H = 24;

/* -------------------------------------------------------------------------- */
/*  Text                                                                        */
/* -------------------------------------------------------------------------- */

// The standard fonts are WinAnsi-encoded, and pdf-lib throws on anything they
// can't represent. Map the typography users actually paste, drop the rest.
const SUBSTITUTIONS: [RegExp, string][] = [
  [/[‘’‛′]/g, "'"],
  [/[“”‟″]/g, '"'],
  [/[–‒]/g, "-"],
  [/—/g, "--"],
  [/[−‐‑]/g, "-"],
  [/…/g, "..."],
  [/[•●▪]/g, "-"],
  [/ /g, " "],
  [/×/g, "x"],
  [/⁄/g, "/"],
  [/\t/g, "    "],
];

/** Make a string safe to draw with a standard font. */
function pdfText(value: string): string {
  let out = value ?? "";
  for (const [pattern, replacement] of SUBSTITUTIONS) out = out.replace(pattern, replacement);
  // Keep printable Latin-1 plus newlines; everything else has no glyph.
  out = out.replace(/[^\n\x20-\x7e\xa0-\xff]/g, "");
  // Tidy the holes dropped glyphs leave behind ("field of lore ." -> "lore.").
  return out.replace(/ {2,}/g, " ").replace(/ +([.,;:!?])/g, "$1");
}

/** Greedy word wrap, breaking mid-word only when a single word can't fit. */
function wrapText(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of pdfText(value).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) out.push(line);
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
        // Binary search the break point; scanning back one character at a time
        // is quadratic, and a pasted 2,000-character "word" is not hypothetical.
        let low = 1;
        let high = rest.length - 1;
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          if (font.widthOfTextAtSize(rest.slice(0, mid), size) <= maxWidth) low = mid;
          else high = mid - 1;
        }
        out.push(rest.slice(0, low));
        rest = rest.slice(low);
      }
      line = rest;
    }
    if (line) out.push(line);
  }
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

function truncate(value: string, max: number): string {
  const clean = value.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}...`;
}

/** Largest size, stepping down from `max`, that keeps `value` inside `width`. */
function fitFontSize(font: PDFFont, value: string, width: number, max: number, min: number): number {
  const text = pdfText(value);
  let size = max;
  while (size > min && font.widthOfTextAtSize(text, size) > width) size -= 0.5;
  return size;
}

/** Cut a string down with an ellipsis until it fits the given width. */
function ellipsize(font: PDFFont, value: string, size: number, width: number): string {
  const text = pdfText(value);
  if (font.widthOfTextAtSize(text, size) <= width) return text;
  let cut = text.length;
  while (cut > 1 && font.widthOfTextAtSize(`${text.slice(0, cut)}...`, size) > width) cut -= 1;
  return `${text.slice(0, cut).trimEnd()}...`;
}

/* -------------------------------------------------------------------------- */
/*  Drawing primitives (y is always the TOP edge, PDF space is bottom-up)      */
/* -------------------------------------------------------------------------- */

type Fonts = {
  body: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  display: PDFFont;
};

function drawTextAt(
  page: PDFPage,
  value: string,
  x: number,
  top: number,
  size: number,
  font: PDFFont,
  color: RGB,
) {
  const text = pdfText(value);
  if (!text) return;
  page.drawText(text, { x, y: top - size, size, font, color });
}

function drawCentered(
  page: PDFPage,
  value: string,
  centerX: number,
  top: number,
  size: number,
  font: PDFFont,
  color: RGB,
) {
  const text = pdfText(value);
  if (!text) return;
  const width = font.widthOfTextAtSize(text, size);
  drawTextAt(page, text, centerX - width / 2, top, size, font, color);
}

function drawBox(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  height: number,
  fill: RGB | undefined = PAPER,
) {
  page.drawRectangle({
    x,
    y: top - height,
    width,
    height,
    color: fill,
    borderColor: RULE,
    borderWidth: 0.6,
  });
}

/* -------------------------------------------------------------------------- */
/*  Layout context                                                             */
/* -------------------------------------------------------------------------- */

type Ctx = {
  pdf: PDFDocument;
  form: PDFForm;
  fonts: Fonts;
  page: PDFPage;
  firstPage: PDFPage;
  /** Index of the column the flow is currently filling. */
  col: number;
  /** Top edge of the next thing to be placed in that column. */
  y: number;
  /** Top edge each column starts at on the current page. */
  colTop: number;
  /** How much of the current column is spoken for, including gaps. */
  colUsed: number;
  /** Height each column on this page should aim for — see `setColumnBudget`. */
  budget: number;
  /** Estimated height of the content still to be placed. */
  remaining: number;
  running: string;
  /** Every AcroForm name used so far — pdf-lib throws on duplicates. */
  names: Set<string>;
};

function startPage(ctx: Ctx) {
  ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  drawRunningHeader(ctx);
  ctx.colTop = PAGE_H - MARGIN - RUNNING_HEADER_H;
  ctx.col = 0;
  ctx.y = ctx.colTop;
  ctx.colUsed = 0;
  setColumnBudget(ctx);
}

/**
 * Full pages are filled to the brim, but once the rest of the content fits on
 * the page being started it is spread evenly across the three columns —
 * otherwise a short final page leaves one tall column beside two empty ones.
 */
function setColumnBudget(ctx: Ctx) {
  const capacity = ctx.colTop - COLUMN_BOTTOM;
  ctx.budget =
    ctx.remaining <= capacity * COL_X.length
      ? // A floor keeps a handful of small panels from scattering one per column.
        Math.max(120, ctx.remaining / COL_X.length)
      : capacity;
}

function drawRunningHeader(ctx: Ctx) {
  const top = PAGE_H - MARGIN;
  drawTextAt(ctx.page, ctx.running, MARGIN, top - 2, 10, ctx.fonts.display, ACCENT_DEEP);
  ctx.page.drawLine({
    start: { x: MARGIN, y: top - 16 },
    end: { x: PAGE_W - MARGIN, y: top - 16 },
    thickness: 0.8,
    color: RULE,
  });
}

function nextColumn(ctx: Ctx) {
  if (ctx.col >= COL_X.length - 1) {
    startPage(ctx);
    return;
  }
  ctx.col += 1;
  ctx.y = ctx.colTop;
  ctx.colUsed = 0;
}

/* -------------------------------------------------------------------------- */
/*  Form fields                                                                */
/* -------------------------------------------------------------------------- */

type FieldOpts = {
  x: number;
  top: number;
  width: number;
  height: number;
  size: number;
  align?: TextAlignment;
  font?: PDFFont;
  color?: RGB;
};

/**
 * Write a value as a transparent, borderless AcroForm field so the sheet reads
 * as drawn text but stays editable — and stays readable by the importer.
 */
function valueField(ctx: Ctx, name: string, value: string, o: FieldOpts) {
  const text = pdfText(value);
  const font = o.font ?? ctx.fonts.body;

  // A duplicate name would throw; fall back to plain text so a character with,
  // say, more spells than the sheet has slots still renders.
  if (ctx.names.has(name)) {
    drawTextAt(ctx.page, text, o.x + 1, o.top - (o.height - o.size) / 2, o.size, font, o.color ?? INK);
    return;
  }
  ctx.names.add(name);

  const field = ctx.form.createTextField(name);
  if (o.align) field.setAlignment(o.align);
  // Order matters. A field with no explicit size is auto-sized by laying its
  // text out at every size from 4pt up, which is ruinously slow on long
  // values, and the size can only be set once the widget exists (that's what
  // creates the default-appearance entry). So: widget, size, text, render.
  field.addToPage(ctx.page, {
    x: o.x,
    y: o.top - o.height,
    width: o.width,
    height: o.height,
    font,
    textColor: o.color ?? INK,
    backgroundColor: undefined,
    borderColor: undefined,
    borderWidth: 0,
  });
  field.setFontSize(o.size);
  field.setText(text);
  field.updateAppearances(font);
}

/**
 * Carry a block of text the sheet draws itself (features, equipment, notes) in
 * a field the reader never shows, purely so the import side can recover it.
 *
 * Deliberately no appearance stream for the value: laying out a long multiline
 * field costs pdf-lib cubic time in the text length (it re-measures the whole
 * remainder for every line), and nothing ever renders a hidden widget. The
 * document is saved with `updateFieldAppearances: false` so this stays true.
 */
function hiddenField(ctx: Ctx, name: string, value: string) {
  const text = pdfText(value).trim();
  if (!text || ctx.names.has(name)) return;
  ctx.names.add(name);

  const field = ctx.form.createTextField(name);
  field.enableMultiline();
  field.addToPage(ctx.firstPage, {
    x: MARGIN,
    y: MARGIN,
    width: CONTENT_W,
    height: 600,
    hidden: true,
    font: ctx.fonts.body,
    textColor: INK,
    backgroundColor: undefined,
    borderColor: undefined,
    borderWidth: 0,
  });
  field.setFontSize(8);
  field.setText(text);
}

/* -------------------------------------------------------------------------- */
/*  Panels: a flowing three-column layout                                      */
/* -------------------------------------------------------------------------- */

/** One atomic, unsplittable strip of a panel's body. */
type Unit = { h: number; draw: (ctx: Ctx, x: number, top: number) => void };

type Panel = { title: string; units: Unit[] };

/**
 * Place a panel into the column flow, splitting it across columns and pages
 * when it doesn't fit. Units are atomic; a panel that breaks is re-titled so a
 * reader can see the list continues.
 */
function placePanel(ctx: Ctx, panel: Panel) {
  let units = panel.units;
  if (units.length === 0) return;
  let title = panel.title;

  // Start a fresh column if this one has already had its share of the page.
  if (ctx.colUsed > 0 && ctx.colUsed >= ctx.budget) nextColumn(ctx);

  while (units.length > 0) {
    const available = ctx.y - COLUMN_BOTTOM - PANEL_TITLE_H - PANEL_PAD * 2;
    let used = 0;
    let count = 0;
    while (count < units.length && used + units[count].h <= available) {
      used += units[count].h;
      count += 1;
    }

    // Nothing fits, or so little that the column would end on a stub. Move on —
    // unless the column is empty, where the unit is taller than a column and
    // has to overflow rather than loop forever.
    const orphaned = count < units.length && count < 2;
    if (count === 0 || orphaned) {
      if (ctx.colUsed > 0) {
        nextColumn(ctx);
        continue;
      }
      count = Math.max(1, count);
      used = units.slice(0, count).reduce((sum, unit) => sum + unit.h, 0);
    }

    const x = COL_X[ctx.col];
    const height = PANEL_TITLE_H + PANEL_PAD * 2 + used;
    drawBox(ctx.page, x, ctx.y, COL_W, height);
    ctx.page.drawRectangle({
      x,
      y: ctx.y - PANEL_TITLE_H,
      width: COL_W,
      height: PANEL_TITLE_H,
      color: TINT,
      borderColor: RULE,
      borderWidth: 0.6,
    });
    drawTextAt(ctx.page, title.toUpperCase(), x + PANEL_PAD, ctx.y - 3.4, 7, ctx.fonts.bold, ACCENT_DEEP);

    let unitTop = ctx.y - PANEL_TITLE_H - PANEL_PAD;
    for (const unit of units.slice(0, count)) {
      unit.draw(ctx, x + PANEL_PAD, unitTop);
      unitTop -= unit.h;
    }

    ctx.y -= height + PANEL_GAP;
    ctx.colUsed += height + PANEL_GAP;
    ctx.remaining = Math.max(0, ctx.remaining - height - PANEL_GAP);
    units = units.slice(count);
    if (units.length > 0) {
      nextColumn(ctx);
      title = `${panel.title} (cont.)`;
    }
  }
}

/** Height a panel wants, chrome and trailing gap included. */
function panelHeight(panel: Panel): number {
  const body = panel.units.reduce((sum, unit) => sum + unit.h, 0);
  return PANEL_TITLE_H + PANEL_PAD * 2 + body + PANEL_GAP;
}

/* -------------------------------------------------------------------------- */
/*  Unit builders                                                              */
/* -------------------------------------------------------------------------- */

function paragraphUnits(
  font: PDFFont,
  value: string,
  size: number,
  color: RGB = INK,
  indent = 0,
): Unit[] {
  return wrapText(value, font, size, INNER_W - indent).map((line) => ({
    h: size + 2.6,
    draw: (ctx, x, top) => drawTextAt(ctx.page, line, x + indent, top, size, font, color),
  }));
}

function spacerUnit(h = 4): Unit {
  return { h, draw: () => {} };
}

/** "Skill  ●  +5" style row, with a filled pip when proficient. */
function proficiencyUnit(
  f: Fonts,
  opts: { field: string; bonus: number; label: string; sub?: string; proficient: boolean },
): Unit {
  return {
    h: 11.5,
    draw: (ctx, x, top) => {
      ctx.page.drawCircle({
        x: x + 3.6,
        y: top - 5.6,
        size: 2.4,
        color: opts.proficient ? ACCENT : PAPER,
        borderColor: opts.proficient ? ACCENT : MUTED,
        borderWidth: 0.6,
      });
      valueField(ctx, opts.field, formatModifier(opts.bonus), {
        x: x + 9,
        top: top - 0.5,
        width: 21,
        height: 10,
        size: 7.5,
        align: TextAlignment.Center,
        font: f.bold,
      });
      drawTextAt(ctx.page, opts.label, x + 33, top - 1.8, 7.5, f.body, INK);
      if (opts.sub) {
        const labelWidth = f.body.widthOfTextAtSize(pdfText(opts.label), 7.5);
        drawTextAt(ctx.page, opts.sub, x + 36 + labelWidth, top - 2.4, 6.2, f.body, MUTED);
      }
    },
  };
}

/** A labelled line of free text, wrapped ("Resistances: fire, cold"). */
function labelledUnits(f: Fonts, label: string, value: string): Unit[] {
  if (!value.trim()) return [];
  const units: Unit[] = [
    {
      h: 9.5,
      draw: (ctx, x, top) => drawTextAt(ctx.page, label.toUpperCase(), x, top - 1, 6.2, f.bold, MUTED),
    },
  ];
  units.push(...paragraphUnits(f.body, value, 7.5));
  units.push(spacerUnit(3));
  return units;
}

/* -------------------------------------------------------------------------- */
/*  Page 1 masthead                                                            */
/* -------------------------------------------------------------------------- */

/** "Fighter (Champion) 3 / Rogue 2" — the shape the importer parses back. */
function classLevelText(c: Character): string {
  if (c.multiclassInfo.length > 0) {
    return c.multiclassInfo
      .map((entry) =>
        [entry.className, entry.subclass ? `(${entry.subclass})` : null, entry.level]
          .filter(Boolean)
          .join(" "),
      )
      .join(" / ");
  }
  // Without a class there is nothing to print here; the level is carried by its
  // own field, so a bare "1" would just look like a stray mark.
  if (!c.class.trim()) return "";
  return [c.class, c.subclass ? `(${c.subclass})` : null, String(c.level)].filter(Boolean).join(" ");
}

function drawMasthead(ctx: Ctx, c: Character, campaignName?: string): number {
  const { page, fonts } = ctx;
  const top = PAGE_H - MARGIN;

  const nameWidth = 356;
  valueField(ctx, "CharacterName", c.name, {
    x: MARGIN,
    top,
    width: nameWidth,
    height: 26,
    // Long names shrink to fit rather than being clipped by the field box.
    size: fitFontSize(fonts.display, c.name, nameWidth - 6, 19, 11),
    font: fonts.display,
    color: ACCENT_DEEP,
  });

  // The subtitle shares the line with the name, so it gets whatever is left —
  // the campaign name matters more here than the boilerplate.
  const subtitleWidth = PAGE_W - MARGIN - (MARGIN + nameWidth + 10);
  const full = [campaignName, "Sanctum character sheet"].filter(Boolean).join(" · ");
  const subtitle =
    fonts.body.widthOfTextAtSize(pdfText(full), 7) <= subtitleWidth
      ? full
      : ellipsize(fonts.body, campaignName ?? full, 7, subtitleWidth);
  drawTextAt(
    page,
    subtitle,
    PAGE_W - MARGIN - fonts.body.widthOfTextAtSize(pdfText(subtitle), 7),
    top - 4,
    7,
    fonts.body,
    MUTED,
  );

  const levelBox = { x: PAGE_W - MARGIN - 150, top: top - 12, w: 150, h: 22 };
  drawBox(page, levelBox.x, levelBox.top, levelBox.w, levelBox.h, TINT);
  drawTextAt(page, "LEVEL", levelBox.x + 6, levelBox.top - 6, 6, fonts.bold, MUTED);
  valueField(ctx, "CharacterLevel", String(c.level), {
    x: levelBox.x + 34,
    top: levelBox.top - 3,
    width: 26,
    height: 16,
    size: 12,
    font: fonts.bold,
  });
  drawTextAt(page, "XP", levelBox.x + 70, levelBox.top - 6, 6, fonts.bold, MUTED);
  valueField(ctx, "XP", String(c.experiencePoints), {
    x: levelBox.x + 84,
    top: levelBox.top - 4,
    width: 60,
    height: 14,
    size: 9,
  });

  // Class / race / background / alignment across the width, sheet-style.
  const slotTop = top - 38;
  const slots: { label: string; field: string; value: string }[] = [
    { label: "Class & Level", field: "ClassLevel", value: classLevelText(c) },
    { label: "Race", field: "Race ", value: c.race },
    { label: "Background", field: "Background", value: c.background },
    { label: "Alignment", field: "Alignment", value: c.alignment },
  ];
  const slotW = (CONTENT_W - 24) / 4;
  slots.forEach((slot, i) => {
    const x = MARGIN + i * (slotW + 8);
    drawTextAt(page, slot.label.toUpperCase(), x, slotTop, 6, fonts.bold, MUTED);
    valueField(ctx, slot.field, slot.value, {
      x,
      top: slotTop - 8,
      width: slotW,
      height: 13,
      size: 9,
    });
    page.drawLine({
      start: { x, y: slotTop - 22 },
      end: { x: x + slotW, y: slotTop - 22 },
      thickness: 0.7,
      color: RULE,
    });
  });

  return slotTop - 30;
}

/* -------------------------------------------------------------------------- */
/*  Page 1 stat strips                                                         */
/* -------------------------------------------------------------------------- */

function drawTile(
  ctx: Ctx,
  opts: { x: number; top: number; width: number; label: string; field: string; value: string },
) {
  const height = 40;
  drawBox(ctx.page, opts.x, opts.top, opts.width, height);
  drawCentered(ctx.page, opts.label.toUpperCase(), opts.x + opts.width / 2, opts.top - 4, 6, ctx.fonts.bold, MUTED);
  valueField(ctx, opts.field, opts.value, {
    x: opts.x + 2,
    top: opts.top - 13,
    width: opts.width - 4,
    height: 23,
    size: 15,
    align: TextAlignment.Center,
    font: ctx.fonts.bold,
  });
}

function drawVitals(ctx: Ctx, c: Character, top: number): number {
  const tiles = [
    { label: "Armor Class", field: "AC", value: String(c.armorClass) },
    { label: "Initiative", field: "Initiative", value: formatModifier(c.initiativeBonus) },
    { label: "Speed", field: "Speed", value: `${c.speed} ft.` },
    { label: "Proficiency", field: "ProfBonus", value: formatModifier(c.proficiencyBonus) },
    { label: "Passive Perception", field: "Passive", value: String(c.passivePerception) },
  ];
  const width = (CONTENT_W - 8 * (tiles.length - 1)) / tiles.length;
  tiles.forEach((tile, i) => {
    drawTile(ctx, { ...tile, x: MARGIN + i * (width + 8), top, width });
  });
  return top - 40 - 8;
}

/** Hit points, hit dice and death saves — one 44pt band. */
function drawVitalsSecondRow(ctx: Ctx, c: Character, top: number): number {
  const { page, fonts } = ctx;
  const height = 44;

  const hpW = 244;
  drawBox(page, MARGIN, top, hpW, height);
  drawTextAt(page, "HIT POINTS", MARGIN + 6, top - 4, 6, fonts.bold, MUTED);
  const cells = [
    { label: "Current", field: "HPCurrent", value: String(c.hpCurrent) },
    { label: "Maximum", field: "HPMax", value: String(c.hpMax) },
    { label: "Temporary", field: "HPTemp", value: String(c.hpTemp) },
  ];
  const cellW = (hpW - 16) / 3;
  cells.forEach((cell, i) => {
    const x = MARGIN + 8 + i * cellW;
    drawCentered(page, cell.label.toUpperCase(), x + cellW / 2, top - 15, 5.6, fonts.body, MUTED);
    valueField(ctx, cell.field, cell.value, {
      x,
      top: top - 22,
      width: cellW,
      height: 18,
      size: 13,
      align: TextAlignment.Center,
      font: fonts.bold,
    });
  });

  const hdX = MARGIN + hpW + 10;
  const hdW = 140;
  drawBox(page, hdX, top, hdW, height);
  drawTextAt(page, "HIT DICE", hdX + 6, top - 4, 6, fonts.bold, MUTED);
  const hitDie = hitDieForClass(c.class);
  const hdCells = [
    { label: "Remaining", field: "HD", value: String(Math.max(0, c.hitDiceTotal - c.hitDiceUsed)) },
    { label: "Total", field: "HDTotal", value: c.hitDiceTotal > 0 ? `${c.hitDiceTotal}d${hitDie}` : "" },
  ];
  const hdCellW = (hdW - 16) / 2;
  hdCells.forEach((cell, i) => {
    const x = hdX + 8 + i * hdCellW;
    drawCentered(page, cell.label.toUpperCase(), x + hdCellW / 2, top - 15, 5.6, fonts.body, MUTED);
    valueField(ctx, cell.field, cell.value, {
      x,
      top: top - 22,
      width: hdCellW,
      height: 18,
      size: 12,
      align: TextAlignment.Center,
      font: fonts.bold,
    });
  });

  const dsX = hdX + hdW + 10;
  const dsW = PAGE_W - MARGIN - dsX;
  drawBox(page, dsX, top, dsW, height);
  drawTextAt(page, "DEATH SAVES", dsX + 6, top - 4, 6, fonts.bold, MUTED);
  const rows: { label: string; filled: number; color: RGB }[] = [
    { label: "Successes", filled: c.deathSaveSuccesses, color: rgb(0.15, 0.5, 0.28) },
    { label: "Failures", filled: c.deathSaveFailures, color: rgb(0.66, 0.16, 0.16) },
  ];
  rows.forEach((row, i) => {
    const rowTop = top - 15 - i * 13;
    drawTextAt(page, row.label.toUpperCase(), dsX + 8, rowTop, 5.6, fonts.body, MUTED);
    for (let pip = 0; pip < 3; pip++) {
      page.drawCircle({
        x: dsX + 62 + pip * 13,
        y: rowTop - 3,
        size: 3.2,
        color: pip < row.filled ? row.color : PAPER,
        borderColor: pip < row.filled ? row.color : MUTED,
        borderWidth: 0.6,
      });
    }
  });

  return top - height - 10;
}

/* -------------------------------------------------------------------------- */
/*  Panel builders                                                             */
/* -------------------------------------------------------------------------- */

function abilityPanel(f: Fonts, scores: Record<AbilityKey, number>): Panel {
  return {
    title: "Ability Scores",
    units: ABILITIES.map((ability) => ({
      h: 27,
      draw: (ctx, x, top) => {
        drawBox(ctx.page, x, top, INNER_W, 25);
        ctx.page.drawRectangle({
          x,
          y: top - 25,
          width: 30,
          height: 25,
          color: TINT,
          borderColor: RULE,
          borderWidth: 0.6,
        });
        valueField(ctx, ability.short, String(scores[ability.key]), {
          x: x + 1,
          top: top - 3,
          width: 28,
          height: 19,
          size: 13,
          align: TextAlignment.Center,
          font: ctx.fonts.bold,
        });
        drawTextAt(ctx.page, ability.label.toUpperCase(), x + 36, top - 8.5, 7, f.bold, INK);
        valueField(ctx, `${ability.short}mod`, formatModifier(abilityModifier(scores[ability.key])), {
          x: x + INNER_W - 44,
          top: top - 4,
          width: 40,
          height: 17,
          size: 11,
          align: TextAlignment.Right,
          font: ctx.fonts.bold,
        });
      },
    })),
  };
}

function savesPanel(f: Fonts, c: Character, scores: Record<AbilityKey, number>): Panel {
  return {
    title: "Saving Throws",
    units: ABILITIES.map((ability) => {
      const proficient = c.savingThrowProficiencies.includes(ability.key);
      return proficiencyUnit(f, {
        field: `ST ${ability.label}`,
        bonus: savingThrowBonus(scores, ability.key, proficient, c.proficiencyBonus),
        label: ability.label,
        proficient,
      });
    }),
  };
}

// The official sheet's field names for the two skills whose labels don't map
// cleanly; the importer looks for exactly these.
const SKILL_FIELD_NAMES: Record<string, string> = {
  animal_handling: "Animal",
  sleight_of_hand: "SleightofHand",
};

function skillsPanel(f: Fonts, c: Character, scores: Record<AbilityKey, number>): Panel {
  return {
    title: "Skills",
    units: SKILLS.map((skill) => {
      const proficient = c.skillProficiencies.includes(skill.key);
      const ability = ABILITIES.find((a) => a.key === skill.ability);
      return proficiencyUnit(f, {
        field: SKILL_FIELD_NAMES[skill.key] ?? skill.label,
        bonus: skillBonus(scores, skill.key, proficient, c.proficiencyBonus),
        label: skill.label,
        sub: ability ? `(${ability.short})` : undefined,
        proficient,
      });
    }),
  };
}

function proficienciesPanel(f: Fonts, c: Character): Panel | null {
  const languages = c.languages.join(", ");
  if (!languages) return null;
  return { title: "Languages", units: paragraphUnits(f.body, languages, 7.5) };
}

function sensesPanel(f: Fonts, c: Character): Panel | null {
  if (c.darkvision <= 0) return null;
  return { title: "Senses", units: paragraphUnits(f.body, `Darkvision ${c.darkvision} ft.`, 7.5) };
}

function defencesPanel(f: Fonts, c: Character): Panel | null {
  const units = [
    ...labelledUnits(f, "Resistances", c.resistances.join(", ")),
    ...labelledUnits(f, "Immunities", c.immunities.join(", ")),
    ...labelledUnits(f, "Vulnerabilities", c.vulnerabilities.join(", ")),
  ];
  return units.length > 0 ? { title: "Defences", units } : null;
}

function conditionsPanel(f: Fonts, c: Character): Panel | null {
  const parts = [...c.conditions];
  if (c.exhaustionLevel > 0) parts.push(`Exhaustion ${c.exhaustionLevel}`);
  if (parts.length === 0) return null;
  return {
    title: "Conditions",
    units: paragraphUnits(f.body, parts.join(", "), 7.5, rgb(0.62, 0.35, 0.05)),
  };
}

const COIN_FIELDS: { key: keyof Currency; label: string; field: string }[] = [
  { key: "cp", label: "CP", field: "CP" },
  { key: "sp", label: "SP", field: "SP" },
  { key: "ep", label: "EP", field: "EP" },
  { key: "gp", label: "GP", field: "GP" },
  { key: "pp", label: "PP", field: "PP" },
];

function currencyPanel(currency: Currency): Panel {
  const cellW = (INNER_W - 4 * 2) / 5;
  return {
    title: "Currency",
    units: [
      {
        h: 28,
        draw: (ctx, x, top) => {
          COIN_FIELDS.forEach((coin, i) => {
            const cellX = x + i * (cellW + 2);
            drawBox(ctx.page, cellX, top, cellW, 26);
            drawCentered(ctx.page, coin.label, cellX + cellW / 2, top - 3, 5.8, ctx.fonts.bold, MUTED);
            valueField(ctx, coin.field, String(currency?.[coin.key] ?? 0), {
              x: cellX,
              top: top - 10,
              width: cellW,
              height: 15,
              size: 8.5,
              align: TextAlignment.Center,
              font: ctx.fonts.bold,
            });
          });
        },
      },
    ],
  };
}

function multiclassPanel(f: Fonts, c: Character): Panel | null {
  if (c.multiclassInfo.length === 0) return null;
  const units = c.multiclassInfo.flatMap((entry) =>
    paragraphUnits(
      f.body,
      `${entry.className}${entry.subclass ? ` (${entry.subclass})` : ""} — level ${entry.level}`,
      7.5,
    ),
  );
  return { title: "Multiclass", units };
}

function characteristicsPanel(f: Fonts, c: Character): Panel | null {
  const units = [
    ...labelledUnits(f, "Personality Traits", c.personalityTraits),
    ...labelledUnits(f, "Ideals", c.ideals),
    ...labelledUnits(f, "Bonds", c.bonds),
    ...labelledUnits(f, "Flaws", c.flaws),
  ];
  return units.length > 0 ? { title: "Characteristics", units } : null;
}

function backstoryPanel(f: Fonts, c: Character): Panel | null {
  if (!c.backstory.trim()) return null;
  return { title: "Backstory", units: paragraphUnits(f.body, c.backstory, 7.2) };
}

/** Shared shape for features, feats and magic items: a bold name then prose. */
function entryUnits(
  f: Fonts,
  entries: { name: string; meta?: string; description: string }[],
): Unit[] {
  return entries.flatMap((entry, i) => {
    const units: Unit[] = [];
    if (i > 0) units.push(spacerUnit(4));
    units.push(...paragraphUnits(f.bold, entry.name, 7.8));
    if (entry.meta) units.push(...paragraphUnits(f.italic, entry.meta, 6.5, MUTED));
    if (entry.description) units.push(...paragraphUnits(f.body, entry.description, 7.2));
    return units;
  });
}

function featuresPanel(f: Fonts, c: Character): Panel | null {
  if (c.featuresAndTraits.length === 0) return null;
  return {
    title: "Features & Traits",
    units: entryUnits(
      f,
      c.featuresAndTraits.map((feature) => ({
        name: feature.name,
        meta: feature.source,
        description: feature.description,
      })),
    ),
  };
}

function featsPanel(f: Fonts, c: Character): Panel | null {
  if (c.feats.length === 0) return null;
  return {
    title: "Feats",
    units: entryUnits(f, c.feats.map((feat) => ({ name: feat.name, description: feat.description }))),
  };
}

function inventoryLabel(item: InventoryItem): string {
  const quantity = item.quantity > 1 ? `${item.quantity} x ` : "";
  const weight = item.weight > 0 ? ` (${item.weight} lb)` : "";
  return `${quantity}${item.name}${weight}`;
}

function equipmentPanel(f: Fonts, inventory: InventoryItem[]): Panel | null {
  if (inventory.length === 0) return null;
  const units = inventory.flatMap((item) => {
    const lines = wrapText(inventoryLabel(item), f.body, 7.5, INNER_W - 10);
    return lines.map((line, i) => ({
      h: 10,
      draw: (ctx: Ctx, x: number, top: number) => {
        if (i === 0) {
          ctx.page.drawCircle({
            x: x + 3.4,
            y: top - 4.8,
            size: 2.2,
            color: item.isEquipped ? ACCENT : PAPER,
            borderColor: item.isEquipped ? ACCENT : MUTED,
            borderWidth: 0.6,
          });
        }
        drawTextAt(ctx.page, line, x + 10, top - 1, 7.5, f.body, INK);
      },
    }));
  });

  const totalWeight = inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  if (totalWeight > 0) {
    units.push(spacerUnit(3));
    units.push(
      ...paragraphUnits(f.italic, `Total carried: ${totalWeight.toFixed(1)} lb`, 6.8, MUTED),
    );
  }
  units.push(spacerUnit(2));
  units.push(...paragraphUnits(f.italic, "A filled dot marks equipped gear.", 6.2, MUTED));
  return { title: "Equipment", units };
}

function magicItemsPanel(f: Fonts, items: MagicItem[]): Panel | null {
  if (items.length === 0) return null;
  return {
    title: "Magic Items",
    units: entryUnits(
      f,
      items.map((item) => ({
        name: item.name,
        meta: [
          item.rarity,
          item.itemType,
          item.requiresAttunement ? (item.isAttuned ? "attuned" : "needs attunement") : null,
          item.chargesMax ? `${item.charges ?? 0}/${item.chargesMax} charges` : null,
          item.isCursed ? "cursed" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        description: truncate(item.description, 600),
      })),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/*  Spells                                                                     */
/* -------------------------------------------------------------------------- */

const SPELL_LEVEL_LABELS = [
  "Cantrips",
  "1st Level",
  "2nd Level",
  "3rd Level",
  "4th Level",
  "5th Level",
  "6th Level",
  "7th Level",
  "8th Level",
  "9th Level",
];

/**
 * Slot totals for all nine levels, always. The importer maps slot fields to
 * levels by their order on the sheet, so the empty levels have to be printed
 * too or a caster with only 3rd-level slots reads back as a 1st-level one.
 */
function spellSlotPanel(f: Fonts, slots: SpellSlot[]): Panel {
  const byLevel = new Map(slots.map((slot) => [slot.slotLevel, slot]));
  const units: Unit[] = [
    {
      h: 10,
      draw: (ctx, x, top) => {
        drawTextAt(ctx.page, "LEVEL", x + 2, top - 1, 5.8, f.bold, MUTED);
        drawCentered(ctx.page, "TOTAL", x + 72, top - 1, 5.8, f.bold, MUTED);
        drawCentered(ctx.page, "REMAINING", x + 120, top - 1, 5.8, f.bold, MUTED);
      },
    },
  ];

  for (let level = 1; level <= 9; level++) {
    const slot = byLevel.get(level);
    const total = slot?.total ?? 0;
    const remaining = Math.max(0, total - (slot?.used ?? 0));
    units.push({
      h: 11.5,
      draw: (ctx, x, top) => {
        drawTextAt(ctx.page, SPELL_LEVEL_LABELS[level], x + 2, top - 1.5, 7.2, f.body, total > 0 ? INK : MUTED);
        valueField(ctx, `SlotsTotal ${level}`, String(total), {
          x: x + 60,
          top: top - 0.5,
          width: 24,
          height: 10,
          size: 7.5,
          align: TextAlignment.Center,
          font: f.bold,
        });
        valueField(ctx, `SlotsRemaining ${level}`, String(remaining), {
          x: x + 108,
          top: top - 0.5,
          width: 24,
          height: 10,
          size: 7.5,
          align: TextAlignment.Center,
          font: f.bold,
        });
      },
    });
  }
  return { title: "Spell Slots", units };
}

function spellPanels(f: Fonts, spells: Spell[]): Panel[] {
  const byLevel = new Map<number, Spell[]>();
  for (const spell of spells) {
    const level = Math.min(9, Math.max(0, spell.level));
    const bucket = byLevel.get(level);
    if (bucket) bucket.push(spell);
    else byLevel.set(level, [spell]);
  }

  const panels: Panel[] = [];
  for (let level = 0; level <= 9; level++) {
    const bucket = byLevel.get(level);
    if (!bucket || bucket.length === 0) continue;
    bucket.sort((a, b) => a.name.localeCompare(b.name));
    const ids = spellFieldIds(level);

    const units = bucket.flatMap((spell, index) => {
      const meta = [
        spell.school,
        spell.castingTime,
        spell.range,
        spell.duration,
        spell.isConcentration ? "concentration" : null,
        spell.components,
      ]
        .filter(Boolean)
        .join(" · ");
      // Beyond the ids the printed sheet has for this level, the name is drawn
      // as plain text: still readable, just not re-importable.
      const fieldName = ids[index] !== undefined ? `Spells ${ids[index]}` : null;

      const rows: Unit[] = [
        {
          h: 11,
          draw: (ctx, x, top) => {
            ctx.page.drawCircle({
              x: x + 3.4,
              y: top - 5,
              size: 2.2,
              color: spell.isPrepared ? ACCENT : PAPER,
              borderColor: spell.isPrepared ? ACCENT : MUTED,
              borderWidth: 0.6,
            });
            if (fieldName) {
              valueField(ctx, fieldName, spell.name, {
                x: x + 9,
                top,
                width: INNER_W - 9,
                height: 11,
                size: 8,
              });
            } else {
              drawTextAt(ctx.page, truncate(spell.name, 44), x + 9, top - 1.5, 8, f.body, INK);
            }
          },
        },
      ];
      if (meta) rows.push(...paragraphUnits(f.italic, truncate(meta, 120), 6.2, MUTED, 9));
      rows.push(spacerUnit(2.5));
      return rows;
    });

    panels.push({ title: SPELL_LEVEL_LABELS[level], units });
  }

  if (panels.length > 0) {
    panels[panels.length - 1].units.push(spacerUnit(3));
    panels[panels.length - 1].units.push(
      ...paragraphUnits(f.italic, "A filled dot marks a prepared spell.", 6.2, MUTED),
    );
  }
  return panels;
}

/* -------------------------------------------------------------------------- */
/*  Round-trip payload                                                         */
/* -------------------------------------------------------------------------- */

/** Feature blocks in the "Name\nDescription" shape the importer splits on. */
function featuresBlob(c: Character): string {
  return [
    ...c.featuresAndTraits.map((feature) =>
      feature.description ? `${feature.name}\n${feature.description}` : feature.name,
    ),
    ...c.feats.map((feat) => (feat.description ? `${feat.name}\n${feat.description}` : feat.name)),
  ].join("\n\n");
}

function writeRoundTripFields(ctx: Ctx, data: CharacterSheetData) {
  const { character: c, inventory, magicItems } = data;
  hiddenField(ctx, "ProficienciesLang", c.languages.join(", "));
  hiddenField(ctx, "Features and Traits", featuresBlob(c));
  hiddenField(ctx, "Equipment", inventory.map(inventoryLabel).join("\n"));
  hiddenField(ctx, "PersonalityTraits ", c.personalityTraits);
  hiddenField(ctx, "Ideals", c.ideals);
  hiddenField(ctx, "Bonds", c.bonds);
  hiddenField(ctx, "Flaws", c.flaws);
  hiddenField(ctx, "Treasure", magicItems.map((item) => item.name).join("\n"));
  hiddenField(ctx, "Backstory", c.backstory);
  // Not a WotC field — notes used to ride in "Backstory", which now carries the
  // real backstory, so they get their own slot for the round trip.
  hiddenField(ctx, "SanctumNotes", c.notes);
  if (c.darkvision > 0) hiddenField(ctx, "Darkvision", String(c.darkvision));
}

/* -------------------------------------------------------------------------- */
/*  Entry point                                                                */
/* -------------------------------------------------------------------------- */

function drawFooters(pdf: PDFDocument, fonts: Fonts, label: string) {
  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    const y = MARGIN;
    page.drawLine({
      start: { x: MARGIN, y: y + 12 },
      end: { x: PAGE_W - MARGIN, y: y + 12 },
      thickness: 0.6,
      color: RULE,
    });
    drawTextAt(page, label, MARGIN, y + 8, 6.5, fonts.body, MUTED);
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    const width = fonts.body.widthOfTextAtSize(pageLabel, 6.5);
    drawTextAt(page, pageLabel, PAGE_W - MARGIN - width, y + 8, 6.5, fonts.body, MUTED);
  });
}

/** Render a character (and everything they carry) to a printable PDF sheet. */
export async function buildCharacterSheetPdf(data: CharacterSheetData): Promise<Uint8Array> {
  const { character: c } = data;
  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    display: await pdf.embedFont(StandardFonts.TimesRomanBold),
  };

  pdf.setTitle(`${c.name} — character sheet`);
  pdf.setAuthor("Sanctum");
  pdf.setCreator("Sanctum");
  pdf.setProducer("Sanctum");
  pdf.setCreationDate(new Date());

  const firstPage = pdf.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    pdf,
    form: pdf.getForm(),
    fonts,
    page: firstPage,
    firstPage,
    col: 0,
    y: 0,
    colTop: 0,
    colUsed: 0,
    budget: 0,
    remaining: 0,
    running: c.name,
    names: new Set(),
  };

  let top = drawMasthead(ctx, c, data.campaignName);
  top = drawVitals(ctx, c, top);
  top = drawVitalsSecondRow(ctx, c, top);

  const scores: Record<AbilityKey, number> = {
    str: c.str,
    dex: c.dex,
    con: c.con,
    int: c.int,
    wis: c.wis,
    cha: c.cha,
  };

  // An all-zero slot table is just noise, but once there is one slot every
  // level has to be printed — see `spellSlotPanel`.
  const hasSlots = data.spellSlots.some((slot) => slot.total > 0);
  const panels: (Panel | null)[] = [
    abilityPanel(fonts, scores),
    savesPanel(fonts, c, scores),
    skillsPanel(fonts, c, scores),
    proficienciesPanel(fonts, c),
    sensesPanel(fonts, c),
    defencesPanel(fonts, c),
    conditionsPanel(fonts, c),
    currencyPanel(c.currency),
    multiclassPanel(fonts, c),
    characteristicsPanel(fonts, c),
    backstoryPanel(fonts, c),
    featuresPanel(fonts, c),
    featsPanel(fonts, c),
    equipmentPanel(fonts, data.inventory),
    magicItemsPanel(fonts, data.magicItems),
    ...(hasSlots ? [spellSlotPanel(fonts, data.spellSlots)] : []),
    ...spellPanels(fonts, data.spells),
    c.notes.trim() ? { title: "Notes", units: paragraphUnits(fonts.body, c.notes, 7.2) } : null,
  ];

  const present = panels.filter((panel): panel is Panel => panel !== null);
  ctx.colTop = top;
  ctx.y = top;
  ctx.col = 0;
  ctx.colUsed = 0;
  ctx.remaining = present.reduce((sum, panel) => sum + panelHeight(panel), 0);
  setColumnBudget(ctx);

  for (const panel of present) placePanel(ctx, panel);

  writeRoundTripFields(ctx, data);
  drawFooters(pdf, fonts, [c.name, data.campaignName, "Exported from Sanctum"].filter(Boolean).join(" · "));

  // Every visible field already has the appearance we drew it with; letting
  // pdf-lib regenerate them on save would undo that (and re-run the expensive
  // layout for the hidden round-trip fields).
  return pdf.save({ updateFieldAppearances: false });
}

/** A safe, recognisable download name: "seraphina-vale-character-sheet.pdf". */
export function sheetFileName(name: string): string {
  const slug = pdfText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "character"}-character-sheet.pdf`;
}
