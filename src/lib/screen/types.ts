/**
 * What the player view is allowed to receive, as plain DTOs. These types are
 * the contract: anything not named here never leaves the server for a player
 * device. Built by `src/lib/screen/state.ts`.
 */
import type { FogData, MapAnnotation } from "@/db/schema";
import type { DiagonalRule } from "@/lib/battle-map";

/** A monster's health as players may know it — never the numbers. */
export type HealthBand = "healthy" | "bloodied" | "down";

export type PlayerCombatant = {
  id: number;
  name: string;
  initiativeTotal: number;
  hasLairAction: boolean;
  groupId: string | null;
  groupLabel: string | null;
  /** A player character: shows a real HP bar. */
  isPc: boolean;
  /** Exact HP, for player characters only. */
  hp: { current: number; max: number } | null;
  band: HealthBand;
};

export type PlayerPartyMember = {
  id: number;
  name: string;
  armorClass: number;
  hpCurrent: number;
  hpMax: number;
  hpTemp: number;
};

export type PlayerHandout = { id: number; title: string; content: string; imageUrl: string | null };

export type PlayerClock = { id: number; name: string; segments: number; filled: number; color: string };

/** A token players can see. Hidden and fogged tokens are not in the list at all. */
export type PlayerToken = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  sizeCells: number;
  /** Only on tokens the DM handed to a player. */
  playerControllable?: true;
  controllerName?: string;
};

export type PlayerBattleMap = {
  id: number;
  name: string;
  /**
   * With fog on, the fog-burned render — never the DM's original image. Null
   * while a render for the current fog isn't ready yet (`imagePending`).
   */
  imageUrl: string | null;
  imagePending: boolean;
  gridSize: number;
  gridCols: number;
  gridRows: number;
  feetPerCell: number;
  diagonalRule: DiagonalRule;
  tokens: PlayerToken[];
  /** Only templates and marks outside the fog. */
  annotations: MapAnnotation[];
  /** The revealed/hidden mask — exactly what the screen paints black anyway. */
  fog: FogData | null;
  fogEnabled: boolean;
};

export type PlayerScreenState = {
  active: boolean;
  encounterName: string;
  round: number;
  turnIndex: number;
  /** Initiative is on the lair's count-20 row rather than a creature. */
  lairActive: boolean;
  participants: PlayerCombatant[];
  party: PlayerPartyMember[];
  handouts: PlayerHandout[];
  /** The battle map the DM is currently showing, if any. */
  battleMap: PlayerBattleMap | null;
  /** Art for the map's visible tokens, by token id. */
  tokenArt: Record<string, string>;
  /** The DM lets players drag the tokens handed to them. */
  playerMoves: boolean;
  /** Progress clocks the DM has revealed. */
  clocks: PlayerClock[];
};
