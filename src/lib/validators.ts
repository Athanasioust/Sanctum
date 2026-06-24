import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

const optionalString = (max = 10000) =>
  z.string().max(max).optional().default("");
const stringArray = z.array(z.string()).optional().default([]);
const idArray = z.array(z.number().int()).optional().default([]);

const customCalendarConfigSchema = z
  .object({
    months: z.array(z.object({ name: z.string(), days: z.number().int().min(1) })),
    weekdays: z.array(z.string()).optional(),
    yearLabel: z.string().optional(),
    yearOne: z.number().int().optional(),
  })
  .nullable()
  .optional();

/* -------------------------------------------------------------------------- */
/*  Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalString(5000),
  setting: optionalString(200),
  inWorldCalendarType: z.enum(["real", "custom"]).optional().default("real"),
  customCalendarConfig: customCalendarConfigSchema,
  currentInWorldDate: z.string().max(120).nullable().optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

/* -------------------------------------------------------------------------- */
/*  Shared JSON object schemas                                                 */
/* -------------------------------------------------------------------------- */

const featureEntrySchema = z.object({
  name: z.string(),
  description: z.string().default(""),
  source: z.string().optional(),
});
const featEntrySchema = z.object({
  name: z.string(),
  description: z.string().default(""),
});
const multiclassEntrySchema = z.object({
  className: z.string(),
  subclass: z.string().optional(),
  level: z.number().int().min(1),
});
const statBlockActionSchema = z.object({
  name: z.string(),
  description: z.string().default(""),
});
const mapPinSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  label: z.string().default(""),
  description: z.string().optional(),
  color: z.string().optional(),
});
const gridCellSchema = z
  .object({
    type: z.string(),
    label: z.string().optional(),
    color: z.string().optional(),
  })
  .nullable();
const gridDataSchema = z
  .object({
    cols: z.number().int().min(1).max(60),
    rows: z.number().int().min(1).max(60),
    cellSize: z.number().int().min(8).max(120),
    cells: z.array(gridCellSchema),
  })
  .nullable();
const rollTableEntrySchema = z.object({
  weight: z.number().min(0),
  result: z.string(),
});
const plotPointSchema = z.object({
  text: z.string(),
  checked: z.boolean().default(false),
});

const ability = z.number().int().min(1).max(30).optional().default(10);
const nonNegInt = (def = 0) => z.number().int().min(0).optional().default(def);

/* -------------------------------------------------------------------------- */
/*  Characters                                                                 */
/* -------------------------------------------------------------------------- */

export const characterCreateSchema = z.object({
  campaignId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  race: optionalString(80),
  class: optionalString(80),
  subclass: optionalString(80),
  level: z.number().int().min(1).max(20).optional().default(1),
  background: optionalString(120),
  alignment: optionalString(60),
  experiencePoints: nonNegInt(0),
  proficiencyBonus: z.number().int().min(2).max(9).optional().default(2),
  str: ability,
  dex: ability,
  con: ability,
  int: ability,
  wis: ability,
  cha: ability,
  hpMax: nonNegInt(0),
  hpCurrent: nonNegInt(0),
  hpTemp: nonNegInt(0),
  armorClass: z.number().int().min(0).max(40).optional().default(10),
  speed: nonNegInt(30),
  initiativeBonus: z.number().int().optional().default(0),
  initiative: z.number().int().optional().default(0),
  passivePerception: nonNegInt(10),
  savingThrowProficiencies: stringArray,
  skillProficiencies: stringArray,
  deathSaveSuccesses: z.number().int().min(0).max(3).optional().default(0),
  deathSaveFailures: z.number().int().min(0).max(3).optional().default(0),
  resistances: stringArray,
  immunities: stringArray,
  vulnerabilities: stringArray,
  languages: stringArray,
  featuresAndTraits: z.array(featureEntrySchema).optional().default([]),
  ideals: optionalString(2000),
  bonds: optionalString(2000),
  flaws: optionalString(2000),
  personalityTraits: optionalString(2000),
  feats: z.array(featEntrySchema).optional().default([]),
  multiclassInfo: z.array(multiclassEntrySchema).optional().default([]),
  conditions: stringArray,
  exhaustionLevel: z.number().int().min(0).max(6).optional().default(0),
  notes: optionalString(20000),
});
export const characterUpdateSchema = characterCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  NPCs & Monsters                                                            */
/* -------------------------------------------------------------------------- */

