import "server-only";
import fs from "node:fs";
import path from "node:path";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  battleMaps,
  characters,
  clocks,
  combatParticipants,
  encounters,
  handouts,
  type BattleMap,
  type CombatParticipant,
  type MapAnnotation,
} from "@/db/schema";
import { fogForGrid, resolveTokenImages } from "@/lib/battle-map";
import {
  annotationVisibleToPlayers,
  battleFogKey,
  battlePlayerImageName,
  toPlayerToken,
  visiblePlayerTokens,
} from "@/lib/battle-map-player";
import { keepGroupsTogether } from "@/lib/combat-turns";
import { readLanConfig } from "@/lib/lan";
import { UPLOADS_DIR } from "@/lib/paths";
import { portraitsFor } from "@/lib/portraits";
import type {
  HealthBand,
  PlayerBattleMap,
  PlayerCombatant,
  PlayerScreenState,
} from "@/lib/screen/types";

/**
 * The player view's whole state, computed on the server.
 *
 * This mirrors the Atlas player payload (`src/lib/atlas/server.ts`): the
 * filtering happens here, and what isn't for players is left out of the
 * response entirely rather than sent and hidden in the browser. Every field
 * is copied across by name into the DTOs in `./types`, so a column added to
 * a table later doesn't leak by default.
 *
 * Used by both the server-rendered `/screen/[id]` page and the
 * `/api/screen/state` poll, so the two can never disagree.
 */
export async function loadPlayerScreenState(campaignId: number): Promise<PlayerScreenState> {
  const [party, revealedHandouts, revealedMaps, active, revealedClocks] = await Promise.all([
    db
      .select({
        id: characters.id,
        name: characters.name,
        armorClass: characters.armorClass,
        hpCurrent: characters.hpCurrent,
        hpMax: characters.hpMax,
        hpTemp: characters.hpTemp,
      })
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .orderBy(asc(characters.name)),
    db
      .select({ id: handouts.id, title: handouts.title, content: handouts.content, imageUrl: handouts.imageUrl })
      .from(handouts)
      .where(and(eq(handouts.campaignId, campaignId), eq(handouts.isRevealed, true)))
      .orderBy(asc(handouts.sortOrder)),
    db
      .select()
      .from(battleMaps)
      .where(and(eq(battleMaps.campaignId, campaignId), eq(battleMaps.revealToPlayers, true)))
      // Most recently touched map wins if the DM left more than one flagged.
      .orderBy(desc(battleMaps.updatedAt))
      .limit(1),
    db
      .select()
      .from(encounters)
      .where(
        and(
          eq(encounters.campaignId, campaignId),
          eq(encounters.status, "active"),
          eq(encounters.isTemplate, false),
        ),
      )
      .orderBy(desc(encounters.createdAt))
      .limit(1),
    db
      .select({
        id: clocks.id,
        name: clocks.name,
        segments: clocks.segments,
        filled: clocks.filled,
        color: clocks.color,
      })
      .from(clocks)
      .where(and(eq(clocks.campaignId, campaignId), eq(clocks.revealToPlayers, true)))
      .orderBy(asc(clocks.createdAt)),
  ]);

  const encounter = active[0] ?? null;
  const participants = encounter
    ? await db
        .select()
        .from(combatParticipants)
        .where(eq(combatParticipants.encounterId, encounter.id))
        .orderBy(asc(combatParticipants.turnOrder))
    : [];

  const map = revealedMaps[0] ?? null;
  const playerMap = map ? toPlayerBattleMap(map) : null;

  // Token art follows the encounter the shown map is linked to, and only for
  // tokens players can see.
  let tokenArt: Record<string, string> = {};
  if (map && playerMap && playerMap.tokens.length > 0) {
    const artParticipants =
      map.encounterId && map.encounterId !== encounter?.id
        ? await db
            .select({
              id: combatParticipants.id,
              entityType: combatParticipants.entityType,
              entityId: combatParticipants.entityId,
            })
            .from(combatParticipants)
            .where(eq(combatParticipants.encounterId, map.encounterId))
        : participants;
    const visibleIds = new Set(playerMap.tokens.map((t) => t.id));
    const visible = map.tokens.filter((t) => visibleIds.has(t.id));
    tokenArt = resolveTokenImages(visible, artParticipants, await portraitsFor(artParticipants));
  }

  const lan = readLanConfig();

  return {
    active: encounter !== null,
    encounterName: encounter?.name ?? "",
    round: encounter?.roundNumber ?? 1,
    turnIndex: encounter?.currentTurnIndex ?? 0,
    lairActive: encounter?.lairTurnActive ?? false,
    participants: keepGroupsTogether(participants).map(toPlayerCombatant),
    party,
    handouts: revealedHandouts,
    battleMap: playerMap,
    tokenArt,
    playerMoves: lan.enabled && lan.allowPlayerTokenMoves,
    clocks: revealedClocks,
  };
}

