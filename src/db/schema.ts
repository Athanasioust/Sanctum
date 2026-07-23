import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  real,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

/* -------------------------------------------------------------------------- */
/*  Shared JSON shapes                                                         */
/* -------------------------------------------------------------------------- */

export type CustomCalendarConfig = {
  months: { name: string; days: number }[];
  weekdays?: string[];
  yearLabel?: string;
  yearOne?: number;
};

export type FeatureEntry = { name: string; description: string; source?: string };
export type FeatEntry = { name: string; description: string };
export type MulticlassEntry = { className: string; subclass?: string; level: number };
export type MapPin = {
  id: string;
  x: number;
  y: number;
  label: string;
  description?: string;
  color?: string;
};
export type GridCell = {
  type: string;
  label?: string;
  color?: string;
};
export type GridData = {
  cols: number;
  rows: number;
  cellSize: number;
  cells: (GridCell | null)[];
};
export type RollTableEntry = { weight: number; result: string };
export type PlotPoint = { text: string; checked: boolean };
export type StatBlockAction = { name: string; description: string };
export type Currency = { pp: number; gp: number; ep: number; sp: number; cp: number };
export type SubObjective = { text: string; checked: boolean };

/* -------------------------------------------------------------------------- */
/*  Reusable column helpers                                                    */
/* -------------------------------------------------------------------------- */

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

const abilityScores = {
  str: integer("str").notNull().default(10),
  dex: integer("dex").notNull().default(10),
  con: integer("con").notNull().default(10),
  int: integer("int").notNull().default(10),
  wis: integer("wis").notNull().default(10),
  cha: integer("cha").notNull().default(10),
};

const ownerType = ["character", "npc"] as const;

/* -------------------------------------------------------------------------- */
/*  Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  setting: text("setting").notNull().default(""),
  inWorldCalendarType: text("in_world_calendar_type", {
    enum: ["real", "custom"],
  })
    .notNull()
    .default("real"),
  customCalendarConfig: text("custom_calendar_config", {
    mode: "json",
  }).$type<CustomCalendarConfig | null>(),
  currentInWorldDate: text("current_in_world_date"),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Characters (Player Characters)                                             */
