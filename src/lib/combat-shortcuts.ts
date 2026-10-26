/**
 * The combat tracker's keyboard shortcuts — listed once here so the "?"
 * cheat-sheet and the rules reference never disagree with what the keys do.
 */
export const COMBAT_SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["Space", "→"], action: "Next turn" },
  { keys: ["←"], action: "Previous turn" },
  { keys: ["↑", "k"], action: "Select the previous combatant" },
  { keys: ["↓", "j"], action: "Select the next combatant" },
  { keys: ["+"], action: "Heal the selected combatant 1 HP (hold for 5 at a time)" },
  { keys: ["-"], action: "Damage the selected combatant 1 HP (hold for 5 at a time)" },
  { keys: ["Esc"], action: "Clear the selection (back to whoever's turn it is)" },
  { keys: ["d"], action: "Open the dice roller" },
  { keys: ["?"], action: "Show these shortcuts" },
];

/**
 * True when a key press belongs to whatever has focus rather than to the
 * tracker: typing in a field, or operating a focused control (Space on a
 * button presses that button). Keeps the shortcuts from ever stealing input
 * or trapping keyboard users.
 */
export function keyBelongsToFocus(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  const el = event.target as HTMLElement | null;
  if (!el || el === document.body) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // Focus inside an open dialog, menu or listbox: the keys are theirs.
  if (el.closest('[role="dialog"], [role="menu"], [role="listbox"], [role="alertdialog"]')) {
    return true;
  }
  // A focused button, link or slider gets Space/arrows; letters still work.
  const interactive = el.closest('button, a[href], [role="button"], [role="slider"], [role="tab"]');
  if (interactive && [" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
    return true;
  }
  return false;
}
