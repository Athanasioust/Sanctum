/** `character:12` / `npc:40` — how a combatant points back at its stat block. */
export function portraitKey(
  entityType: string | null | undefined,
  entityId: number | null | undefined,
): string | null {
  return entityType && entityId != null ? `${entityType}:${entityId}` : null;
}