export const npcCreateSchema = z.object({
  campaignId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  type: z.enum(["npc", "monster"]).optional().default("npc"),
  race: optionalString(80),
  class: optionalString(80),
  size: optionalString(20),
  alignment: optionalString(60),
  challengeRating: optionalString(10),
  experiencePoints: nonNegInt(0),
  str: ability,
  dex: ability,
  con: ability,
  int: ability,
  wis: ability,
  cha: ability,
  hpMax: nonNegInt(0),
  hpCurrent: nonNegInt(0),
  armorClass: z.number().int().min(0).max(40).optional().default(10),
  speed: optionalString(120),
  savingThrowProficiencies: stringArray,
  skillProficiencies: stringArray,
  resistances: stringArray,
  immunities: stringArray,
  vulnerabilities: stringArray,
  senses: stringArray,
  languages: stringArray,
  traits: z.array(statBlockActionSchema).optional().default([]),
  actions: z.array(statBlockActionSchema).optional().default([]),
  reactions: z.array(statBlockActionSchema).optional().default([]),
  legendaryActions: z.array(statBlockActionSchema).optional().default([]),
  lairActions: z.array(statBlockActionSchema).optional().default([]),
  conditions: stringArray,
  exhaustionLevel: z.number().int().min(0).max(6).optional().default(0),
  isTemplate: z.boolean().optional().default(false),
  notes: optionalString(20000),
});
export const npcUpdateSchema = npcCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Spells / Spell slots / Inventory (owner-scoped)                            */
/* -------------------------------------------------------------------------- */

const ownerTypeEnum = z.enum(["character", "npc"]);

export const spellCreateSchema = z.object({
  ownerId: z.number().int(),
  ownerType: ownerTypeEnum,
  name: z.string().trim().min(1, "Name is required").max(120),
  level: z.number().int().min(0).max(9).optional().default(0),
  school: optionalString(40),
  castingTime: optionalString(60),
  range: optionalString(60),
  components: optionalString(60),
  duration: optionalString(60),
  description: optionalString(10000),
  isPrepared: z.boolean().optional().default(false),
  isConcentration: z.boolean().optional().default(false),
});
export const spellUpdateSchema = spellCreateSchema.partial();

export const spellSlotCreateSchema = z.object({
  ownerId: z.number().int(),
  ownerType: ownerTypeEnum,
  slotLevel: z.number().int().min(1).max(9),
  total: nonNegInt(0),
  used: nonNegInt(0),
});
export const spellSlotUpdateSchema = spellSlotCreateSchema.partial();

export const inventoryItemCreateSchema = z.object({
  ownerId: z.number().int(),
  ownerType: ownerTypeEnum,
  name: z.string().trim().min(1, "Name is required").max(120),
  quantity: z.number().int().min(0).optional().default(1),
  weight: z.number().min(0).optional().default(0),
  description: optionalString(5000),
  isEquipped: z.boolean().optional().default(false),
});
export const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Combat                                                                     */
/* -------------------------------------------------------------------------- */

export const encounterCreateSchema = z.object({
  campaignId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  status: z.enum(["active", "completed"]).optional().default("active"),
});
export const encounterUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["active", "completed"]).optional(),
  roundNumber: z.number().int().min(1).optional(),
  currentTurnIndex: z.number().int().min(0).optional(),
});

export const participantCreateSchema = z.object({
  encounterId: z.number().int(),
  entityId: z.number().int().nullable().optional(),
  entityType: ownerTypeEnum.nullable().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  initiativeRoll: z.number().int().nullable().optional(),
  initiativeTotal: z.number().int().optional().default(0),
  hpCurrent: nonNegInt(0),
  hpMax: nonNegInt(0),
  hpTemp: nonNegInt(0),
  armorClass: z.number().int().min(0).max(40).optional().default(10),
  conditions: stringArray,
  exhaustionLevel: z.number().int().min(0).max(6).optional().default(0),
  deathSaveSuccesses: z.number().int().min(0).max(3).optional().default(0),
  deathSaveFailures: z.number().int().min(0).max(3).optional().default(0),
  isActive: z.boolean().optional().default(true),
  turnOrder: z.number().int().optional().default(0),
});
export const participantUpdateSchema = participantCreateSchema.partial().omit({
  encounterId: true,
});

