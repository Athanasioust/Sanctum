/**
 * Diagnose a character sheet PDF that won't import.
 *
 *   node scripts/inspect-sheet.mjs "C:\\path\\to\\sheet.pdf"
 *
 * Prints what pdf-lib can actually see inside the file — whether it has an
 * AcroForm, whether it's XFA or encrypted, and every field name plus its value.
 * The importer reads exactly these fields, so if nothing shows up here, nothing
 * will import.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFName, PDFDict, PDFTextField, PDFCheckBox } from "pdf-lib";

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/inspect-sheet.mjs "<path to sheet.pdf>"');
  process.exit(2);
}

const bytes = await fs.readFile(path.resolve(target));
console.log(`File: ${path.basename(target)} (${(bytes.length / 1024).toFixed(0)} KB)\n`);

let pdf;
try {
  pdf = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
} catch (err) {
  console.error(`✗ pdf-lib could not parse this file: ${err.message}`);
  console.error("  The importer will report it as an unreadable PDF.");
  process.exit(1);
}

console.log(`Pages: ${pdf.getPageCount()}`);
if (pdf.isEncrypted) {
  console.log("⚠ This PDF is encrypted. Field values are often unreadable — re-save it without a password.");
}

// XFA forms (LiveCycle) store their data separately; pdf-lib only reads AcroForm.
const acroForm = pdf.catalog.get(PDFName.of("AcroForm"));
const acroDict = acroForm instanceof PDFDict ? acroForm : undefined;
if (acroDict?.get(PDFName.of("XFA"))) {
  console.log("⚠ This is an XFA form. Sanctum reads AcroForm fields only.");
  console.log('  Fix: open in Acrobat Reader and "Print to PDF" will NOT help (that flattens it).');
  console.log("  Instead, re-fill the official AcroForm sheet, or use a different fillable sheet.");
}

const fields = pdf.getForm().getFields();
console.log(`Form fields: ${fields.length}\n`);

if (fields.length === 0) {
  console.log("✗ No form fields at all — this is a flat/printed/scanned sheet.");
  console.log("  Sanctum does not OCR page images, so there is nothing for it to read.");
  console.log("  Use a sheet where you can click into the boxes and type.");
  process.exit(1);
}

let filled = 0;
const rows = [];
for (const field of fields) {
  const name = field.getName();
  let value = "";
  try {
    if (field instanceof PDFTextField) value = field.getText() ?? "";
    else if (field instanceof PDFCheckBox) value = field.isChecked() ? "[x]" : "[ ]";
    else if (typeof field.getSelected === "function") {
      const selected = field.getSelected();
      value = Array.isArray(selected) ? selected.join(", ") : (selected ?? "");
    }
  } catch (err) {
    value = `<unreadable: ${err.message}>`;
  }
  if (value && value !== "[ ]") filled++;
  rows.push([name, String(value).replace(/\s+/g, " ").slice(0, 60)]);
}

const width = Math.min(40, Math.max(...rows.map(([n]) => n.length)));
for (const [name, value] of rows) {
  console.log(`  ${name.padEnd(width)}  ${value}`);
}

console.log(`\n${filled} of ${fields.length} fields have a value.`);
if (filled === 0) {
  console.log("✗ The form exists but is empty — the sheet was never filled in, or the");
  console.log("  values were flattened away when it was exported.");
  process.exit(1);
}
console.log("✓ There is data here. If the import still misses things, the field NAMES");
console.log("  above differ from the official sheet's — paste this list back and the");
console.log("  importer's alias table can be extended to match.");
