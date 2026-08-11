/**
 * Liveness probe for the desktop shell.
 *
 * The Electron main process polls this while booting and opens the window as
 * soon as it answers, so it deliberately does no work — no database, no
 * filesystem — and replies the instant the server is listening. Waiting on a
 * real page instead would keep the window closed until that page had compiled
 * and rendered.
 */
export function GET() {
  return Response.json({ ok: true });
}