/* -------------------------------------------------------------------------- */
/*  Locations                                                                  */
/* -------------------------------------------------------------------------- */

export const locationCreateSchema = z.object({
  campaignId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalString(20000),
  type: optionalString(40),
  parentLocationId: z.number().int().nullable().optional(),
  mapImageUrl: z.string().nullable().optional(),
  mapPins: z.array(mapPinSchema).optional().default([]),
  gridData: gridDataSchema.optional(),
  notes: optionalString(20000),
});
export const locationUpdateSchema = locationCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Story events                                                               */
/* -------------------------------------------------------------------------- */

export const storyEventCreateSchema = z.object({
  campaignId: z.number().int(),
  sessionNumber: z.number().int().nullable().optional(),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: optionalString(20000),
  eventType: z
    .enum(["session_log", "plot_thread", "milestone", "event"])
    .optional()
    .default("event"),
  status: z.enum(["open", "resolved"]).optional().default("open"),
  inWorldDate: z.string().max(120).nullable().optional(),
  realDate: z.string().max(120).nullable().optional(),
  linkedNpcIds: idArray,
  linkedLocationIds: idArray,
});
export const storyEventUpdateSchema = storyEventCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Factions                                                                   */
/* -------------------------------------------------------------------------- */

export const factionCreateSchema = z.object({
  campaignId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalString(20000),
  goals: optionalString(10000),
  resources: optionalString(10000),
  secrets: optionalString(10000),
  relationshipWithPlayers: z
    .enum(["allied", "neutral", "hostile", "unknown"])
    .optional()
    .default("unknown"),
  keyNpcIds: idArray,
  notes: optionalString(20000),
});
export const factionUpdateSchema = factionCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Calendar events                                                            */
/* -------------------------------------------------------------------------- */

export const calendarEventCreateSchema = z.object({
  campaignId: z.number().int(),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: optionalString(10000),
  inWorldDate: z.string().max(120).nullable().optional(),
  realDate: z.string().max(120).nullable().optional(),
  eventType: z
    .enum(["festival", "quest_deadline", "random_event", "other"])
    .optional()
    .default("other"),
});
export const calendarEventUpdateSchema = calendarEventCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Shops & items                                                              */
/* -------------------------------------------------------------------------- */

export const shopCreateSchema = z.object({
  campaignId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalString(10000),
  locationId: z.number().int().nullable().optional(),
  ownerNpcId: z.number().int().nullable().optional(),
  notes: optionalString(20000),
});
export const shopUpdateSchema = shopCreateSchema.partial();

export const shopItemCreateSchema = z.object({
  shopId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalString(5000),
  price: optionalString(40),
  quantity: z.number().int().min(0).optional().default(1),
  itemType: optionalString(60),
  rarity: optionalString(40).default("common"),
});
export const shopItemUpdateSchema = shopItemCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Roll tables                                                                */
/* -------------------------------------------------------------------------- */

export const rollTableCreateSchema = z.object({
  campaignId: z.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalString(5000),
  entries: z.array(rollTableEntrySchema).optional().default([]),
});
export const rollTableUpdateSchema = rollTableCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Session prep                                                               */
/* -------------------------------------------------------------------------- */

export const sessionPrepCreateSchema = z.object({
  campaignId: z.number().int(),
  sessionNumber: z.number().int().nullable().optional(),
  sessionDate: z.string().max(120).nullable().optional(),
  status: z.enum(["planned", "completed"]).optional().default("planned"),
  plannedEncounters: idArray,
  plannedNpcs: idArray,
  plotPoints: z.array(plotPointSchema).optional().default([]),
  dmNotes: optionalString(50000),
});
export const sessionPrepUpdateSchema = sessionPrepCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*  Notes                                                                      */
/* -------------------------------------------------------------------------- */

export const noteCreateSchema = z.object({
  campaignId: z.number().int(),
  title: optionalString(160),
  content: optionalString(50000),
  isPinned: z.boolean().optional().default(false),
  color: optionalString(20).default("default"),
});
export const noteUpdateSchema = noteCreateSchema.partial();

/* re-export helpers for reuse by later entity schemas in this file */
export { optionalString, stringArray, idArray };