/* -------------------------------------------------------------------------- */

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  race: text("race").notNull().default(""),
  class: text("class").notNull().default(""),
  subclass: text("subclass").notNull().default(""),
  level: integer("level").notNull().default(1),
  background: text("background").notNull().default(""),
  alignment: text("alignment").notNull().default(""),

  experiencePoints: integer("experience_points").notNull().default(0),
  proficiencyBonus: integer("proficiency_bonus").notNull().default(2),

  ...abilityScores,

  hpMax: integer("hp_max").notNull().default(0),
  hpCurrent: integer("hp_current").notNull().default(0),
  hpTemp: integer("hp_temp").notNull().default(0),

  armorClass: integer("armor_class").notNull().default(10),
  speed: integer("speed").notNull().default(30),
  initiativeBonus: integer("initiative_bonus").notNull().default(0),
  initiative: integer("initiative").notNull().default(0),
  passivePerception: integer("passive_perception").notNull().default(10),

  savingThrowProficiencies: text("saving_throw_proficiencies", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  skillProficiencies: text("skill_proficiencies", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),

  deathSaveSuccesses: integer("death_save_successes").notNull().default(0),
  deathSaveFailures: integer("death_save_failures").notNull().default(0),

  resistances: text("resistances", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  immunities: text("immunities", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  vulnerabilities: text("vulnerabilities", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),

  languages: text("languages", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),

  featuresAndTraits: text("features_and_traits", { mode: "json" })
    .notNull()
    .$type<FeatureEntry[]>()
    .$defaultFn(() => []),

  ideals: text("ideals").notNull().default(""),
  bonds: text("bonds").notNull().default(""),
  flaws: text("flaws").notNull().default(""),
  personalityTraits: text("personality_traits").notNull().default(""),

  feats: text("feats", { mode: "json" })
    .notNull()
    .$type<FeatEntry[]>()
    .$defaultFn(() => []),
  multiclassInfo: text("multiclass_info", { mode: "json" })
    .notNull()
    .$type<MulticlassEntry[]>()
    .$defaultFn(() => []),

  conditions: text("conditions", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  exhaustionLevel: integer("exhaustion_level").notNull().default(0),

  // Feature 4: Currency tracking (PP/GP/EP/SP/CP)
  currency: text("currency", { mode: "json" })
    .notNull()
    .default('{"pp":0,"gp":0,"ep":0,"sp":0,"cp":0}')
    .$type<Currency>(),

  // Feature 5: Rest mechanics — hit dice pool
  hitDiceTotal: integer("hit_dice_total").notNull().default(0),
  hitDiceUsed: integer("hit_dice_used").notNull().default(0),

  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Spells                                                                     */
/* -------------------------------------------------------------------------- */

export const spells = sqliteTable("spells", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull(),
  ownerType: text("owner_type", { enum: ownerType }).notNull(),
  name: text("name").notNull(),
  level: integer("level").notNull().default(0),
  school: text("school").notNull().default(""),
  castingTime: text("casting_time").notNull().default(""),
  range: text("range").notNull().default(""),
  components: text("components").notNull().default(""),
  duration: text("duration").notNull().default(""),
  description: text("description").notNull().default(""),
  isPrepared: integer("is_prepared", { mode: "boolean" }).notNull().default(false),
  isConcentration: integer("is_concentration", { mode: "boolean" })
    .notNull()
    .default(false),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Spell Slots                                                                */
/* -------------------------------------------------------------------------- */

export const spellSlots = sqliteTable("spell_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull(),
  ownerType: text("owner_type", { enum: ownerType }).notNull(),
  slotLevel: integer("slot_level").notNull(),
  total: integer("total").notNull().default(0),
  used: integer("used").notNull().default(0),
});

/* -------------------------------------------------------------------------- */
/*  Inventory Items                                                            */
/* -------------------------------------------------------------------------- */

export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull(),
  ownerType: text("owner_type", { enum: ownerType }).notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  weight: real("weight").notNull().default(0),
  description: text("description").notNull().default(""),
  isEquipped: integer("is_equipped", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  NPCs & Monsters                                                            */
/* -------------------------------------------------------------------------- */

export const npcs = sqliteTable("npcs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["npc", "monster"] }).notNull().default("npc"),
  race: text("race").notNull().default(""),
  class: text("class").notNull().default(""),

  size: text("size").notNull().default("Medium"),
  alignment: text("alignment").notNull().default(""),
  challengeRating: text("challenge_rating").notNull().default(""),
  experiencePoints: integer("experience_points").notNull().default(0),

  ...abilityScores,

  hpMax: integer("hp_max").notNull().default(0),
  hpCurrent: integer("hp_current").notNull().default(0),
  armorClass: integer("armor_class").notNull().default(10),
  speed: text("speed").notNull().default("30 ft."),

  savingThrowProficiencies: text("saving_throw_proficiencies", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  skillProficiencies: text("skill_proficiencies", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),

  resistances: text("resistances", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  immunities: text("immunities", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  vulnerabilities: text("vulnerabilities", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),

  senses: text("senses", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  languages: text("languages", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),

  traits: text("traits", { mode: "json" })
    .notNull()
    .$type<StatBlockAction[]>()
    .$defaultFn(() => []),
  actions: text("actions", { mode: "json" })
    .notNull()
    .$type<StatBlockAction[]>()
    .$defaultFn(() => []),
  reactions: text("reactions", { mode: "json" })
    .notNull()
    .$type<StatBlockAction[]>()
    .$defaultFn(() => []),
  legendaryActions: text("legendary_actions", { mode: "json" })
    .notNull()
    .$type<StatBlockAction[]>()
    .$defaultFn(() => []),
  lairActions: text("lair_actions", { mode: "json" })
    .notNull()
    .$type<StatBlockAction[]>()
    .$defaultFn(() => []),

  conditions: text("conditions", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  exhaustionLevel: integer("exhaustion_level").notNull().default(0),

  isTemplate: integer("is_template", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  NPC Relationships (Feature 12)                                             */
/* -------------------------------------------------------------------------- */

export const npcRelationships = sqliteTable("npc_relationships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  sourceNpcId: integer("source_npc_id")
    .notNull()
    .references(() => npcs.id, { onDelete: "cascade" }),
  targetNpcId: integer("target_npc_id")
    .notNull()
    .references(() => npcs.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull().default("ally"),
  description: text("description").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Combat Encounters                                                          */
/* -------------------------------------------------------------------------- */

export const encounters = sqliteTable("encounters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "completed"] })
    .notNull()
    .default("active"),
  roundNumber: integer("round_number").notNull().default(1),
  currentTurnIndex: integer("current_turn_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

/* -------------------------------------------------------------------------- */
/*  Combat Participants                                                        */
/* -------------------------------------------------------------------------- */

export const combatParticipants = sqliteTable("combat_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  encounterId: integer("encounter_id")
    .notNull()
    .references(() => encounters.id, { onDelete: "cascade" }),
  entityId: integer("entity_id"),
  entityType: text("entity_type", { enum: ["character", "npc"] }),
  name: text("name").notNull(),
  initiativeRoll: integer("initiative_roll"),
  initiativeTotal: integer("initiative_total").notNull().default(0),
  // Per-combatant initiative modifier (DEX mod for monsters, seeded on add).
  // "Roll initiative" rolls d20 + this for NPCs/monsters; players type their own.
  initiativeMod: integer("initiative_mod").notNull().default(0),
  hpCurrent: integer("hp_current").notNull().default(0),
  hpMax: integer("hp_max").notNull().default(0),
  hpTemp: integer("hp_temp").notNull().default(0),
  armorClass: integer("armor_class").notNull().default(10),
  conditions: text("conditions", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .$defaultFn(() => []),
  exhaustionLevel: integer("exhaustion_level").notNull().default(0),
  deathSaveSuccesses: integer("death_save_successes").notNull().default(0),
  deathSaveFailures: integer("death_save_failures").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  turnOrder: integer("turn_order").notNull().default(0),
  // Feature 11: Concentration tracking
  concentrationSpell: text("concentration_spell"),
});

/* -------------------------------------------------------------------------- */
/*  Combat Log Entries (Feature 15)                                           */
/* -------------------------------------------------------------------------- */

export const combatLogEntries = sqliteTable("combat_log_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  encounterId: integer("encounter_id")
    .notNull()
    .references(() => encounters.id, { onDelete: "cascade" }),
  round: integer("round").notNull().default(1),
  actorName: text("actor_name").notNull().default(""),
  action: text("action").notNull().default(""),
  details: text("details").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* -------------------------------------------------------------------------- */
/*  Locations (World)                                                          */
/* -------------------------------------------------------------------------- */

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("location"),
  parentLocationId: integer("parent_location_id").references(
    (): AnySQLiteColumn => locations.id,
    { onDelete: "set null" },
  ),
  mapImageUrl: text("map_image_url"),
  mapPins: text("map_pins", { mode: "json" })
    .notNull()
    .$type<MapPin[]>()
    .$defaultFn(() => []),
  gridData: text("grid_data", { mode: "json" }).$type<GridData | null>(),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Story Events                                                               */
/* -------------------------------------------------------------------------- */

export const storyEvents = sqliteTable("story_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  sessionNumber: integer("session_number"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  eventType: text("event_type", {
    enum: ["session_log", "plot_thread", "milestone", "event"],
  })
    .notNull()
    .default("event"),
  status: text("status", { enum: ["open", "resolved"] }).notNull().default("open"),
  inWorldDate: text("in_world_date"),
  realDate: text("real_date"),
  linkedNpcIds: text("linked_npc_ids", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .$defaultFn(() => []),
  linkedLocationIds: text("linked_location_ids", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .$defaultFn(() => []),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Factions                                                                   */
/* -------------------------------------------------------------------------- */

export const factions = sqliteTable("factions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  goals: text("goals").notNull().default(""),
  resources: text("resources").notNull().default(""),
  secrets: text("secrets").notNull().default(""),
  relationshipWithPlayers: text("relationship_with_players", {
    enum: ["allied", "neutral", "hostile", "unknown"],
  })
    .notNull()
    .default("unknown"),
  keyNpcIds: text("key_npc_ids", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .$defaultFn(() => []),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Calendar Events                                                            */
/* -------------------------------------------------------------------------- */

export const calendarEvents = sqliteTable("calendar_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  inWorldDate: text("in_world_date"),
  realDate: text("real_date"),
  eventType: text("event_type", {
    enum: ["festival", "quest_deadline", "random_event", "other"],
  })
    .notNull()
    .default("other"),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Shops                                                                      */
/* -------------------------------------------------------------------------- */

export const shops = sqliteTable("shops", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  locationId: integer("location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  ownerNpcId: integer("owner_npc_id").references(() => npcs.id, {
    onDelete: "set null",
  }),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Shop Items                                                                 */
/* -------------------------------------------------------------------------- */

export const shopItems = sqliteTable("shop_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: text("price").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  itemType: text("item_type").notNull().default(""),
  rarity: text("rarity").notNull().default("common"),
});

/* -------------------------------------------------------------------------- */
/*  Roll Tables                                                                */
/* -------------------------------------------------------------------------- */

export const rollTables = sqliteTable("roll_tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  entries: text("entries", { mode: "json" })
    .notNull()
    .$type<RollTableEntry[]>()
    .$defaultFn(() => []),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Session Prep                                                               */
/* -------------------------------------------------------------------------- */

export const sessionPreps = sqliteTable("session_preps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  sessionNumber: integer("session_number"),
  sessionDate: text("session_date"),
  status: text("status", { enum: ["planned", "completed"] })
    .notNull()
    .default("planned"),
  plannedEncounters: text("planned_encounters", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .$defaultFn(() => []),
  plannedNpcs: text("planned_npcs", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .$defaultFn(() => []),
  plotPoints: text("plot_points", { mode: "json" })
    .notNull()
    .$type<PlotPoint[]>()
    .$defaultFn(() => []),
  dmNotes: text("dm_notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Notes                                                                      */
/* -------------------------------------------------------------------------- */

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  color: text("color").notNull().default("default"),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Quests (Feature 3)                                                         */
/* -------------------------------------------------------------------------- */

export const quests = sqliteTable("quests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["active", "on-hold", "completed", "failed"] })
    .notNull()
    .default("active"),
  subObjectives: text("sub_objectives", { mode: "json" })
    .notNull()
    .$type<SubObjective[]>()
    .$defaultFn(() => []),
  linkedNpcIds: text("linked_npc_ids", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .$defaultFn(() => []),
  linkedLocationIds: text("linked_location_ids", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .$defaultFn(() => []),
  reward: text("reward").notNull().default(""),
  sessionNumber: integer("session_number"),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Magic Items (Feature 9)                                                    */
/* -------------------------------------------------------------------------- */

export const magicItems = sqliteTable("magic_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  characterId: integer("character_id").references(() => characters.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  itemType: text("item_type").notNull().default("wondrous"),
  rarity: text("rarity").notNull().default("common"),
  description: text("description").notNull().default(""),
  requiresAttunement: integer("requires_attunement", { mode: "boolean" })
    .notNull()
    .default(false),
  isAttuned: integer("is_attuned", { mode: "boolean" }).notNull().default(false),
  charges: integer("charges"),
  chargesMax: integer("charges_max"),
  rechargeCondition: text("recharge_condition").notNull().default(""),
  isCursed: integer("is_cursed", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Handouts (Feature 7)                                                       */
/* -------------------------------------------------------------------------- */

export const handouts = sqliteTable("handouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  imageUrl: text("image_url"),
  isRevealed: integer("is_revealed", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Rumors (Feature 14)                                                        */
/* -------------------------------------------------------------------------- */

export const rumors = sqliteTable("rumors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  source: text("source").notNull().default(""),
  sourceLocationId: integer("source_location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  sourceNpcId: integer("source_npc_id").references(() => npcs.id, {
    onDelete: "set null",
  }),
  isFollowedUp: integer("is_followed_up", { mode: "boolean" })
    .notNull()
    .default(false),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*  Backups                                                                    */
/* -------------------------------------------------------------------------- */

export const backups = sqliteTable("backups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").references(() => campaigns.id, {
    onDelete: "cascade",
  }),
  filePath: text("file_path").notNull(),
  label: text("label").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Spell = typeof spells.$inferSelect;
export type NewSpell = typeof spells.$inferInsert;
export type SpellSlot = typeof spellSlots.$inferSelect;
export type NewSpellSlot = typeof spellSlots.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type Npc = typeof npcs.$inferSelect;
export type NewNpc = typeof npcs.$inferInsert;
export type NpcRelationship = typeof npcRelationships.$inferSelect;
export type NewNpcRelationship = typeof npcRelationships.$inferInsert;
export type Encounter = typeof encounters.$inferSelect;
export type NewEncounter = typeof encounters.$inferInsert;
export type CombatParticipant = typeof combatParticipants.$inferSelect;
export type NewCombatParticipant = typeof combatParticipants.$inferInsert;
export type CombatLogEntry = typeof combatLogEntries.$inferSelect;
export type NewCombatLogEntry = typeof combatLogEntries.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type StoryEvent = typeof storyEvents.$inferSelect;
export type NewStoryEvent = typeof storyEvents.$inferInsert;
export type Faction = typeof factions.$inferSelect;
export type NewFaction = typeof factions.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type ShopItem = typeof shopItems.$inferSelect;
export type NewShopItem = typeof shopItems.$inferInsert;
export type RollTable = typeof rollTables.$inferSelect;
export type NewRollTable = typeof rollTables.$inferInsert;
export type SessionPrep = typeof sessionPreps.$inferSelect;
export type NewSessionPrep = typeof sessionPreps.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;
export type MagicItem = typeof magicItems.$inferSelect;
export type NewMagicItem = typeof magicItems.$inferInsert;
export type Handout = typeof handouts.$inferSelect;
export type NewHandout = typeof handouts.$inferInsert;
export type Rumor = typeof rumors.$inferSelect;
export type NewRumor = typeof rumors.$inferInsert;
export type Backup = typeof backups.$inferSelect;
export type NewBackup = typeof backups.$inferInsert;
