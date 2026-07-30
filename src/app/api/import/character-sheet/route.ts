import { ApiError, apiRoute, json } from "@/lib/api";
import {
  mapSheetToCharacter,
  readSheetFields,
  NoFormFieldsError,
  PdfReadError,
} from "@/lib/pdf-character-sheet";

const MAX_BYTES = 20 * 1024 * 1024;

const FLAT_SHEET_MESSAGE =
  "This PDF has no fillable form fields, so there's nothing to read — it's a flat, printed or scanned sheet. " +
  "Sanctum doesn't read text out of page images. Open the file in a PDF viewer: if you can't click into a box " +
  "and type, it won't import. Sheets exported or printed from most character builders are flattened this way. " +
  "Use a sheet you filled in directly in a PDF reader (the official Wizards fillable sheet works).";

/**
 * Parse an uploaded 5e character sheet and return the extracted values for
 * review. Nothing is written here — the DM confirms the preview and the commit
 * route creates the character.
 */
export const POST = apiRoute(async (req) => {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    throw new ApiError("Expected a file upload", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) throw new ApiError("No file provided", 400);
  if (file.size === 0) throw new ApiError("That file is empty", 400);
  if (file.size > MAX_BYTES) throw new ApiError("PDF is too large (max 20MB)", 413);

  const looksLikePdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name ?? "");
  if (!looksLikePdf) throw new ApiError("Only PDF character sheets are supported", 415);

  const bytes = new Uint8Array(await file.arrayBuffer());

  let fields;
  try {
    fields = await readSheetFields(bytes);
  } catch (err) {
    if (err instanceof NoFormFieldsError) throw new ApiError(FLAT_SHEET_MESSAGE, 422);
    if (err instanceof PdfReadError) {
      throw new ApiError(
        "That file couldn't be read as a PDF. If it's password-protected, remove the password and try again.",
        400,
      );
    }
    throw err;
  }

  if (fields.text.size === 0) {
    throw new ApiError(
      "This sheet has form fields but they're all blank — fill the sheet in and export it again.",
      422,
    );
  }

  return json({ ...mapSheetToCharacter(fields), fileName: file.name });
});