export function healthBand(current: number, max: number): HealthBand {
  if (current <= 0) return "down";
  return max > 0 && current / max <= 0.5 ? "bloodied" : "healthy";
}

function toPlayerCombatant(p: CombatParticipant): PlayerCombatant {
  const isPc = p.entityType === "character";
  return {
    id: p.id,
    name: p.name,
    initiativeTotal: p.initiativeTotal,
    hasLairAction: p.hasLairAction,
    groupId: p.groupId,
    groupLabel: p.groupLabel,
    isPc,
    hp: isPc ? { current: p.hpCurrent, max: p.hpMax } : null,
    band: healthBand(p.hpCurrent, p.hpMax),
  };
}

/**
 * The burned player image for the map's current fog, if the DM's editor has
 * rendered one. Fail closed: no matching render means no image at all.
 */
function burnedImageUrl(map: BattleMap): string | null {
  const name = battlePlayerImageName(map.id, battleFogKey(map));
  return fs.existsSync(path.join(UPLOADS_DIR, name)) ? `/uploads/${name}` : null;
}

/** Copy an annotation field by field, so anything added to the type later stays DM-side. */
function toPlayerAnnotation(a: MapAnnotation): MapAnnotation {
  return {
    id: a.id,
    kind: a.kind,
    color: a.color,
    x: a.x,
    y: a.y,
    ...(a.rotation !== undefined ? { rotation: a.rotation } : {}),
    ...(a.sizeFt !== undefined ? { sizeFt: a.sizeFt } : {}),
    ...(a.widthFt !== undefined ? { widthFt: a.widthFt } : {}),
    ...(a.points !== undefined ? { points: a.points } : {}),
    ...(a.text !== undefined ? { text: a.text } : {}),
  };
}

export function toPlayerBattleMap(map: BattleMap): PlayerBattleMap {
  const fogOn = map.fogEnabled;
  const fog = fogOn ? fogForGrid(map.fog, map.gridCols, map.gridRows) : null;

  let imageUrl: string | null = null;
  let imagePending = false;
  if (map.imageUrl) {
    if (!fogOn) imageUrl = map.imageUrl;
    else {
      imageUrl = burnedImageUrl(map);
      imagePending = imageUrl === null;
    }
  }

  return {
    id: map.id,
    name: map.name,
    imageUrl,
    imagePending,
    gridSize: map.gridSize,
    gridCols: map.gridCols,
    gridRows: map.gridRows,
    feetPerCell: map.feetPerCell,
    diagonalRule: map.diagonalRule,
    tokens: visiblePlayerTokens(map.tokens, fog, fogOn).map(toPlayerToken),
    annotations: map.annotations
      .filter((a) => annotationVisibleToPlayers(a, fog, fogOn))
      .map(toPlayerAnnotation),
    fog,
    fogEnabled: fogOn,
  };
}
