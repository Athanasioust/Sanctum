/**
 * Curated set of SRD 5.1 monster stat blocks (CC-BY-4.0, Wizards of the Coast)
 * offered as one-click Bestiary templates. Generated from the bundled SRD
 * dataset — see scripts; edit the source data rather than this file by hand.
 */
import type { StatBlockAction } from "@/db/schema";

export type SeedMonster = {
  name: string;
  type: "monster";
  race: string;
  size: string;
  alignment: string;
  challengeRating: string;
  experiencePoints: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  armorClass: number;
  hpMax: number;
  speed: string;
  savingThrowProficiencies: string[];
  skillProficiencies: string[];
  languages: string[];
  traits: StatBlockAction[];
  actions: StatBlockAction[];
  reactions: StatBlockAction[];
  legendaryActions: StatBlockAction[];
};

export const SRD_MONSTERS: SeedMonster[] = [
  {
    "name": "Commoner",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "0",
    "experiencePoints": 10,
    "str": 10,
    "dex": 10,
    "con": 10,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "armorClass": 10,
    "hpMax": 4,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Club",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Guard",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "1/8",
    "experiencePoints": 25,
    "str": 13,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 11,
    "cha": 10,
    "armorClass": 16,
    "hpMax": 11,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Bandit",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "1/8",
    "experiencePoints": 25,
    "str": 11,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 10,
    "armorClass": 12,
    "hpMax": 11,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage."
      },
      {
        "name": "Light Crossbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 80 ft./320 ft., one target. Hit: 5 (1d8 + 1) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Cultist",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "1/8",
    "experiencePoints": 25,
    "str": 11,
    "dex": 12,
    "con": 10,
    "int": 10,
    "wis": 11,
    "cha": 10,
    "armorClass": 12,
    "hpMax": 9,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "religion"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Dark Devotion",
        "description": "The cultist has advantage on saving throws against being charmed or frightened."
      }
    ],
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 4 (1d6 + 1) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Acolyte",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 10,
    "dex": 10,
    "con": 10,
    "int": 10,
    "wis": 14,
    "cha": 11,
    "armorClass": 10,
    "hpMax": 9,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "medicine",
      "religion"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Spellcasting",
        "description": "The acolyte is a 1st-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks). The acolyte has following cleric spells prepared:"
      },
      {
        "name": "Trait",
        "description": "Cantrips (at will): light, sacred flame, thaumaturgy"
      },
      {
        "name": "Trait",
        "description": "1st level (3 slots): bless, cure wounds, sanctuary"
      }
    ],
    "actions": [
      {
        "name": "Club",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Scout",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 11,
    "dex": 14,
    "con": 12,
    "int": 11,
    "wis": 13,
    "cha": 11,
    "armorClass": 13,
    "hpMax": 16,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "nature",
      "perception",
      "stealth",
      "survival"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Keen Hearing and Sight",
        "description": "The scout has advantage on Wisdom (Perception) checks that rely on hearing or sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The scout makes two melee attacks or two ranged attacks."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +4 to hit, ranged 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Thug",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 15,
    "dex": 11,
    "con": 14,
    "int": 10,
    "wis": 10,
    "cha": 11,
    "armorClass": 11,
    "hpMax": 32,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "intimidation"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "The thug has advantage on an attack roll against a creature if at least one of the thug's allies is within 5 feet of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The thug makes two melee attacks."
      },
      {
        "name": "Mace",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 5 (1d6 + 2) bludgeoning damage."
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack: +2 to hit, range 100/400 ft., one target. Hit: 5 (1d10) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Spy",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 10,
    "dex": 15,
    "con": 10,
    "int": 12,
    "wis": 14,
    "cha": 16,
    "armorClass": 12,
    "hpMax": 27,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "insight",
      "investigation",
      "perception",
      "persuasion",
      "stealth"
    ],
    "languages": [
      "Any Two Languages"
    ],
    "traits": [
      {
        "name": "Cunning Action",
        "description": "On each of its turns, the spy can use a bonus action to take the Dash, Disengage, or Hide action."
      },
      {
        "name": "Sneak Attack (1/Turn)",
        "description": "The spy deals an extra 7 (2d6) damage when it hits a target with a weapon attack and has advantage on the attack roll, or when the target is within 5 feet of an ally of the spy that isn't incapacitated and the spy doesn't have disadvantage on the attack roll."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The spy makes two melee attacks."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Kobold",
    "type": "monster",
    "race": "Humanoid",
    "size": "Small",
    "alignment": "Lawful Evil",
    "challengeRating": "1/8",
    "experiencePoints": 25,
    "str": 7,
    "dex": 15,
    "con": 9,
    "int": 8,
    "wis": 7,
    "cha": 8,
    "armorClass": 12,
    "hpMax": 5,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the kobold has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      },
      {
        "name": "Pack Tactics",
        "description": "The kobold has advantage on an attack roll against a creature if at least one of the kobold's allies is within 5 feet of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Dagger",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage."
      },
      {
        "name": "Sling",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 4 (1d4 + 2) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Goblin",
    "type": "monster",
    "race": "Humanoid",
    "size": "Small",
    "alignment": "Neutral Evil",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 8,
    "dex": 14,
    "con": 10,
    "int": 10,
    "wis": 8,
    "cha": 8,
    "armorClass": 15,
    "hpMax": 7,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "stealth"
    ],
    "languages": [
      "Common",
      "Goblin"
    ],
    "traits": [
      {
        "name": "Nimble Escape",
        "description": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
      }
    ],
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage."
      },
      {
        "name": "Shortbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Skeleton",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 10,
    "dex": 14,
    "con": 15,
    "int": 6,
    "wis": 8,
    "cha": 5,
    "armorClass": 13,
    "hpMax": 13,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Understands All Languages It Knew In Life But Can't Speak"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Shortbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Zombie",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Neutral Evil",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 13,
    "dex": 6,
    "con": 16,
    "int": 3,
    "wis": 6,
    "cha": 5,
    "armorClass": 8,
    "hpMax": 22,
    "speed": "20 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Understands The Languages Of Its Creator But Can't Speak"
    ],
    "traits": [
      {
        "name": "Undead Fortitude",
        "description": "If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Giant Rat",
    "type": "monster",
    "race": "Beast",
    "size": "Small",
    "alignment": "Unaligned",
    "challengeRating": "1/8",
    "experiencePoints": 25,
    "str": 7,
    "dex": 15,
    "con": 11,
    "int": 2,
    "wis": 10,
    "cha": 4,
    "armorClass": 12,
    "hpMax": 7,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The rat has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The rat has advantage on an attack roll against a creature if at least one of the rat's allies is within 5 feet of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Stirge",
    "type": "monster",
    "race": "Beast",
    "size": "Tiny",
    "alignment": "Unaligned",
    "challengeRating": "1/8",
    "experiencePoints": 25,
    "str": 4,
    "dex": 16,
    "con": 11,
    "int": 2,
    "wis": 8,
    "cha": 6,
    "armorClass": 14,
    "hpMax": 2,
    "speed": "10 ft., fly 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [],
    "actions": [
      {
        "name": "Blood Drain",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 5 (1d4 + 3) piercing damage, and the stirge attaches to the target. While attached, the stirge doesn't attack. Instead, at the start of each of the stirge's turns, the target loses 5 (1d4 + 3) hit points due to blood loss."
      },
      {
        "name": "Action",
        "description": "The stirge can detach itself by spending 5 feet of its movement. It does so after it drains 10 hit points of blood from the target or the target dies. A creature, including the target, can use its action to detach the stirge."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Wolf",
    "type": "monster",
    "race": "Beast",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 12,
    "dex": 15,
    "con": 12,
    "int": 3,
    "wis": 12,
    "cha": 6,
    "armorClass": 13,
    "hpMax": 11,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The wolf has advantage on attack rolls against a creature if at least one of the wolf's allies is within 5 feet of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Giant Spider",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 14,
    "dex": 16,
    "con": 12,
    "int": 2,
    "wis": 11,
    "cha": 4,
    "armorClass": 14,
    "hpMax": 26,
    "speed": "30 ft., climb 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Spider Climb",
        "description": "The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Sense",
        "description": "While in contact with a web, the spider knows the exact location of any other creature in contact with the same web."
      },
      {
        "name": "Web Walker",
        "description": "The spider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 7 (1d8 + 3) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 9 (2d8) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way."
      },
      {
        "name": "Web (Recharge 5–6)",
        "description": "Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. Hit: The target is restrained by webbing. As an action, the restrained target can make a DC 12 Strength check, bursting the webbing on a success. The webbing can also be attacked and destroyed (AC 10; hp 5; vulnerability to fire damage; immunity to bludgeoning, poison, and psychic damage)."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Bandit Captain",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 15,
    "dex": 16,
    "con": 14,
    "int": 14,
    "wis": 11,
    "cha": 14,
    "armorClass": 15,
    "hpMax": 65,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "str",
      "dex",
      "wis"
    ],
    "skillProficiencies": [
      "athletics",
      "deception"
    ],
    "languages": [
      "Any Two Languages"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The captain makes three melee attacks: two with its scimitar and one with its dagger. Or the captain makes two ranged attacks with its daggers."
      },
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage."
      },
      {
        "name": "Dagger",
        "description": "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d4 + 3) piercing damage."
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The captain adds 2 to its AC against one melee attack that would hit it. To do so, the captain must see the attacker and be wielding a melee weapon."
      }
    ],
    "legendaryActions": []
  },
  {
    "name": "Hobgoblin",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 13,
    "dex": 12,
    "con": 12,
    "int": 10,
    "wis": 10,
    "cha": 9,
    "armorClass": 18,
    "hpMax": 11,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common",
      "Goblin"
    ],
    "traits": [
      {
        "name": "Martial Advantage",
        "description": "Once per turn, the hobgoblin can deal an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 feet of an ally of the hobgoblin that isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) slashing damage, or 6 (1d10 + 1) slashing damage if used with two hands."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 150/600 ft., one target. Hit: 5 (1d8 + 1) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Orc",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 16,
    "dex": 12,
    "con": 16,
    "int": 7,
    "wis": 11,
    "cha": 10,
    "armorClass": 13,
    "hpMax": 15,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "intimidation"
    ],
    "languages": [
      "Common",
      "Orc"
    ],
    "traits": [
      {
        "name": "Aggressive",
        "description": "As a bonus action, the orc can move up to its speed toward a hostile creature that it can see."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage."
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Bugbear",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 15,
    "dex": 14,
    "con": 13,
    "int": 8,
    "wis": 11,
    "cha": 9,
    "armorClass": 16,
    "hpMax": 27,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "stealth",
      "survival"
    ],
    "languages": [
      "Common",
      "Goblin"
    ],
    "traits": [
      {
        "name": "Brute",
        "description": "A melee weapon deals one extra die of its damage when the bugbear hits with it (included in the attack)."
      },
      {
        "name": "Surprise Attack",
        "description": "If the bugbear surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 7 (2d6) damage from the attack."
      }
    ],
    "actions": [
      {
        "name": "Morningstar",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 11 (2d8 + 2) piercing damage."
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 9 (2d6 + 2) piercing damage in melee or 5 (1d6 + 2) piercing damage at range."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Ghoul",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 13,
    "dex": 15,
    "con": 10,
    "int": 7,
    "wis": 10,
    "cha": 6,
    "armorClass": 12,
    "hpMax": 22,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one creature. Hit: 9 (2d6 + 2) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) slashing damage. If the target is a creature other than an elf or undead, it must succeed on a DC 10 Constitution saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Animated Armor",
    "type": "monster",
    "race": "Construct",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 14,
    "dex": 11,
    "con": 13,
    "int": 1,
    "wis": 3,
    "cha": 1,
    "armorClass": 18,
    "hpMax": 33,
    "speed": "25 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Antimagic Susceptibility",
        "description": "The armor is incapacitated while in the area of an antimagic field. If targeted by dispel magic, the armor must succeed on a Constitution saving throw against the caster's spell save DC or fall unconscious for 1 minute."
      },
      {
        "name": "False Appearance",
        "description": "While the armor remains motionless, it is indistinguishable from a normal suit of armor."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The armor makes two melee attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Dire Wolf",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 17,
    "dex": 15,
    "con": 15,
    "int": 3,
    "wis": 12,
    "cha": 7,
    "armorClass": 14,
    "hpMax": 37,
    "speed": "50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 feet of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Brown Bear",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 19,
    "dex": 10,
    "con": 16,
    "int": 2,
    "wis": 13,
    "cha": 7,
    "armorClass": 11,
    "hpMax": 34,
    "speed": "40 ft., climb 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The bear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The bear makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Black Bear",
    "type": "monster",
    "race": "Beast",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 15,
    "dex": 10,
    "con": 14,
    "int": 2,
    "wis": 12,
    "cha": 7,
    "armorClass": 11,
    "hpMax": 19,
    "speed": "40 ft., climb 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The bear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The bear makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Boar",
    "type": "monster",
    "race": "Beast",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 13,
    "dex": 11,
    "con": 12,
    "int": 2,
    "wis": 9,
    "cha": 5,
    "armorClass": 11,
    "hpMax": 11,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Charge",
        "description": "If the boar moves at least 20 feet straight toward a target and then hits it with a tusk attack on the same turn, the target takes an extra 3 (1d6) slashing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone."
      },
      {
        "name": "Relentless (Recharges after a Short or Long Rest)",
        "description": "If the boar takes 7 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Tusk",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Panther",
    "type": "monster",
    "race": "Beast",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 14,
    "dex": 15,
    "con": 10,
    "int": 3,
    "wis": 14,
    "cha": 7,
    "armorClass": 12,
    "hpMax": 13,
    "speed": "50 ft., climb 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The panther has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pounce",
        "description": "If the panther moves at least 20 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 12 Strength saving throw or be knocked prone. If the target is prone, the panther can make one bite attack against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Lion",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 17,
    "dex": 15,
    "con": 13,
    "int": 3,
    "wis": 12,
    "cha": 8,
    "armorClass": 12,
    "hpMax": 26,
    "speed": "50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The lion has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Trait",
        "description": "Pack Tactics: The lion has advantage on an attack roll against a creature if at least one of the lion’s allies is within 5 feet of the creature and the ally isn’t incapacitated."
      },
      {
        "name": "Pounce",
        "description": "If the lion moves at least 20 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the lion can make one bite attack against it as a bonus action."
      },
      {
        "name": "Running Leap",
        "description": "With a 10-foot running start, the lion can long jump up to 25 feet."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Tiger",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 17,
    "dex": 15,
    "con": 14,
    "int": 3,
    "wis": 12,
    "cha": 8,
    "armorClass": 12,
    "hpMax": 37,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The tiger has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pounce",
        "description": "If the tiger moves at least 20 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the tiger can make one bite attack against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Giant Frog",
    "type": "monster",
    "race": "Beast",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 12,
    "dex": 13,
    "con": 11,
    "int": 2,
    "wis": 10,
    "cha": 3,
    "armorClass": 11,
    "hpMax": 18,
    "speed": "30 ft., swim 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The frog can breathe air and water."
      },
      {
        "name": "Standing Leap",
        "description": "The frog's long jump is up to 20 feet and its high jump is up to 10 feet, with or without a running start."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage, and the target is grappled (escape DC 11). Until this grapple ends, the target is restrained, and the frog can't bite another target."
      },
      {
        "name": "Swallow",
        "description": "The frog makes one bite attack against a Small or smaller target it is grappling. If the attack hits, the target is swallowed, and the grapple ends. The swallowed target is blinded and restrained, it has total cover against attacks and other effects outside the frog, and it takes 5 (2d4) acid damage at the start of each of the frog's turns. The frog can have only one target swallowed at a time. If the frog dies, a swallowed creature is no longer restrained by it and can escape from the corpse using 5 feet of movement, exiting prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Mastiff",
    "type": "monster",
    "race": "Beast",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1/8",
    "experiencePoints": 25,
    "str": 13,
    "dex": 14,
    "con": 12,
    "int": 3,
    "wis": 12,
    "cha": 7,
    "armorClass": 12,
    "hpMax": 5,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The mastiff has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Lizardfolk",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Neutral",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 15,
    "dex": 10,
    "con": 13,
    "int": 7,
    "wis": 12,
    "cha": 7,
    "armorClass": 15,
    "hpMax": 22,
    "speed": "30 ft., swim 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth",
      "survival"
    ],
    "languages": [
      "Draconic"
    ],
    "traits": [
      {
        "name": "Hold Breath",
        "description": "The lizardfolk can hold its breath for 15 minutes."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The lizardfolk makes two melee attacks, each one with a different weapon."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Heavy Club",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) bludgeoning damage."
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Spiked Shield",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Gnoll",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 14,
    "dex": 12,
    "con": 11,
    "int": 6,
    "wis": 10,
    "cha": 7,
    "armorClass": 15,
    "hpMax": 22,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Gnoll"
    ],
    "traits": [
      {
        "name": "Rampage",
        "description": "When the gnoll reduces a creature to 0 hit points with a melee attack on its turn, the gnoll can take a bonus action to move up to half its speed and make a bite attack."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage."
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) piercing damage if used with two hands to make a melee attack."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 150/600 ft., one target. Hit: 5 (1d8 + 1) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Swarm of Rats",
    "type": "monster",
    "race": "Beast",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 9,
    "dex": 11,
    "con": 9,
    "int": 2,
    "wis": 10,
    "cha": 3,
    "armorClass": 10,
    "hpMax": 24,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The swarm has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny rat. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Action",
        "description": "Bite.. Melee Weapon Attack: +2 to hit, reach 0 ft., one target in the swarm's space. Hit: 7 (2d6) piercing damage, or 3 (1d6) piercing damage if the swarm has half of its hit points or fewer."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Imp",
    "type": "monster",
    "race": "Fiend",
    "size": "Tiny",
    "alignment": "Lawful Evil",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 6,
    "dex": 17,
    "con": 13,
    "int": 11,
    "wis": 12,
    "cha": 14,
    "armorClass": 13,
    "hpMax": 10,
    "speed": "20 ft., fly 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "insight",
      "persuasion",
      "stealth"
    ],
    "languages": [
      "Common",
      "Infernal"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The imp can use its action to polymorph into a beast form that resembles a rat (speed 20 ft.), a raven (20 ft., fly 60 ft.), or a spider (20 ft., climb 20 ft.), or back into its true form. Its statistics are the same in each form, except for the speed changes noted. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Devil's Sight",
        "description": "Magical darkness doesn't impede the imp's darkvision."
      },
      {
        "name": "Magic Resistance",
        "description": "The imp has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Sting (Bite in Beast Form)",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage, and the target must make on a DC 11 Constitution saving throw, taking 10 (3d6) poison damage on a failed save, or half as much damage on a successful one."
      },
      {
        "name": "Invisibility",
        "description": "The imp magically turns invisible until it attacks or until its concentration ends (as if concentrating on a spell). Any equipment the imp wears or carries is invisible with it."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Quasit",
    "type": "monster",
    "race": "Fiend",
    "size": "Tiny",
    "alignment": "Chaotic Evil",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 5,
    "dex": 17,
    "con": 10,
    "int": 7,
    "wis": 10,
    "cha": 10,
    "armorClass": 13,
    "hpMax": 7,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "stealth"
    ],
    "languages": [
      "Abyssal",
      "Common"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The quasit can use its action to polymorph into a beast form that resembles a bat (speed 10 ft. fly 40 ft.), a centipede (40 ft., climb 40 ft.), or a toad (40 ft., swim 40 ft.), or back into its true form. Its statistics are the same in each form, except for the speed changes noted. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Magic Resistance",
        "description": "The quasit has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Claws (Bite in Beast Form)",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage, and the target must succeed on a DC 10 Constitution saving throw or take 5 (2d4) poison damage and become poisoned for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      },
      {
        "name": "Scare (1/Day)",
        "description": "One creature of the quasit's choice within 20 feet of it must succeed on a DC 10 Wisdom saving throw or be frightened for 1 minute. The target can repeat the saving throw at the end of each of its turns, with disadvantage if the quasit is within line of sight, ending the effect on itself on a success."
      },
      {
        "name": "Invisibility",
        "description": "The quasit magically turns invisible until it attacks or uses Scare, or until its concentration ends (as if concentrating on a spell). Any equipment the quasit wears or carries is invisible with it."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Worg",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Neutral Evil",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 16,
    "dex": 13,
    "con": 13,
    "int": 7,
    "wis": 11,
    "cha": 8,
    "armorClass": 13,
    "hpMax": 26,
    "speed": "50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Goblin",
      "Worg"
    ],
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The worg has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Blink Dog",
    "type": "monster",
    "race": "Fey",
    "size": "Medium",
    "alignment": "Lawful Good",
    "challengeRating": "1/4",
    "experiencePoints": 50,
    "str": 12,
    "dex": 17,
    "con": 12,
    "int": 10,
    "wis": 13,
    "cha": 11,
    "armorClass": 13,
    "hpMax": 22,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Blink Dog  Understands Sylvan But Can't Speak It"
    ],
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The dog has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage."
      },
      {
        "name": "Teleport (Recharge 4–6)",
        "description": "The dog magically teleports, along with any equipment it is wearing or carrying, up to 40 feet to an unoccupied space it can see. Before or after teleporting, the dog can make one bite attack."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Ogre",
    "type": "monster",
    "race": "Giant",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 19,
    "dex": 8,
    "con": 16,
    "int": 5,
    "wis": 7,
    "cha": 7,
    "armorClass": 11,
    "hpMax": 59,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common",
      "Giant"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage."
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 11 (2d6 + 4) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Owlbear",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 20,
    "dex": 12,
    "con": 17,
    "int": 3,
    "wis": 12,
    "cha": 7,
    "armorClass": 13,
    "hpMax": 59,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Sight and Smell",
        "description": "The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The owlbear makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Ghast",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 16,
    "dex": 17,
    "con": 10,
    "int": 11,
    "wis": 10,
    "cha": 8,
    "armorClass": 13,
    "hpMax": 36,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Stench",
        "description": "Any creature that starts its turn within 5 feet of the ghast must succeed on a DC 10 Constitution saving throw or be poisoned until the start of its next turn. On a successful saving throw, the creature is immune to the ghast's Stench for 24 hours."
      },
      {
        "name": "Turning Defiance",
        "description": "The ghast and any ghouls within 30 feet of it have advantage on saving throws against effects that turn undead."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 12 (2d8 + 3) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage. If the target is a creature other than an undead, it must succeed on a DC 10 Constitution saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Gargoyle",
    "type": "monster",
    "race": "Elemental",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 15,
    "dex": 11,
    "con": 16,
    "int": 6,
    "wis": 11,
    "cha": 7,
    "armorClass": 15,
    "hpMax": 52,
    "speed": "30 ft., fly 60 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Terran"
    ],
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the gargoyle remains motionless, it is indistinguishable from an inanimate statue."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The gargoyle makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Specter",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 1,
    "dex": 14,
    "con": 11,
    "int": 10,
    "wis": 10,
    "cha": 11,
    "armorClass": 12,
    "hpMax": 22,
    "speed": "fly 50 ft. (hover)",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Understands All Languages It Knew In Life But Can't Speak"
    ],
    "traits": [
      {
        "name": "Incorporeal Movement",
        "description": "The specter can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the specter has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Life Drain",
        "description": "Melee Spell Attack: +4 to hit, reach 5 ft., one creature. Hit: 10 (3d6) necrotic damage. The target must succeed on a DC 10 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the creature finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Will-o'-Wisp",
    "type": "monster",
    "race": "Undead",
    "size": "Tiny",
    "alignment": "Chaotic Evil",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 1,
    "dex": 28,
    "con": 10,
    "int": 13,
    "wis": 14,
    "cha": 11,
    "armorClass": 19,
    "hpMax": 22,
    "speed": "fly 50 ft. (hover)",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "The Languages It Knew In Life"
    ],
    "traits": [
      {
        "name": "Consume Life",
        "description": "As a bonus action, the will-o'-wisp can target one creature it can see within 5 feet of it that has 0 hit points and is still alive. The target must succeed on a DC 10 Constitution saving throw against this magic or die. If the target dies, the will-o'-wisp regains 10 (3d6) hit points."
      },
      {
        "name": "Ephemeral",
        "description": "The will-o'-wisp can't wear or carry anything."
      },
      {
        "name": "Incorporeal Movement",
        "description": "The will-o'-wisp can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        "name": "Variable Illumination",
        "description": "The will-o'-wisp sheds bright light in a 5- to 20-foot radius and dim light for an additional number of feet equal to the chosen radius. The will-o'-wisp can alter the radius as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Shock",
        "description": "Melee Spell Attack: +4 to hit, reach 5 ft., one creature. Hit: 9 (2d8) lightning damage."
      },
      {
        "name": "Invisibility",
        "description": "The will-o'-wisp and its light magically become invisible until it attacks or uses its Consume Life, or until its concentration ends (as if concentrating on a spell)."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Wight",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Neutral Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 15,
    "dex": 14,
    "con": 16,
    "int": 10,
    "wis": 13,
    "cha": 15,
    "armorClass": 14,
    "hpMax": 45,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "The Languages It Knew In Life"
    ],
    "traits": [
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the wight has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wight makes two longsword attacks or two longbow attacks. It can use its Life Drain in place of one longsword attack."
      },
      {
        "name": "Life Drain",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 5 (1d6 + 2) necrotic damage. The target must succeed on a DC 13 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      },
      {
        "name": "Action",
        "description": "A humanoid slain by this attack rises 24 hours later as a zombie under the wight's control, unless the humanoid is restored to life or its body is destroyed. The wight can have no more than twelve zombies under its control at one time."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) slashing damage, or 7 (1d10 + 2) slashing damage if used with two hands."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Wererat",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 10,
    "dex": 15,
    "con": 12,
    "int": 11,
    "wis": 10,
    "cha": 8,
    "armorClass": 12,
    "hpMax": 33,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common (Can't Speak In Rat Form)"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wererat can use its action to polymorph into a rat-humanoid hybrid or into a giant rat, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The wererat has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack (Humanoid or Hybrid Form Only)",
        "description": "The wererat makes two attacks, only one of which can be a bite."
      },
      {
        "name": "Bite (Rat or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage. If the target is a humanoid, it must succeed on a DC 11 Constitution saving throw or be cursed with wererat lycanthropy."
      },
      {
        "name": "Shortsword (Humanoid or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Hand Crossbow (Humanoid or Hybrid Form Only)",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Werewolf",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 15,
    "dex": 13,
    "con": 14,
    "int": 10,
    "wis": 11,
    "cha": 10,
    "armorClass": 11,
    "hpMax": 58,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common (Can't Speak In Wolf Form)"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werewolf can use its action to polymorph into a wolf-humanoid hybrid or into a wolf, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The werewolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "(Humanoid or Hybrid Form Only). The werewolf makes two attacks: one with its bite and one with its claws or spear."
      },
      {
        "name": "Bite (Wolf or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage. If the target is a humanoid, it must succeed on a DC 12 Constitution saving throw or be cursed with werewolf lycanthropy."
      },
      {
        "name": "Claws",
        "description": "(Hybrid Form Only). Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 7 (2d4 + 2) slashing damage."
      },
      {
        "name": "Spear (Humanoid Form Only)",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one creature. Hit: 5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) piercing damage if used with two hands to make a melee attack."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Wereboar",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Neutral Evil",
    "challengeRating": "4",
    "experiencePoints": 1100,
    "str": 17,
    "dex": 10,
    "con": 15,
    "int": 10,
    "wis": 11,
    "cha": 8,
    "armorClass": 10,
    "hpMax": 78,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Common (Can't Speak In Boar Form)"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wereboar can use its action to polymorph into a boar-humanoid hybrid or into a boar, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Charge (Boar or Hybrid Form Only)",
        "description": "If the wereboar moves at least 15 feet straight toward a target and then hits it with its tusks on the same turn, the target takes an extra 7 (2d6) slashing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      },
      {
        "name": "Relentless (Recharges after a Short or Long Rest)",
        "description": "If the wereboar takes 14 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack (Humanoid or Hybrid Form Only)",
        "description": "The wereboar makes two attacks, only one of which can be with its tusks."
      },
      {
        "name": "Maul (Humanoid or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage."
      },
      {
        "name": "Tusks (Boar or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage. If the target is a humanoid, it must succeed on a DC 12 Constitution saving throw or be cursed with wereboar lycanthropy."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Werebear",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Neutral Good",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 19,
    "dex": 10,
    "con": 17,
    "int": 11,
    "wis": 12,
    "cha": 12,
    "armorClass": 10,
    "hpMax": 135,
    "speed": "30 ft., climb 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Common (Can't Speak In Bear Form)"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werebear can use its action to polymorph into a Large bear-humanoid hybrid or into a Large bear, or back into its true form, which is humanoid. Its statistics, other than its size and AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The werebear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "In bear form, the werebear makes two claw attacks. In humanoid form, it makes two greataxe attacks. In hybrid form, it can attack like a bear or a humanoid."
      },
      {
        "name": "Bite (Bear or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 15 (2d10 + 4) piercing damage. If the target is a humanoid, it must succeed on a DC 14 Constitution saving throw or be cursed with werebear lycanthropy."
      },
      {
        "name": "Claw (Bear or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage."
      },
      {
        "name": "Greataxe (Humanoid or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (1d12 + 4) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Weretiger",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Neutral",
    "challengeRating": "4",
    "experiencePoints": 1100,
    "str": 17,
    "dex": 15,
    "con": 16,
    "int": 10,
    "wis": 13,
    "cha": 11,
    "armorClass": 12,
    "hpMax": 120,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common (Can't Speak In Tiger Form)"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The weretiger can use its action to polymorph into a tiger-humanoid hybrid or into a tiger, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The weretiger has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pounce (Tiger or Hybrid Form Only)",
        "description": "If the weretiger moves at least 15 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the weretiger can make one bite attack against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Multiattack (Humanoid or Hybrid Form Only)",
        "description": "In humanoid form, the weretiger makes two scimitar attacks or two longbow attacks. In hybrid form, it can attack like a humanoid or make two claw attacks."
      },
      {
        "name": "Bite (Tiger or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage. If the target is a humanoid, it must succeed on a DC 13 Constitution saving throw or be cursed with weretiger lycanthropy."
      },
      {
        "name": "Claw (Tiger or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage."
      },
      {
        "name": "Scimitar (Humanoid or Hybrid Form Only)",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage."
      },
      {
        "name": "Longbow (Humanoid or Hybrid Form Only)",
        "description": "Ranged Weapon Attack: +4 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Sahuagin",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "1/2",
    "experiencePoints": 100,
    "str": 13,
    "dex": 11,
    "con": 12,
    "int": 12,
    "wis": 13,
    "cha": 9,
    "armorClass": 12,
    "hpMax": 22,
    "speed": "30 ft., swim 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Sahuagin"
    ],
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "The sahuagin has advantage on melee attack rolls against any creature that doesn't have all its hit points."
      },
      {
        "name": "Limited Amphibiousness",
        "description": "The sahuagin can breathe air and water, but it needs to be submerged at least once every 4 hours to avoid suffocating."
      },
      {
        "name": "Shark Telepathy",
        "description": "The sahuagin can magically command any shark within 120 feet of it, using a limited telepathy."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The sahuagin makes two melee attacks: one with its bite and one with its claws or spear."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) slashing damage."
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Saber-Toothed Tiger",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 18,
    "dex": 14,
    "con": 15,
    "int": 3,
    "wis": 12,
    "cha": 8,
    "armorClass": 12,
    "hpMax": 52,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The tiger has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pounce",
        "description": "If the tiger moves at least 20 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the tiger can make one bite attack against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (1d10 + 5) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Polar Bear",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 20,
    "dex": 10,
    "con": 16,
    "int": 2,
    "wis": 13,
    "cha": 7,
    "armorClass": 12,
    "hpMax": 42,
    "speed": "40 ft., swim 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The bear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The bear makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 9 (1d8 + 5) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Giant Boar",
    "type": "monster",
    "race": "Beast",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 17,
    "dex": 10,
    "con": 16,
    "int": 2,
    "wis": 7,
    "cha": 5,
    "armorClass": 12,
    "hpMax": 42,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Charge",
        "description": "If the boar moves at least 20 feet straight toward a target and then hits it with a tusk attack on the same turn, the target takes an extra 7 (2d6) slashing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      },
      {
        "name": "Relentless (Recharges after a Short or Long Rest)",
        "description": "If the boar takes 10 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Tusk",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Phase Spider",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 15,
    "dex": 15,
    "con": 12,
    "int": 6,
    "wis": 10,
    "cha": 6,
    "armorClass": 13,
    "hpMax": 32,
    "speed": "30 ft., climb 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Ethereal Jaunt",
        "description": "As a bonus action, the spider can magically shift from the Material Plane to the Ethereal Plane, or vice versa."
      },
      {
        "name": "Spider Climb",
        "description": "The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Walker",
        "description": "The spider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 7 (1d10 + 2) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 18 (4d8) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Manticore",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 17,
    "dex": 16,
    "con": 17,
    "int": 7,
    "wis": 12,
    "cha": 8,
    "armorClass": 14,
    "hpMax": 68,
    "speed": "30 ft., fly 50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Tail Spike Regrowth",
        "description": "The manticore has twenty-four tail spikes. Used spikes regrow when the manticore finishes a long rest."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The manticore makes three attacks: one with its bite and two with its claws or three with its tail spikes."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage."
      },
      {
        "name": "Tail Spike",
        "description": "Ranged Weapon Attack: +5 to hit, range 100/200 ft., one target. Hit: 7 (1d8 + 3) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Minotaur",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 18,
    "dex": 11,
    "con": 16,
    "int": 6,
    "wis": 16,
    "cha": 9,
    "armorClass": 14,
    "hpMax": 76,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Abyssal"
    ],
    "traits": [
      {
        "name": "Charge",
        "description": "If the minotaur moves at least 10 feet straight toward a target and then hits it with a gore attack on the same turn, the target takes an extra 9 (2d8) piercing damage. If the target is a creature, it must succeed on a DC 14 Strength saving throw or be pushed up to 10 feet away and knocked prone."
      },
      {
        "name": "Labyrinthine Recall",
        "description": "The minotaur can perfectly recall any path it has traveled."
      },
      {
        "name": "Reckless",
        "description": "At the start of its turn, the minotaur can gain advantage on all melee weapon attack rolls it makes during that turn, but attack rolls against it have advantage until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 17 (2d12 + 4) slashing damage."
      },
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Basilisk",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Medium",
    "alignment": "Unaligned",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 16,
    "dex": 8,
    "con": 15,
    "int": 2,
    "wis": 8,
    "cha": 7,
    "armorClass": 15,
    "hpMax": 52,
    "speed": "20 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Petrifying Gaze",
        "description": "If a creature starts its turn within 30 feet of the basilisk and the two of them can see each other, the basilisk can force the creature to make a DC 12 Constitution saving throw if the basilisk isn't incapacitated. On a failed save, the creature magically begins to turn to stone and is restrained. It must repeat the saving throw at the end of its next turn. On a success, the effect ends. On a failure, the creature is petrified until freed by the greater restoration spell or other magic."
      },
      {
        "name": "Trait",
        "description": "A creature that isn't surprised can avert its eyes to avoid the saving throw at the start of its turn. If it does so, it can't see the basilisk until the start of its next turn, when it can avert its eyes again."
      },
      {
        "name": "Trait",
        "description": "If it looks at the basilisk in the meantime, it must immediately make the save. If the basilisk sees its reflection within 30 feet of it in bright light, it mistakes itself for a rival and targets itself with its gaze."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage plus 7 (2d6) poison damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Bulette",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 19,
    "dex": 11,
    "con": 21,
    "int": 2,
    "wis": 10,
    "cha": 5,
    "armorClass": 17,
    "hpMax": 94,
    "speed": "40 ft., burrow 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Standing Leap",
        "description": "The bulette's long jump is up to 30 feet and its high jump is up to 15 feet, with or without a running start."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 30 (4d12 + 4) piercing damage."
      },
      {
        "name": "Deadly Leap",
        "description": "If the bulette jumps at least 15 feet as part of its movement, it can then use this action to land on its feet in a space that contains one or more other creatures. Each of those creatures must succeed on a DC 16 Strength or Dexterity saving throw (target's choice) or be knocked prone and take 14 (3d6 + 4) bludgeoning damage plus 14 (3d6 + 4) slashing damage. On a successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 feet out of the bulette's space into an unoccupied space of the creature's choice. If no unoccupied space is within range, the creature instead falls prone in the bulette's space."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Hippogriff",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 17,
    "dex": 13,
    "con": 13,
    "int": 2,
    "wis": 12,
    "cha": 8,
    "armorClass": 11,
    "hpMax": 19,
    "speed": "40 ft., fly 60 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The hippogriff has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The hippogriff makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Griffon",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 2,
    "wis": 13,
    "cha": 8,
    "armorClass": 12,
    "hpMax": 59,
    "speed": "30 ft., fly 80 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The griffon has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The griffon makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Harpy",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "1",
    "experiencePoints": 200,
    "str": 12,
    "dex": 13,
    "con": 12,
    "int": 7,
    "wis": 10,
    "cha": 13,
    "armorClass": 11,
    "hpMax": 38,
    "speed": "20 ft., fly 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The harpy makes two attacks: one with its claws and one with its club."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 6 (2d4 + 1) slashing damage."
      },
      {
        "name": "Club",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) bludgeoning damage."
      },
      {
        "name": "Luring Song",
        "description": "The harpy sings a magical melody. Every humanoid and giant within 300 feet of the harpy that can hear the song must succeed on a DC 11 Wisdom saving throw or be charmed until the song ends. The harpy must take a bonus action on its subsequent turns to continue singing. It can stop singing at any time. The song ends if the harpy is incapacitated."
      },
      {
        "name": "Action",
        "description": "While charmed by the harpy, a target is incapacitated and ignores the songs of other harpies. If the charmed target is more than 5 feet away from the harpy, the target must move on its turn toward the harpy by the most direct route, trying to get within 5 feet. It doesn't avoid opportunity attacks, but before moving into damaging terrain, such as lava or a pit, and whenever it takes damage from a source other than the harpy, the target can repeat the saving throw. A charmed target can also repeat the saving throw at the end of each of its turns. If the saving throw is successful, the effect ends on it."
      },
      {
        "name": "Action",
        "description": "A target that successfully saves is immune to this harpy's song for the next 24 hours."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Doppelganger",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Medium",
    "alignment": "Neutral",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 11,
    "dex": 18,
    "con": 14,
    "int": 11,
    "wis": 12,
    "cha": 14,
    "armorClass": 14,
    "hpMax": 52,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "insight"
    ],
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The doppelganger can use its action to polymorph into a Small or Medium humanoid it has seen, or back into its true form. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Ambusher",
        "description": "The doppelganger has advantage on attack rolls against any creature it has surprised."
      },
      {
        "name": "Surprise Attack",
        "description": "If the doppelganger surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 10 (3d6) damage from the attack."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The doppelganger makes two melee attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) bludgeoning damage."
      },
      {
        "name": "Read Thoughts",
        "description": "The doppelganger magically reads the surface thoughts of one creature within 60 feet of it. The effect can penetrate barriers, but 3 feet of wood or dirt, 2 feet of stone, 2 inches of metal, or a thin sheet of lead blocks it. While the target is in range, the doppelganger can continue reading its thoughts, as long as the doppelganger's concentration isn't broken (as if concentrating on a spell). While reading the target's mind, the doppelganger has advantage on Wisdom (Insight) and Charisma (Deception, Intimidation, and Persuasion) checks against the target."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Green Hag",
    "type": "monster",
    "race": "Fey",
    "size": "Medium",
    "alignment": "Neutral Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 18,
    "dex": 12,
    "con": 16,
    "int": 13,
    "wis": 14,
    "cha": 14,
    "armorClass": 17,
    "hpMax": 82,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "arcana",
      "deception",
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic",
      "Sylvan"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The hag can breathe air and water."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The hag's innate spellcasting ability is Charisma (spell save DC 12). She can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: dancing lights, minor illusion, vicious mockery"
      },
      {
        "name": "Mimicry",
        "description": "The hag can mimic animal sounds and humanoid voices. A creature that hears the sounds can tell they are imitations with a successful DC 14 Wisdom (Insight) check."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage."
      },
      {
        "name": "Illusory Appearance",
        "description": "The hag covers herself and anything she is wearing or carrying with a magical illusion that makes her look like another creature of her general size and humanoid shape. The illusion ends if the hag takes a bonus action to end it or if she dies."
      },
      {
        "name": "Action",
        "description": "The changes wrought by this effect fail to hold up to physical inspection. For example, the hag could appear to have smooth skin, but someone touching her would feel her rough flesh. Otherwise, a creature must take an action to visually inspect the illusion and succeed on a DC 20 Intelligence (Investigation) check to discern that the hag is disguised."
      },
      {
        "name": "Invisible Passage",
        "description": "The hag magically turns invisible until she attacks or casts a spell, or until her concentration ends (as if concentrating on a spell). While invisible, she leaves no physical evidence of her passage, so she can be tracked only by magic. Any equipment she wears or carries is invisible with her."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Sea Hag",
    "type": "monster",
    "race": "Fey",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 16,
    "dex": 13,
    "con": 16,
    "int": 12,
    "wis": 12,
    "cha": 13,
    "armorClass": 14,
    "hpMax": 52,
    "speed": "30 ft., swim 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Aquan",
      "Common",
      "Giant"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The hag can breathe air and water."
      },
      {
        "name": "Horrific Appearance",
        "description": "Any humanoid that starts its turn within 30 feet of the hag and can see the hag's true form must make a DC 11 Wisdom saving throw. On a failed save, the creature is frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, with disadvantage if the hag is within line of sight, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the hag's Horrific Appearance for the next 24 hours."
      },
      {
        "name": "Trait",
        "description": "Unless the target is surprised or the revelation of the hag's true form is sudden, the target can avert its eyes and avoid making the initial saving throw. Until the start of its next turn, a creature that averts its eyes has disadvantage on attack rolls against the hag."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage."
      },
      {
        "name": "Death Glare",
        "description": "The hag targets one frightened creature she can see within 30 feet of her. If the target can see the hag, it must succeed on a DC 11 Wisdom saving throw against this magic or drop to 0 hit points."
      },
      {
        "name": "Illusory Appearance",
        "description": "The hag covers herself and anything she is wearing or carrying with a magical illusion that makes her look like an ugly creature of her general size and humanoid shape. The effect ends if the hag takes a bonus action to end it or if she dies."
      },
      {
        "name": "Action",
        "description": "The changes wrought by this effect fail to hold up to physical inspection. For example, the hag could appear to have no claws, but someone touching her hand might feel the claws. Otherwise, a creature must take an action to visually inspect the illusion and succeed on a DC 16 Intelligence (Investigation) check to discern that the hag is disguised."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Night Hag",
    "type": "monster",
    "race": "Fiend",
    "size": "Medium",
    "alignment": "Neutral Evil",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 16,
    "wis": 14,
    "cha": 16,
    "armorClass": 17,
    "hpMax": 112,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "insight",
      "perception",
      "stealth"
    ],
    "languages": [
      "Abyssal",
      "Common",
      "Infernal",
      "Primordial"
    ],
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "The hag's innate spellcasting ability is Charisma (spell save DC 14, +6 to hit with spell attacks). She can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect magic, magic missile"
      },
      {
        "name": "Trait",
        "description": "2/day each: plane shift (self only), ray of enfeeblement, sleep"
      },
      {
        "name": "Magic Resistance",
        "description": "The hag has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Action",
        "description": "Claws.(Hag Form Only). Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage."
      },
      {
        "name": "Change Shape",
        "description": "The hag magically polymorphs into a Small or Medium female humanoid, or back into her true form. Her statistics are the same in each form. Any equipment she is wearing or carrying isn't transformed. She reverts to her true form if she dies."
      },
      {
        "name": "Etherealness",
        "description": "The hag magically enters the Ethereal Plane from the Material Plane, or vice versa. To do so, the hag must have a heartstone in her possession."
      },
      {
        "name": "Nightmare Haunting (1/Day)",
        "description": "While on the Ethereal Plane, the hag magically touches a sleeping humanoid on the Material Plane. A protection from evil and good spell cast on the target prevents this contact, as does a magic circle. As long as the contact persists, the target has dreadful visions. If these visions last for at least 1 hour, the target gains no benefit from its rest, and its hit point maximum is reduced by 5 (1d10). If this effect reduces the target's hit point maximum to 0, the target dies, and if the target was evil, its soul is trapped in the hag's soul bag. The reduction to the target's hit point maximum lasts until removed by the greater restoration spell or similar magic."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Cult Fanatic",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 11,
    "dex": 14,
    "con": 12,
    "int": 10,
    "wis": 13,
    "cha": 14,
    "armorClass": 13,
    "hpMax": 33,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "persuasion",
      "religion"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Dark Devotion",
        "description": "The fanatic has advantage on saving throws against being charmed or frightened."
      },
      {
        "name": "Spellcasting",
        "description": "The fanatic is a 4th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 11, +3 to hit with spell attacks). The fanatic has the following cleric spells prepared:"
      },
      {
        "name": "Trait",
        "description": "Cantrips (at will): light, sacred flame, thaumaturgy"
      },
      {
        "name": "Trait",
        "description": "1st level (4 slots): command, inflict wounds, shield of faith"
      },
      {
        "name": "Trait",
        "description": "2nd level (3 slots): hold person, spiritual weapon"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The fanatic makes two melee attacks."
      },
      {
        "name": "Dagger",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one creature. Hit: 4 (1d4 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Druid",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 10,
    "dex": 12,
    "con": 13,
    "int": 12,
    "wis": 15,
    "cha": 11,
    "armorClass": 11,
    "hpMax": 27,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "medicine",
      "nature",
      "perception"
    ],
    "languages": [
      "Druidic Plus Any Two Languages"
    ],
    "traits": [
      {
        "name": "Spellcasting",
        "description": "The druid is a 4th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks). It has the following druid spells prepared:"
      },
      {
        "name": "Trait",
        "description": "Cantrips (at will): druidcraft, produce flame, shillelagh"
      },
      {
        "name": "Trait",
        "description": "1st level (4 slots): entangle, longstrider, speak with animals, thunderwave"
      },
      {
        "name": "Trait",
        "description": "2nd level (3 slots): animal messenger, barkskin"
      }
    ],
    "actions": [
      {
        "name": "Quarterstaff",
        "description": "Melee Weapon Attack: +2 to hit (+4 to hit with shillelagh), reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage, 4 (1d8) bludgeoning damage if wielded with two hands, or 6 (1d8 + 2) bludgeoning damage with shillelagh."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Veteran",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 16,
    "dex": 13,
    "con": 14,
    "int": 10,
    "wis": 11,
    "cha": 10,
    "armorClass": 17,
    "hpMax": 58,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "athletics",
      "perception"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The veteran makes two longsword attacks. If it has a shortsword drawn, it can also make a shortsword attack."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage if used with two hands."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage."
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 100/400 ft., one target. Hit: 6 (1d10 + 1) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Berserker",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 16,
    "dex": 12,
    "con": 17,
    "int": 9,
    "wis": 11,
    "cha": 9,
    "armorClass": 13,
    "hpMax": 67,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Reckless",
        "description": "At the start of its turn, the berserker can gain advantage on all melee weapon attack rolls during that turn, but attack rolls against it have advantage until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Banshee",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Chaotic Evil",
    "challengeRating": "4",
    "experiencePoints": 1100,
    "str": 1,
    "dex": 14,
    "con": 10,
    "int": 12,
    "wis": 11,
    "cha": 17,
    "armorClass": 12,
    "hpMax": 58,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Common",
      "Elvish"
    ],
    "traits": [
      {
        "name": "Detect Life",
        "description": "The banshee can magically sense the presence of creatures up to 5 miles away that aren’t undead or constructs. She knows the general direction they’re in but not their exact locations."
      },
      {
        "name": "Incorporeal Movement",
        "description": "The banshee can move through other creatures and objects as if they were difficult terrain. She takes 5 (1d10) force damage if she ends her turn inside an object."
      }
    ],
    "actions": [
      {
        "name": "Corrupting Touch",
        "description": "Melee Spell Attack: +4 to hit, reach 5 ft., one target. Hit: 12 (3d6 + 2) necrotic damage."
      },
      {
        "name": "Horrifying Visage",
        "description": "Each non-undead creature within 60 feet of the banshee that can see her must succeed on a DC 13 Wisdom saving throw or be frightened for 1 minute. A frightened target can repeat the saving throw at the end of each of its turns, with disadvantage if the banshee is within line of sight, ending the effect on itself on a success. If a target’s saving throw is successful or the effect ends for it, the target is immune to the banshee’s Horrifying Visage for the next 24 hours."
      },
      {
        "name": "Wail (1/Day)",
        "description": "The banshee releases a mournful wail, provided that she isn’t in sunlight. This wail has no effect on constructs and undead. All other creatures within 30 feet of her that can hear her must make a DC 13 Constitution saving throw. On a failure, a creature drops to 0 hit points. On a success, a creature takes 10 (3d6) psychic damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Ankheg",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 17,
    "dex": 11,
    "con": 13,
    "int": 1,
    "wis": 13,
    "cha": 6,
    "armorClass": 14,
    "hpMax": 39,
    "speed": "30 ft., burrow 10 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage plus 3 (1d6) acid damage. If the target is a Large or smaller creature, it is grappled (escape DC 13). Until this grapple ends, the ankheg can bite only the grappled creature and has advantage on attack rolls to do so."
      },
      {
        "name": "Acid Spray (Recharge 6)",
        "description": "The ankheg spits acid in a line that is 30 feet long and 5 feet wide, provided that it has no creature grappled. Each creature in that line must make a DC 13 Dexterity saving throw, taking 10 (3d6) acid damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Ettin",
    "type": "monster",
    "race": "Giant",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "4",
    "experiencePoints": 1100,
    "str": 21,
    "dex": 8,
    "con": 17,
    "int": 6,
    "wis": 10,
    "cha": 8,
    "armorClass": 12,
    "hpMax": 85,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Giant",
      "Orc"
    ],
    "traits": [
      {
        "name": "Two Heads",
        "description": "The ettin has advantage on Wisdom (Perception) checks and on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious."
      },
      {
        "name": "Wakeful",
        "description": "When one of the ettin's heads is asleep, its other head is awake."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The ettin makes two attacks: one with its battleaxe and one with its morningstar."
      },
      {
        "name": "Battleaxe",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage."
      },
      {
        "name": "Morningstar",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Hell Hound",
    "type": "monster",
    "race": "Fiend",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 17,
    "dex": 12,
    "con": 14,
    "int": 6,
    "wis": 13,
    "cha": 6,
    "armorClass": 15,
    "hpMax": 45,
    "speed": "50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Understands Infernal But Can't Speak It"
    ],
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The hound has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The hound has advantage on an attack roll against a creature if at least one of the hound's allies is within 5 feet of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 7 (2d6) fire damage."
      },
      {
        "name": "Fire Breath (Recharge 5–6)",
        "description": "The hound exhales fire in a 15-foot cone. Each creature in that area must make a DC 12 Dexterity saving throw, taking 21 (6d6) fire damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Nightmare",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Neutral Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 10,
    "wis": 13,
    "cha": 15,
    "armorClass": 13,
    "hpMax": 68,
    "speed": "60 ft., fly 90 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common  And Infernal But Can't Speak"
    ],
    "traits": [
      {
        "name": "Confer Fire Resistance",
        "description": "The nightmare can grant resistance to fire damage to anyone riding it."
      },
      {
        "name": "Illumination",
        "description": "The nightmare sheds bright light in a 10-foot radius and dim light for an additional 10 feet."
      }
    ],
    "actions": [
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage plus 7 (2d6) fire damage."
      },
      {
        "name": "Ethereal Stride",
        "description": "The nightmare and up to three willing creatures within 5 feet of it magically enter the Ethereal Plane from the Material Plane, or vice versa."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Wraith",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Neutral Evil",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 6,
    "dex": 16,
    "con": 16,
    "int": 12,
    "wis": 14,
    "cha": 15,
    "armorClass": 13,
    "hpMax": 67,
    "speed": "fly 60 ft. (hover)",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "The Languages It Knew In Life"
    ],
    "traits": [
      {
        "name": "Incorporeal Movement",
        "description": "The wraith can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the wraith has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Life Drain",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one creature. Hit: 21 (4d8 + 3) necrotic damage. The target must succeed on a DC 14 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      },
      {
        "name": "Create Specter",
        "description": "The wraith targets a humanoid within 10 feet of it that has been dead for no longer than 1 minute and died violently. The target's spirit rises as a specter in the space of its corpse or in the nearest unoccupied space. The specter is under the wraith's control. The wraith can have no more than seven specters under its control at one time."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Mummy",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 16,
    "dex": 8,
    "con": 15,
    "int": 6,
    "wis": 10,
    "cha": 12,
    "armorClass": 11,
    "hpMax": 58,
    "speed": "20 ft.",
    "savingThrowProficiencies": [
      "wis"
    ],
    "skillProficiencies": [],
    "languages": [
      "The Languages It Knew In Life"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The mummy can use its Dreadful Glare and makes one attack with its rotting fist."
      },
      {
        "name": "Rotting Fist",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage plus 10 (3d6) necrotic damage. If the target is a creature, it must succeed on a DC 12 Constitution saving throw or be cursed with mummy rot. The cursed target can't regain hit points, and its hit point maximum decreases by 10 (3d6) for every 24 hours that elapse. If the curse reduces the target's hit point maximum to 0, the target dies, and its body turns to dust. The curse lasts until removed by the remove curse spell or other magic."
      },
      {
        "name": "Dreadful Glare",
        "description": "The mummy targets one creature it can see within 60 feet of it. If the target can see the mummy, it must succeed on a DC 11 Wisdom saving throw against this magic or become frightened until the end of the mummy's next turn. If the target fails the saving throw by 5 or more, it is also paralyzed for the same duration. A target that succeeds on the saving throw is immune to the Dreadful Glare of all mummies (but not mummy lords) for the next 24 hours."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Troll",
    "type": "monster",
    "race": "Giant",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 18,
    "dex": 13,
    "con": 20,
    "int": 7,
    "wis": 9,
    "cha": 7,
    "armorClass": 15,
    "hpMax": 84,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Giant"
    ],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The troll has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Regeneration",
        "description": "The troll regains 10 hit points at the start of its turn. If the troll takes acid or fire damage, this trait doesn't function at the start of the troll's next turn. The troll dies only if it starts its turn with 0 hit points and doesn't regenerate."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The troll makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Flesh Golem",
    "type": "monster",
    "race": "Construct",
    "size": "Medium",
    "alignment": "Neutral",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 19,
    "dex": 9,
    "con": 18,
    "int": 6,
    "wis": 10,
    "cha": 5,
    "armorClass": 9,
    "hpMax": 93,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Understands The Languages Of Its Creator But Can't Speak"
    ],
    "traits": [
      {
        "name": "Berserk",
        "description": "Whenever the golem starts its turn with 40 hit points or fewer, roll a d6. On a 6, the golem goes berserk. On each of its turns while berserk, the golem attacks the nearest creature it can see. If no creature is near enough to move to and attack, the golem attacks an object, with preference for an object smaller than itself. Once the golem goes berserk, it continues to do so until it is destroyed or regains all its hit points."
      },
      {
        "name": "Trait",
        "description": "The golem's creator, if within 60 feet of the berserk golem, can try to calm it by speaking firmly and persuasively. The golem must be able to hear its creator, who must take an action to make a DC 15 Charisma (Persuasion) check. If the check succeeds, the golem ceases being berserk. If it takes damage while still at 40 hit points or fewer, the golem might go berserk again."
      },
      {
        "name": "Aversion of Fire",
        "description": "If the golem takes fire damage, it has disadvantage on attack rolls and ability checks until the end of its next turn."
      },
      {
        "name": "Immutable Form",
        "description": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Lightning Absorption",
        "description": "Whenever the golem is subjected to lightning damage, it takes no damage and instead regains a number of hit points equal to the lightning damage dealt."
      },
      {
        "name": "Magic Resistance",
        "description": "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "description": "The golem's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The golem makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Air Elemental",
    "type": "monster",
    "race": "Elemental",
    "size": "Large",
    "alignment": "Neutral",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 14,
    "dex": 20,
    "con": 14,
    "int": 6,
    "wis": 10,
    "cha": 6,
    "armorClass": 15,
    "hpMax": 90,
    "speed": "fly 90 ft. (hover)",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Auran"
    ],
    "traits": [
      {
        "name": "Air Form",
        "description": "The elemental can enter a hostile creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) bludgeoning damage."
      },
      {
        "name": "Whirlwind (Recharge 4–6)",
        "description": "Each creature in the elemental's space must make a DC 13 Strength saving throw. On a failure, a target takes 15 (3d8 + 2) bludgeoning damage and is flung up 20 feet away from the elemental in a random direction and knocked prone. If a thrown target strikes an object, such as a wall or floor, the target takes 3 (1d6) bludgeoning damage for every 10 feet it was thrown. If the target is thrown at another creature, that creature must succeed on a DC 13 Dexterity saving throw or take the same damage and be knocked prone."
      },
      {
        "name": "Action",
        "description": "If the saving throw is successful, the target takes half the bludgeoning damage and isn't flung away or knocked prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Earth Elemental",
    "type": "monster",
    "race": "Elemental",
    "size": "Large",
    "alignment": "Neutral",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 20,
    "dex": 8,
    "con": 20,
    "int": 5,
    "wis": 10,
    "cha": 5,
    "armorClass": 17,
    "hpMax": 126,
    "speed": "30 ft., burrow 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Terran"
    ],
    "traits": [
      {
        "name": "Earth Glide",
        "description": "The elemental can burrow through nonmagical, unworked earth and stone. While doing so, the elemental doesn't disturb the material it moves through."
      },
      {
        "name": "Siege Monster",
        "description": "The elemental deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 14 (2d8 + 5) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Fire Elemental",
    "type": "monster",
    "race": "Elemental",
    "size": "Large",
    "alignment": "Neutral",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 10,
    "dex": 17,
    "con": 16,
    "int": 6,
    "wis": 10,
    "cha": 7,
    "armorClass": 13,
    "hpMax": 102,
    "speed": "50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Ignan"
    ],
    "traits": [
      {
        "name": "Fire Form",
        "description": "The elemental can move through a space as narrow as 1 inch wide without squeezing. A creature that touches the elemental or hits it with a melee attack while within 5 feet of it takes 5 (1d10) fire damage. In addition, the elemental can enter a hostile creature's space and stop there. The first time it enters a creature's space on a turn, that creature takes 5 (1d10) fire damage and catches fire; until someone takes an action to douse the fire, the creature takes 5 (1d10) fire damage at the start of each of its turns."
      },
      {
        "name": "Illumination",
        "description": "The elemental sheds bright light in a 30-foot radius and dim light in an additional 30 feet."
      },
      {
        "name": "Water Susceptibility",
        "description": "For every 5 feet the elemental moves in water, or for every gallon of water splashed on it, it takes 1 cold damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two touch attacks."
      },
      {
        "name": "Touch",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) fire damage. If the target is a creature or a flammable object, it ignites. Until a creature takes an action to douse the fire, the target takes 5 (1d10) fire damage at the start of each of its turns."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Water Elemental",
    "type": "monster",
    "race": "Elemental",
    "size": "Large",
    "alignment": "Neutral",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 18,
    "dex": 14,
    "con": 18,
    "int": 5,
    "wis": 10,
    "cha": 8,
    "armorClass": 14,
    "hpMax": 114,
    "speed": "30 ft., swim 90 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Aquan"
    ],
    "traits": [
      {
        "name": "Water Form",
        "description": "The elemental can enter a hostile creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        "name": "Freeze",
        "description": "If the elemental takes cold damage, it partially freezes; its speed is reduced by 20 feet until the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage."
      },
      {
        "name": "Whelm (Recharge 4–6)",
        "description": "Each creature in the elemental's space must make a DC 15 Strength saving throw. On a failure, a target takes 13 (2d8 + 4) bludgeoning damage. If it is Large or smaller, it is also grappled (escape DC 14). Until this grapple ends, the target is restrained and unable to breathe unless it can breathe water. If the saving throw is successful, the target is pushed out of the elemental's space."
      },
      {
        "name": "Action",
        "description": "The elemental can grapple one Large creature or up to two Medium or smaller creatures at one time. At the start of each of the elemental's turns, each target grappled by it takes 13 (2d8 + 4) bludgeoning damage. A creature within 5 feet of the elemental can pull a creature or object out of it by taking an action to make a DC 14 Strength and succeeding."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Gladiator",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 10,
    "wis": 12,
    "cha": 15,
    "armorClass": 16,
    "hpMax": 112,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "str",
      "dex",
      "con"
    ],
    "skillProficiencies": [
      "athletics",
      "intimidation"
    ],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Brave",
        "description": "The gladiator has advantage on saving throws against being frightened."
      },
      {
        "name": "Brute",
        "description": "A melee weapon deals one extra die of its damage when the gladiator hits with it (included in the attack)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The gladiator makes three melee attacks or two ranged attacks."
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +7 to hit, reach 5 ft. and range 20/60 ft., one target. Hit: 11 (2d6 + 4) piercing damage, or 13 (2d8 + 4) piercing damage if used with two hands to make a melee attack."
      },
      {
        "name": "Shield Bash",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 9 (2d4 + 4) bludgeoning damage. If the target is a Medium or smaller creature, it must succeed on a DC 15 Strength saving throw or be knocked prone."
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The gladiator adds 3 to its AC against one melee attack that would hit it. To do so, the gladiator must see the attacker and be wielding a melee weapon."
      }
    ],
    "legendaryActions": []
  },
  {
    "name": "Knight",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 16,
    "dex": 11,
    "con": 14,
    "int": 11,
    "wis": 11,
    "cha": 15,
    "armorClass": 18,
    "hpMax": 52,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "con",
      "wis"
    ],
    "skillProficiencies": [],
    "languages": [
      "Any One Language (Usually Common)"
    ],
    "traits": [
      {
        "name": "Brave",
        "description": "The knight has advantage on saving throws against being frightened."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The knight makes two melee attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage."
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack: +2 to hit, range 100/400 ft., one target. Hit: 5 (1d10) piercing damage."
      },
      {
        "name": "Leadership (Recharges after a Short or Long Rest)",
        "description": "For 1 minute, the knight can utter a special command or warning whenever a nonhostile creature that it can see within 30 feet of it makes an attack roll or a saving throw. The creature can add a d4 to its roll provided it can hear and understand the knight. A creature can benefit from only one Leadership die at a time. This effect ends if the knight is incapacitated."
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The knight adds 2 to its AC against one melee attack that would hit it. To do so, the knight must see the attacker and be wielding a melee weapon."
      }
    ],
    "legendaryActions": []
  },
  {
    "name": "Mage",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "6",
    "experiencePoints": 2300,
    "str": 9,
    "dex": 14,
    "con": 11,
    "int": 17,
    "wis": 12,
    "cha": 11,
    "armorClass": 12,
    "hpMax": 40,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "int",
      "wis"
    ],
    "skillProficiencies": [
      "arcana",
      "history"
    ],
    "languages": [
      "Any Four Languages"
    ],
    "traits": [
      {
        "name": "Spellcasting",
        "description": "The mage is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). The mage has the following wizard spells prepared:"
      },
      {
        "name": "Trait",
        "description": "Cantrips (at will): fire bolt, light, mage hand, prestidigitation"
      },
      {
        "name": "Trait",
        "description": "1st level (4 slots): detect magic, mage armor, magic missile, shield"
      },
      {
        "name": "Trait",
        "description": "2nd level (3 slots): misty step, suggestion"
      },
      {
        "name": "Trait",
        "description": "3rd level (3 slots): counterspell, fireball, fly"
      },
      {
        "name": "Trait",
        "description": "4th level (3 slots): greater invisibility, ice storm"
      },
      {
        "name": "Trait",
        "description": "5th level (1 slot): cone of cold"
      }
    ],
    "actions": [
      {
        "name": "Dagger",
        "description": "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d4 + 2) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Priest",
    "type": "monster",
    "race": "Humanoid",
    "size": "Medium",
    "alignment": "Any",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 10,
    "dex": 10,
    "con": 12,
    "int": 13,
    "wis": 16,
    "cha": 13,
    "armorClass": 13,
    "hpMax": 27,
    "speed": "25 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "medicine",
      "persuasion",
      "religion"
    ],
    "languages": [
      "Any Two Languages"
    ],
    "traits": [
      {
        "name": "Divine Eminence",
        "description": "As a bonus action, the priest can expend a spell slot to cause its melee weapon attacks to magically deal an extra 10 (3d6) radiant damage to a target on a hit. This benefit lasts until the end of the turn. If the priest expends a spell slot of 2nd level or higher, the extra damage increases by 1d6 for each level above 1st."
      },
      {
        "name": "Spellcasting",
        "description": "The priest is a 5th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks). The priest has the following cleric spells prepared:"
      },
      {
        "name": "Trait",
        "description": "Cantrips (at will): light, sacred flame, thaumaturgy"
      },
      {
        "name": "Trait",
        "description": "1st level (4 slots): cure wounds, guiding bolt, sanctuary"
      },
      {
        "name": "Trait",
        "description": "2nd level (3 slots): lesser restoration, spiritual weapon"
      },
      {
        "name": "Trait",
        "description": "3rd level (2 slots): dispel magic, spirit guardians"
      }
    ],
    "actions": [
      {
        "name": "Mace",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Vampire Spawn",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Neutral Evil",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 16,
    "dex": 16,
    "con": 16,
    "int": 11,
    "wis": 10,
    "cha": 12,
    "armorClass": 15,
    "hpMax": 82,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "dex",
      "wis"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "The Languages It Knew In Life"
    ],
    "traits": [
      {
        "name": "Regeneration",
        "description": "The vampire regains 10 hit points at the start of its turn if it has at least 1 hit point and isn't in sunlight or running water. If the vampire takes radiant damage or damage from holy water, this trait doesn't function at the start of the vampire's next turn."
      },
      {
        "name": "Spider Climb",
        "description": "The vampire can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Vampire Weaknesses",
        "description": "The vampire has the following flaws:"
      },
      {
        "name": "Forbiddance",
        "description": "The vampire can't enter a residence without an invitation from one of the occupants."
      },
      {
        "name": "Harmed by Running Water",
        "description": "The vampire takes 20 acid damage when it ends its turn in running water."
      },
      {
        "name": "Stake to the Heart",
        "description": "The vampire is destroyed if a piercing weapon made of wood is driven into its heart while it is incapacitated in its resting place."
      },
      {
        "name": "Sunlight Hypersensitivity",
        "description": "The vampire takes 20 radiant damage when it starts its turn in sunlight. While in sunlight, it has disadvantage on attack rolls and ability checks."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The vampire makes two attacks, only one of which can be a bite attack."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one creature. Hit: 8 (2d4 + 3) slashing damage. Instead of dealing damage, the vampire can grapple the target (escape DC 13)."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one willing creature, or a creature that is grappled by the vampire, incapacitated, or restrained. Hit: 6 (1d6 + 3) piercing damage plus 7 (2d6) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken, and the vampire regains hit points equal to that amount. The reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Medusa",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "6",
    "experiencePoints": 2300,
    "str": 10,
    "dex": 15,
    "con": 16,
    "int": 12,
    "wis": 13,
    "cha": 15,
    "armorClass": 15,
    "hpMax": 127,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "insight",
      "perception",
      "stealth"
    ],
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Petrifying Gaze",
        "description": "When a creature that can see the medusa's eyes starts its turn within 30 feet of the medusa, the medusa can force it to make a DC 14 Constitution saving throw if the medusa isn't incapacitated and can see the creature. If the saving throw fails by 5 or more, the creature is instantly petrified. Otherwise, a creature that fails the save begins to turn to stone and is restrained. The restrained creature must repeat the saving throw at the end of its next turn, becoming petrified on a failure or ending the effect on a success. The petrification lasts until the creature is freed by the greater restoration spell or other magic."
      },
      {
        "name": "Trait",
        "description": "Unless surprised, a creature can avert its eyes to avoid the saving throw at the start of its turn. If the creature does so, it can't see the medusa until the start of its next turn, when it can avert its eyes again. If the creature looks at the medusa in the meantime, it must immediately make the save."
      },
      {
        "name": "Trait",
        "description": "If the medusa sees itself reflected on a polished surface within 30 feet of it and in an area of bright light, the medusa is, due to its curse, affected by its own gaze."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The medusa makes either three melee attacks--one with its snake hair and two with its shortsword--or two ranged attacks with its longbow."
      },
      {
        "name": "Snake Hair",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage plus 14 (4d6) poison damage."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +5 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage plus 7 (2d6) poison damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Gorgon",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 20,
    "dex": 11,
    "con": 18,
    "int": 2,
    "wis": 12,
    "cha": 7,
    "armorClass": 19,
    "hpMax": 114,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Trampling Charge",
        "description": "If the gorgon moves at least 20 feet straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a DC 16 Strength saving throw or be knocked prone. If the target is prone, the gorgon can make one attack with its hooves against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 18 (2d12 + 5) piercing damage."
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 16 (2d10 + 5) bludgeoning damage."
      },
      {
        "name": "Petrifying Breath (Recharge 5–6)",
        "description": "The gorgon exhales petrifying gas in a 30-foot cone. Each creature in that area must succeed on a DC 13 Constitution saving throw. On a failed save, a target begins to turn to stone and is restrained. The restrained target must repeat the saving throw at the end of its next turn. On a success, the effect ends on the target. On a failure, the target is petrified until freed by the greater restoration spell or other magic."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Yeti",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 18,
    "dex": 13,
    "con": 16,
    "int": 8,
    "wis": 12,
    "cha": 7,
    "armorClass": 12,
    "hpMax": 51,
    "speed": "40 ft., climb 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Yeti"
    ],
    "traits": [
      {
        "name": "Fear of Fire",
        "description": "If the yeti takes fire damage, it has disadvantage on attack rolls and ability checks until the end of its next turn."
      },
      {
        "name": "Keen Smell",
        "description": "The yeti has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Snow Camouflage",
        "description": "The yeti has advantage on Dexterity (Stealth) checks made to hide in snowy terrain."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The yeti can use its Chilling Gaze and makes two claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) slashing damage plus 3 (1d6) cold damage."
      },
      {
        "name": "Chilling Gaze",
        "description": "The yeti targets one creature it can see within 30 feet of it. If the target can see the yeti, the target must succeed on a DC 13 Constitution saving throw against this magic or take 10 (3d6) cold damage and then be paralyzed for 1 minute, unless it is immune to cold damage. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If the target’s saving throw is successful, or if the effect ends on it, the target is immune to the Chilling Gaze of all yetis (but not abominable yetis) for 1 hour."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Winter Wolf",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Neutral Evil",
    "challengeRating": "3",
    "experiencePoints": 700,
    "str": 18,
    "dex": 13,
    "con": 14,
    "int": 7,
    "wis": 12,
    "cha": 8,
    "armorClass": 13,
    "hpMax": 75,
    "speed": "50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Giant",
      "Winter Wolf"
    ],
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 feet of the creature and the ally isn't incapacitated."
      },
      {
        "name": "Snow Camouflage",
        "description": "The wolf has advantage on Dexterity (Stealth) checks made to hide in snowy terrain."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) piercing damage. If the target is a creature, it must succeed on a DC 14 Strength saving throw or be knocked prone."
      },
      {
        "name": "Cold Breath (Recharge 5–6)",
        "description": "The wolf exhales a blast of freezing wind in a 15-foot cone. Each creature in that area must make a DC 12 Dexterity saving throw, taking 18 (4d8) cold damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Unicorn",
    "type": "monster",
    "race": "Celestial",
    "size": "Large",
    "alignment": "Lawful Good",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 18,
    "dex": 14,
    "con": 15,
    "int": 11,
    "wis": 17,
    "cha": 16,
    "armorClass": 12,
    "hpMax": 67,
    "speed": "50 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Celestial",
      "Elvish",
      "Sylvan",
      "Telepathy 60 Ft."
    ],
    "traits": [
      {
        "name": "Charge",
        "description": "If the unicorn moves at least 20 feet straight toward a target and then hits it with a horn attack on the same turn, the target takes an extra 9 (2d8) piercing damage. If the target is a creature, it must succeed on a DC 15 Strength saving throw or be knocked prone."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The unicorn's innate spellcasting ability is Charisma (spell save DC 14). The unicorn can innately cast the following spells, requiring no components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect evil and good, druidcraft, pass without trace"
      },
      {
        "name": "Trait",
        "description": "1/day each: calm emotions, dispel evil and good, entangle"
      },
      {
        "name": "Magic Resistance",
        "description": "The unicorn has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "description": "The unicorn's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The unicorn makes two attacks: one with its hooves and one with its horn."
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage."
      },
      {
        "name": "Horn",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage."
      },
      {
        "name": "Healing Touch (3/Day)",
        "description": "The unicorn touches another creature with its horn. The target magically regains 11 (2d8 + 2) hit points. In addition, the touch removes all diseases and neutralizes all poisons afflicting the target."
      },
      {
        "name": "Teleport (1/Day)",
        "description": "The unicorn magically teleports itself and up to three willing creatures it can see within 5 feet of it, along with any equipment they are wearing or carrying, to a location the unicorn is familiar with, up to 1 mile away."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The unicorn can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The unicorn regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Hooves",
        "description": "The unicorn makes one attack with its hooves."
      },
      {
        "name": "Shimmering Shield (Costs 2 Actions)",
        "description": "The unicorn creates a shimmering, magical field around itself or another creature it can see within 60 feet of it. The target gains a +2 bonus to AC until the end of the unicorn's next turn."
      },
      {
        "name": "Heal Self (Costs 3 Actions)",
        "description": "The unicorn magically regains 11 (2d8 + 2) hit points."
      }
    ]
  },
  {
    "name": "Pegasus",
    "type": "monster",
    "race": "Celestial",
    "size": "Large",
    "alignment": "Chaotic Good",
    "challengeRating": "2",
    "experiencePoints": 450,
    "str": 18,
    "dex": 15,
    "con": 16,
    "int": 10,
    "wis": 15,
    "cha": 13,
    "armorClass": 12,
    "hpMax": 59,
    "speed": "60 ft., fly 90 ft.",
    "savingThrowProficiencies": [
      "dex",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Celestial",
      "Common",
      "Elvish  And Sylvan But Can't Speak"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Young White Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "6",
    "experiencePoints": 2300,
    "str": 18,
    "dex": 10,
    "con": 18,
    "int": 6,
    "wis": 11,
    "cha": 12,
    "armorClass": 17,
    "hpMax": 133,
    "speed": "40 ft., burrow 20 ft., fly 80 ft., swim 40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Ice Walk",
        "description": "The dragon can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra movement."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage plus 4 (1d8) cold damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      },
      {
        "name": "Cold Breath (Recharge 5–6)",
        "description": "The dragon exhales an icy blast in a 30-foot cone. Each creature in that area must make a DC 15 Constitution saving throw, taking 45 (10d8) cold damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Young Black Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "7",
    "experiencePoints": 2900,
    "str": 19,
    "dex": 14,
    "con": 17,
    "int": 12,
    "wis": 11,
    "cha": 15,
    "armorClass": 18,
    "hpMax": 127,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage plus 4 (1d8) acid damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      },
      {
        "name": "Acid Breath (Recharge 5–6)",
        "description": "The dragon exhales acid in a 30­-foot line that is 5 feet wide. Each creature in that line must make a DC 14 Dexterity saving throw, taking 49 (11d8) acid damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Young Green Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "8",
    "experiencePoints": 3900,
    "str": 19,
    "dex": 12,
    "con": 17,
    "int": 16,
    "wis": 13,
    "cha": 15,
    "armorClass": 18,
    "hpMax": 136,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "deception",
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage plus 7 (2d6) poison damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      },
      {
        "name": "Poison Breath (Recharge 5–6)",
        "description": "The dragon exhales poisonous gas in a 30-foot cone. Each creature in that area must make a DC 14 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Young Blue Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "9",
    "experiencePoints": 5000,
    "str": 21,
    "dex": 10,
    "con": 19,
    "int": 14,
    "wis": 13,
    "cha": 17,
    "armorClass": 18,
    "hpMax": 152,
    "speed": "40 ft., burrow 20 ft., fly 80 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 16 (2d10 + 5) piercing damage plus 5 (1d10) lightning damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage."
      },
      {
        "name": "Lightning Breath (Recharge 5–6)",
        "description": "The dragon exhales lightning in an 60-foot line that is 5 feet wide. Each creature in that line must make a DC 16 Dexterity saving throw, taking 55 (10d10) lightning damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Young Red Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "10",
    "experiencePoints": 5900,
    "str": 23,
    "dex": 10,
    "con": 21,
    "int": 14,
    "wis": 11,
    "cha": 19,
    "armorClass": 18,
    "hpMax": 178,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage."
      },
      {
        "name": "Fire Breath (Recharge 5–6)",
        "description": "The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Chimera",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "6",
    "experiencePoints": 2300,
    "str": 19,
    "dex": 11,
    "con": 19,
    "int": 3,
    "wis": 14,
    "cha": 10,
    "armorClass": 14,
    "hpMax": 114,
    "speed": "30 ft., fly 60 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Understands Draconic But Can't Speak  It"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The chimera makes three attacks: one with its bite, one with its horns, and one with its claws. When its fire breath is available, it can use the breath in place of its bite or horns."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) piercing damage."
      },
      {
        "name": "Horns",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (1d12 + 4) bludgeoning damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      },
      {
        "name": "Fire Breath (Recharge 5–6)",
        "description": "The dragon head exhales fire in a 15-­-foot cone. Each creature in that area must make a DC 15 Dexterity saving throw, taking 31 (7d8) fire damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Cyclops",
    "type": "monster",
    "race": "Giant",
    "size": "Huge",
    "alignment": "Chaotic Neutral",
    "challengeRating": "6",
    "experiencePoints": 2300,
    "str": 22,
    "dex": 11,
    "con": 20,
    "int": 8,
    "wis": 6,
    "cha": 10,
    "armorClass": 14,
    "hpMax": 138,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Giant"
    ],
    "traits": [
      {
        "name": "Poor Depth Perception",
        "description": "The cyclops has disadvantage on any attack roll against a target more than 30 feet away."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The cyclops makes two greatclub attacks."
      },
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 19 (3d8 + 6) bludgeoning damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +9 to hit, range 30/120 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Hydra",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Huge",
    "alignment": "Unaligned",
    "challengeRating": "8",
    "experiencePoints": 3900,
    "str": 20,
    "dex": 12,
    "con": 20,
    "int": 2,
    "wis": 10,
    "cha": 7,
    "armorClass": 15,
    "hpMax": 172,
    "speed": "30 ft., swim 30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Hold Breath",
        "description": "The hydra can hold its breath for 1 hour."
      },
      {
        "name": "Multiple Heads",
        "description": "The hydra has five heads. While it has more than one head, the hydra has advantage on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious."
      },
      {
        "name": "Trait",
        "description": "Whenever the hydra takes 25 or more damage in a single turn, one of its heads dies. If all its heads die, the hydra dies."
      },
      {
        "name": "Trait",
        "description": "At the end of its turn, it grows two heads for each of its heads that died since its last turn, unless it has taken fire damage since its last turn. The hydra regains 10 hit points for each head regrown in this way."
      },
      {
        "name": "Reactive Heads",
        "description": "For each head the hydra has beyond one, it gets an extra reaction that can be used only for opportunity attacks."
      },
      {
        "name": "Wakeful",
        "description": "While the hydra sleeps, at least one of its heads is awake."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The hydra makes as many bite attacks as it has heads."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 10 (1d10 + 5) piercing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Wyvern",
    "type": "monster",
    "race": "Dragon",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "6",
    "experiencePoints": 2300,
    "str": 19,
    "dex": 10,
    "con": 16,
    "int": 5,
    "wis": 12,
    "cha": 6,
    "armorClass": 13,
    "hpMax": 110,
    "speed": "20 ft., fly 80 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wyvern makes two attacks: one with its bite and one with its stinger. While flying, it can use its claws in place of one other attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one creature. Hit: 11 (2d6 + 4) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage."
      },
      {
        "name": "Stinger",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one creature. Hit: 11 (2d6 + 4) piercing damage. The target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Hill Giant",
    "type": "monster",
    "race": "Giant",
    "size": "Huge",
    "alignment": "Chaotic Evil",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 21,
    "dex": 8,
    "con": 19,
    "int": 5,
    "wis": 9,
    "cha": 6,
    "armorClass": 13,
    "hpMax": 105,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "Giant"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatclub attacks."
      },
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 18 (3d8 + 5) bludgeoning damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +8 to hit, range 60/240 ft., one target. Hit: 21 (3d10 + 5) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Stone Giant",
    "type": "monster",
    "race": "Giant",
    "size": "Huge",
    "alignment": "Neutral",
    "challengeRating": "7",
    "experiencePoints": 2900,
    "str": 23,
    "dex": 15,
    "con": 20,
    "int": 10,
    "wis": 12,
    "cha": 9,
    "armorClass": 17,
    "hpMax": 126,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis"
    ],
    "skillProficiencies": [
      "athletics",
      "perception"
    ],
    "languages": [
      "Giant"
    ],
    "traits": [
      {
        "name": "Stone Camouflage",
        "description": "The giant has advantage on Dexterity (Stealth) checks made to hide in rocky terrain."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatclub attacks. Greatclub. Melee Weapon Attack: +9 to hit, reach 15 ft., one target. Hit: 19 (3d8 + 6) bludgeoning damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +9 to hit, range 60/240 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage. If the target is a creature, it must succeed on a DC 17 Strength saving throw or be knocked prone."
      }
    ],
    "reactions": [
      {
        "name": "Rock Catching",
        "description": "If a rock or similar object is hurled at the giant, the giant can, with a successful DC 10 Dexterity saving throw, catch the missile and take no bludgeoning damage from it."
      }
    ],
    "legendaryActions": []
  },
  {
    "name": "Frost Giant",
    "type": "monster",
    "race": "Giant",
    "size": "Huge",
    "alignment": "Neutral Evil",
    "challengeRating": "8",
    "experiencePoints": 3900,
    "str": 23,
    "dex": 9,
    "con": 21,
    "int": 9,
    "wis": 10,
    "cha": 12,
    "armorClass": 15,
    "hpMax": 138,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "athletics",
      "perception"
    ],
    "languages": [
      "Giant"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greataxe attacks."
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 25 (3d12 + 6) slashing damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +9 to hit, range 60/240 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Fire Giant",
    "type": "monster",
    "race": "Giant",
    "size": "Huge",
    "alignment": "Lawful Evil",
    "challengeRating": "9",
    "experiencePoints": 5000,
    "str": 25,
    "dex": 9,
    "con": 23,
    "int": 10,
    "wis": 14,
    "cha": 13,
    "armorClass": 18,
    "hpMax": 162,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "cha"
    ],
    "skillProficiencies": [
      "athletics",
      "perception"
    ],
    "languages": [
      "Giant"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 28 (6d6 + 7) slashing damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +11 to hit, range 60/240 ft., one target. Hit: 29 (4d10 + 7) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Cloud Giant",
    "type": "monster",
    "race": "Giant",
    "size": "Huge",
    "alignment": "Neutral",
    "challengeRating": "9",
    "experiencePoints": 5000,
    "str": 27,
    "dex": 10,
    "con": 22,
    "int": 12,
    "wis": 16,
    "cha": 16,
    "armorClass": 14,
    "hpMax": 200,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "insight",
      "perception"
    ],
    "languages": [
      "Common",
      "Giant"
    ],
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The giant has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The giant's innate spellcasting ability is Charisma. It can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect magic, fog cloud, light"
      },
      {
        "name": "Trait",
        "description": "3/day each: feather fall, fly, misty step, telekinesis"
      },
      {
        "name": "Trait",
        "description": "1/day each: control weather, gaseous form"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two morningstar attacks."
      },
      {
        "name": "Morningstar",
        "description": "Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) piercing damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +12 to hit, range 60/240 ft., one target. Hit: 30 (4d10 + 8) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Storm Giant",
    "type": "monster",
    "race": "Giant",
    "size": "Huge",
    "alignment": "Chaotic Good",
    "challengeRating": "13",
    "experiencePoints": 10000,
    "str": 29,
    "dex": 14,
    "con": 20,
    "int": 16,
    "wis": 18,
    "cha": 18,
    "armorClass": 16,
    "hpMax": 230,
    "speed": "50 ft., swim 50 ft.",
    "savingThrowProficiencies": [
      "str",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "arcana",
      "athletics",
      "history",
      "perception"
    ],
    "languages": [
      "Common",
      "Giant"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The giant can breathe air and water."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The giant's innate spellcasting ability is Charisma (spell save DC 17). It can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect magic, feather fall, levitate, light"
      },
      {
        "name": "Trait",
        "description": "3/day each: control weather, water breathing"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 30 (6d6 + 9) slashing damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +14 to hit, range 60/240 ft., one target. Hit: 35 (4d12 + 9) bludgeoning damage."
      },
      {
        "name": "Lightning Strike (Recharge 5–6)",
        "description": "The giant hurls a magical lightning bolt at a point it can see within 500 feet of it. Each creature within 10 feet of that point must make a DC 17 Dexterity saving throw, taking 54 (12d8) lightning damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Treant",
    "type": "monster",
    "race": "Plant",
    "size": "Huge",
    "alignment": "Chaotic Good",
    "challengeRating": "9",
    "experiencePoints": 5000,
    "str": 23,
    "dex": 8,
    "con": 21,
    "int": 12,
    "wis": 16,
    "cha": 12,
    "armorClass": 16,
    "hpMax": 138,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Common",
      "Druidic",
      "Elvish",
      "Sylvan"
    ],
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the treant remains motionless, it is indistinguishable from a normal tree."
      },
      {
        "name": "Siege Monster",
        "description": "The treant deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The treant makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 16 (3d6 + 6) bludgeoning damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +10 to hit, range 60/180 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage."
      },
      {
        "name": "Animate Trees (1/Day)",
        "description": "The treant magically animates one or two trees it can see within 60 feet of it. These trees have the same statistics as a treant, except they have Intelligence and Charisma scores of 1, they can't speak, and they have only the Slam action option. An animated tree acts as an ally of the treant. The tree remains animate for 1 day or until it dies; until the treant dies or is more than 120 feet from the tree; or until the treant takes a bonus action to turn it back into an inanimate tree. The tree then takes root if possible."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Vrock",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "6",
    "experiencePoints": 2300,
    "str": 17,
    "dex": 15,
    "con": 18,
    "int": 8,
    "wis": 13,
    "cha": 8,
    "armorClass": 15,
    "hpMax": 104,
    "speed": "40 ft., fly 60 ft.",
    "savingThrowProficiencies": [
      "dex",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Abyssal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "The vrock has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The vrock makes two attacks: one with its beak and one with its talons."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage."
      },
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 14 (2d10 + 3) slashing damage."
      },
      {
        "name": "Spores (Recharge 6)",
        "description": "A 15­-foot­-radius cloud of toxic spores extends out from the vrock. The spores spread around corners. Each creature in that area must succeed on a DC 14 Constitution saving throw or become poisoned. While poisoned in this way, a target takes 5 (1d10) poison damage at the start of each of its turns. A target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. Emptying a vial of holy water on the target also ends the effect on it."
      },
      {
        "name": "Stunning Screech (1/Day)",
        "description": "The vrock emits a horrific screech. Each creature within 20 feet of it that can hear it and that isn't a demon must succeed on a DC 14 Constitution saving throw or be stunned until the end of the vrock's next turn."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Hezrou",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "8",
    "experiencePoints": 3900,
    "str": 19,
    "dex": 17,
    "con": 20,
    "int": 5,
    "wis": 12,
    "cha": 13,
    "armorClass": 16,
    "hpMax": 136,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "str",
      "con",
      "wis"
    ],
    "skillProficiencies": [],
    "languages": [
      "Abyssal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "The hezrou has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Stench",
        "description": "Any creature that starts its turn within 10 feet of the hezrou must succeed on a DC 14 Constitution saving throw or be poisoned until the start of its next turn. On a successful saving throw, the creature is immune to the hezrou's stench for 24 hours."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The hezrou makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 15 (2d10 + 4) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Glabrezu",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "9",
    "experiencePoints": 5000,
    "str": 20,
    "dex": 15,
    "con": 21,
    "int": 19,
    "wis": 17,
    "cha": 16,
    "armorClass": 17,
    "hpMax": 157,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "str",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Abyssal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "The glabrezu's spellcasting ability is Intelligence (spell save DC 16). The glabrezu can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: darkness, detect magic, dispel magic"
      },
      {
        "name": "Trait",
        "description": "1/day each: confusion, fly, power word stun"
      },
      {
        "name": "Magic Resistance",
        "description": "The glabrezu has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The glabrezu makes four attacks: two with its pincers and two with its fists. Alternatively, it makes two attacks with its pincers and casts one spell."
      },
      {
        "name": "Pincer",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 16 (2d10 + 5) bludgeoning damage. If the target is a Medium or smaller creature, it is grappled (escape DC 15). The glabrezu has two pincers, each of which can grapple only one target."
      },
      {
        "name": "Fist",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Erinyes",
    "type": "monster",
    "race": "Fiend",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "12",
    "experiencePoints": 8400,
    "str": 18,
    "dex": 16,
    "con": 18,
    "int": 14,
    "wis": 14,
    "cha": 18,
    "armorClass": 18,
    "hpMax": 153,
    "speed": "30 ft., fly 60 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Infernal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Hellish Weapons",
        "description": "The erinyes's weapon attacks are magical and deal an extra 13 (3d8) poison damage on a hit (included in the attacks)."
      },
      {
        "name": "Magic Resistance",
        "description": "The erinyes has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The erinyes makes three attacks."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage, or 9 (1d10 + 4) slashing damage if used with two hands, plus 13 (3d8) poison damage."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +7 to hit, range 150/600 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 13 (3d8) poison damage, and the target must succeed on a DC 14 Constitution saving throw or be poisoned. The poison lasts until it is removed by the lesser restoration spell or similar magic."
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The erinyes adds 4 to its AC against one melee attack that would hit it. To do so, the erinyes must see the attacker and be wielding a melee weapon."
      }
    ],
    "legendaryActions": []
  },
  {
    "name": "Bone Devil",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "9",
    "experiencePoints": 5000,
    "str": 18,
    "dex": 16,
    "con": 18,
    "int": 13,
    "wis": 14,
    "cha": 16,
    "armorClass": 19,
    "hpMax": 142,
    "speed": "40 ft., fly 40 ft.",
    "savingThrowProficiencies": [
      "int",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "deception",
      "insight"
    ],
    "languages": [
      "Infernal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Devil's Sight",
        "description": "Magical darkness doesn't impede the devil's darkvision."
      },
      {
        "name": "Magic Resistance",
        "description": "The devil has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The devil makes three attacks: two with its claws and one with its sting."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 8 (1d8 + 4) slashing damage."
      },
      {
        "name": "Sting",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 13 (2d8 + 4) piercing damage plus 17 (5d6) poison damage, and the target must succeed on a DC 14 Constitution saving throw or become poisoned for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Horned Devil",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "11",
    "experiencePoints": 7200,
    "str": 22,
    "dex": 17,
    "con": 21,
    "int": 12,
    "wis": 16,
    "cha": 17,
    "armorClass": 18,
    "hpMax": 148,
    "speed": "20 ft., fly 60 ft.",
    "savingThrowProficiencies": [
      "str",
      "dex",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Infernal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Devil's Sight",
        "description": "Magical darkness doesn't impede the devil's darkvision."
      },
      {
        "name": "Magic Resistance",
        "description": "The devil has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The devil makes three melee attacks: two with its fork and one with its tail. It can use Hurl Flame in place of any melee attack."
      },
      {
        "name": "Fork",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 15 (2d8 + 6) piercing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 10 (1d8 + 6) piercing damage. If the target is a creature other than an undead or a construct, it must succeed on a DC 17 Constitution saving throw or lose 10 (3d6) hit points at the start of each of its turns due to an infernal wound. Each time the devil hits the wounded target with this attack, the damage dealt by the wound increases by 10 (3d6). Any creature can take an action to stanch the wound with a successful DC 12 Wisdom (Medicine) check. The wound also closes if the target receives magical healing."
      },
      {
        "name": "Hurl Flame",
        "description": "Ranged Spell Attack: +7 to hit, range 150 ft., one target. Hit: 14 (4d6) fire damage. If the target is a flammable object that isn't being worn or carried, it also catches fire."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Ice Devil",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "14",
    "experiencePoints": 11500,
    "str": 21,
    "dex": 14,
    "con": 18,
    "int": 18,
    "wis": 15,
    "cha": 18,
    "armorClass": 18,
    "hpMax": 180,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Infernal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Devil's Sight",
        "description": "Magical darkness doesn't impede the devil's darkvision."
      },
      {
        "name": "Magic Resistance",
        "description": "The devil has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The devil makes three attacks: one with its bite, one with its claws, and one with its tail."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) piercing damage plus 10 (3d6) cold damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 10 (2d4 + 5) slashing damage plus 10 (3d6) cold damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 12 (2d6 + 5) bludgeoning damage plus 10 (3d6) cold damage."
      },
      {
        "name": "Wall of Ice (Recharge 6)",
        "description": "The devil magically forms an opaque wall of ice on a solid surface it can see within 60 feet of it. The wall is 1 foot thick and up to 30 feet long and 10 feet high, or it's a hemispherical dome up to 20 feet in diameter."
      },
      {
        "name": "Action",
        "description": "When the wall appears, each creature in its space is pushed out of it by the shortest route. The creature chooses which side of the wall to end up on, unless the creature is incapacitated. The creature then makes a DC 17 Dexterity saving throw, taking 35 (10d6) cold damage on a failed save, or half as much damage on a successful one."
      },
      {
        "name": "Action",
        "description": "The wall lasts for 1 minute or until the devil is incapacitated or dies. The wall can be damaged and breached; each 10-­foot section has AC 5, 30 hit points, vulnerability to fire damage, and immunity to acid, cold, necrotic, poison, and psychic damage. If a section is destroyed, it leaves behind a sheet of frigid air in the space the wall occupied. Whenever a creature finishes moving through the frigid air on a turn, willingly or otherwise, the creature must make a DC 17 Constitution saving throw, taking 17 (5d6) cold damage on a failed save, or half as much damage on a successful one. The frigid air dissipates when the rest of the wall vanishes."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Pit Fiend",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "20",
    "experiencePoints": 25000,
    "str": 26,
    "dex": 14,
    "con": 24,
    "int": 22,
    "wis": 18,
    "cha": 24,
    "armorClass": 19,
    "hpMax": 300,
    "speed": "30 ft., fly 60 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis"
    ],
    "skillProficiencies": [],
    "languages": [
      "Infernal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Trait",
        "description": "Fear Aura.incapacitatedfrightenedMagic Resistance.Magic Weapons.Innate Spellcasting.detect magicfireballhold monsterwall of fire"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The pit fiend makes four attacks: one with its bite, one with its claw, one with its mace, and one with its tail."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +14 to hit, reach 5 ft., one target. Hit: 22 (4d6 + 8) piercing damage. The target must succeed on a DC 21 Constitution saving throw or become poisoned. While poisoned in this way, the target can't regain hit points, and it takes 21 (6d6) poison damage at the start of each of its turns. The poisoned target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 17 (2d8 + 8) slashing damage."
      },
      {
        "name": "Mace",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 15 (2d6 + 8) bludgeoning damage plus 21 (6d6) fire damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 24 (3d10 + 8) bludgeoning damage."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Balor",
    "type": "monster",
    "race": "Fiend",
    "size": "Huge",
    "alignment": "Chaotic Evil",
    "challengeRating": "19",
    "experiencePoints": 22000,
    "str": 26,
    "dex": 15,
    "con": 22,
    "int": 20,
    "wis": 16,
    "cha": 22,
    "armorClass": 19,
    "hpMax": 262,
    "speed": "40 ft., fly 80 ft.",
    "savingThrowProficiencies": [
      "str",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Abyssal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Death Throes",
        "description": "When the balor dies, it explodes, and each creature within 30 feet of it must make a DC 20 Dexterity saving throw, taking 70 (20d6) fire damage on a failed save, or half as much damage on a successful one. The explosion ignites flammable objects in that area that aren't being worn or carried, and it destroys the balor's weapons."
      },
      {
        "name": "Fire Aura",
        "description": "At the start of each of the balor's turns, each creature within 5 feet of it takes 10 (3d6) fire damage, and flammable objects in the aura that aren't being worn or carried ignite. A creature that touches the balor or hits it with a melee attack while within 5 feet of it takes 10 (3d6) fire damage."
      },
      {
        "name": "Magic Resistance",
        "description": "The balor has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "description": "The balor's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The balor makes two attacks: one with its longsword and one with its whip."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) slashing damage plus 13 (3d8) lightning damage. If the balor scores a critical hit, it rolls damage dice three times, instead of twice."
      },
      {
        "name": "Whip",
        "description": "Melee Weapon Attack: +14 to hit, reach 30 ft., one target. Hit: 15 (2d6 + 8) slashing damage plus 10 (3d6) fire damage, and the target must succeed on a DC 20 Strength saving throw or be pulled up to 25 feet toward the balor."
      },
      {
        "name": "Teleport",
        "description": "The balor magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Marilith",
    "type": "monster",
    "race": "Fiend",
    "size": "Large",
    "alignment": "Chaotic Evil",
    "challengeRating": "16",
    "experiencePoints": 15000,
    "str": 18,
    "dex": 20,
    "con": 20,
    "int": 18,
    "wis": 16,
    "cha": 20,
    "armorClass": 18,
    "hpMax": 189,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "str",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "Abyssal",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "The marilith has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "description": "The marilith's weapon attacks are magical."
      },
      {
        "name": "Reactive",
        "description": "The marilith can take one reaction on every turn in a combat."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The marilith makes seven attacks: six with its longswords and one with its tail."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one creature. Hit: 15 (2d10 + 4) bludgeoning damage. If the target is Medium or smaller, it is grappled (escape DC 19). Until this grapple ends, the target is restrained, the marilith can automatically hit the target with its tail, and the marilith can't make tail attacks against other targets."
      },
      {
        "name": "Teleport",
        "description": "The marilith magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see."
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The marilith adds 5 to its AC against one melee attack that would hit it. To do so, the marilith must see the attacker and be wielding a melee weapon."
      }
    ],
    "legendaryActions": []
  },
  {
    "name": "Lich",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Any Evil Alignment",
    "challengeRating": "21",
    "experiencePoints": 33000,
    "str": 11,
    "dex": 16,
    "con": 16,
    "int": 20,
    "wis": 14,
    "cha": 16,
    "armorClass": 17,
    "hpMax": 135,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "con",
      "int",
      "wis"
    ],
    "skillProficiencies": [
      "arcana",
      "history",
      "insight",
      "perception"
    ],
    "languages": [
      "Common Plus Up To Five Other Languages"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the lich fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Rejuvenation",
        "description": "If it has a phylactery, a destroyed lich gains a new body in 1d10 days, regaining all its hit points and becoming active again. The new body appears within 5 feet of the phylactery."
      },
      {
        "name": "Spellcasting",
        "description": "The lich is an 18th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 20, +12 to hit with spell attacks). The lich has the following wizard spells prepared:"
      },
      {
        "name": "Trait",
        "description": "Cantrips (at will): mage hand, prestidigitation, ray of frost"
      },
      {
        "name": "Trait",
        "description": "1st level (4 slots): detect magic, magic missile, shield, thunderwave"
      },
      {
        "name": "Trait",
        "description": "2nd level (3 slots): acid arrow, detect thoughts, invisibility, mirror image"
      },
      {
        "name": "Trait",
        "description": "3rd level (3 slots): animate dead, counterspell, dispel magic, fireball"
      },
      {
        "name": "Trait",
        "description": "4th level (3 slots): blight, dimension door"
      },
      {
        "name": "Trait",
        "description": "5th level (3 slots): cloudkill, scrying"
      },
      {
        "name": "Trait",
        "description": "6th level (1 slot): disintegrate, globe of invulnerability"
      },
      {
        "name": "Trait",
        "description": "7th level (1 slot): finger of death, plane shift"
      },
      {
        "name": "Trait",
        "description": "8th level (1 slot): dominate monster, power word stun"
      },
      {
        "name": "Trait",
        "description": "9th level (1 slot): power word kill"
      },
      {
        "name": "Turn Resistance",
        "description": "The lich has advantage on saving throws against any effect that turns undead."
      }
    ],
    "actions": [
      {
        "name": "Paralyzing Touch",
        "description": "Melee Spell Attack: +12 to hit, reach 5 ft., one creature. Hit: 10 (3d6) cold damage. The target must succeed on a DC 18 Constitution saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The lich can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The lich regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Cantrip",
        "description": "The lich casts a cantrip."
      },
      {
        "name": "Paralyzing Touch (Costs 2 Actions)",
        "description": "The lich uses its Paralyzing Touch."
      },
      {
        "name": "Frightening Gaze (Costs 2 Actions)",
        "description": "The lich fixes its gaze on one creature it can see within 10 feet of it. The target must succeed on a DC 18 Wisdom saving throw against this magic or become frightened for 1 minute. The frightened target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a target's saving throw is successful or the effect ends for it, the target is immune to the lich's gaze for the next 24 hours."
      },
      {
        "name": "Disrupt Life (Costs 3 Actions)",
        "description": "Each living creature within 20 feet of the lich must make a DC 18 Constitution saving throw against this magic, taking 21 (6d6) necrotic damage on a failed save, or half as much damage on a successful one."
      }
    ]
  },
  {
    "name": "Vampire",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "13",
    "experiencePoints": 10000,
    "str": 18,
    "dex": 18,
    "con": 18,
    "int": 17,
    "wis": 15,
    "cha": 18,
    "armorClass": 16,
    "hpMax": 144,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "dex",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "The Languages It Knew In Life"
    ],
    "traits": [
      {
        "name": "Shapechanger",
        "description": "If the vampire isn't in sunlight or running water, it can use its action to polymorph into a Tiny bat or a Medium cloud of mist, or back into its true form."
      },
      {
        "name": "Trait",
        "description": "While in bat form, the vampire can't speak, its walking speed is 5 feet, and it has a flying speed of 30 feet. Its statistics, other than its size and speed, are unchanged. Anything it is wearing transforms with it, but nothing it is carrying does. It reverts to its true form if it dies."
      },
      {
        "name": "Trait",
        "description": "While in mist form, the vampire can't take any actions, speak, or manipulate objects. It is weightless, has a flying speed of 20 feet, can hover, and can enter a hostile creature's space and stop there. In addition, if air can pass through a space, the mist can do so without squeezing, and it can’t pass through water. It has advantage on Strength, Dexterity, and Constitution saving throws, and it is immune to all nonmagical damage, except the damage it takes from sunlight."
      },
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the vampire fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Misty Escape",
        "description": "When it drops to 0 hit points outside its resting place, the vampire transforms into a cloud of mist (as in the Shapechanger trait) instead of falling unconscious, provided that it isn't in sunlight or running water. If it can't transform, it is destroyed."
      },
      {
        "name": "Trait",
        "description": "While it has 0 hit points in mist form, it can't revert to its vampire form, and it must reach its resting place within 2 hours or be destroyed. Once in its resting place, it reverts to its vampire form. It is then paralyzed until it regains at least 1 hit point. After spending 1 hour in its resting place with 0 hit points, it regains 1 hit point."
      },
      {
        "name": "Regeneration",
        "description": "The vampire regains 20 hit points at the start of its turn if it has at least 1 hit point and isn't in sunlight or running water. If the vampire takes radiant damage or damage from holy water, this trait doesn't function at the start of the vampire's next turn."
      },
      {
        "name": "Spider Climb",
        "description": "The vampire can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Vampire Weaknesses",
        "description": "The vampire has the following flaws:"
      },
      {
        "name": "Forbiddance",
        "description": "The vampire can't enter a residence without an invitation from one of the occupants."
      },
      {
        "name": "Harmed by Running Water",
        "description": "The vampire takes 20 acid damage if it ends its turn in running water."
      },
      {
        "name": "Stake to the Heart",
        "description": "If a piercing weapon made of wood is driven into the vampire's heart while the vampire is incapacitated in its resting place, the vampire is paralyzed until the stake is removed."
      },
      {
        "name": "Sunlight Hypersensitivity",
        "description": "The vampire takes 20 radiant damage when it starts its turn in sunlight. While in sunlight, it has disadvantage on attack rolls and ability checks."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "(Vampire Form Only). The vampire makes two attacks, only one of which can be a bite attack."
      },
      {
        "name": "Unarmed Strike (Vampire Form Only)",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one creature. Hit: 8 (1d8 + 4) bludgeoning damage. Instead of dealing damage, the vampire can grapple the target (escape DC 18)."
      },
      {
        "name": "Bite",
        "description": "(Bat or Vampire Form Only). Melee Weapon Attack: +9 to hit, reach 5 ft., one willing creature, or a creature that is grappled by the vampire, incapacitated, or restrained. Hit: 7 (1d6 + 4) piercing damage plus 10 (3d6) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken, and the vampire regains hit points equal to that amount. The reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0. A humanoid slain in this way and then buried in the ground rises the following night as a vampire spawn under the vampire's control."
      },
      {
        "name": "Charm",
        "description": "The vampire targets one humanoid it can see within 30 feet of it. If the target can see the vampire, the target must succeed on a DC 17 Wisdom saving throw against this magic or be charmed by the vampire. The charmed target regards the vampire as a trusted friend to be heeded and protected. Although the target isn't under the vampire's control, it takes the vampire's requests or actions in the most favorable way it can, and it is a willing target for the vampire's bite attack."
      },
      {
        "name": "Action",
        "description": "Each time the vampire or the vampire's companions do anything harmful to the target, it can repeat the saving throw, ending the effect on itself on a success. Otherwise, the effect lasts 24 hours or until the vampire is destroyed, is on a different plane of existence than the target, or takes a bonus action to end the effect."
      },
      {
        "name": "Children of the Night (1/Day)",
        "description": "The vampire magically calls 2d4 swarms of bats or rats (swarm of bats, swarm of rats), provided that the sun isn't up. While outdoors, the vampire can call 3d6 wolves (wolf) instead. The called creatures arrive in 1d4 rounds, acting as allies of the vampire and obeying its spoken commands. The beasts remain for 1 hour, until the vampire dies, or until the vampire dismisses them as a bonus action."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The vampire can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The vampire regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Move",
        "description": "The vampire moves up to its speed without provoking opportunity attacks."
      },
      {
        "name": "Unarmed Strike",
        "description": "The vampire makes one unarmed strike."
      },
      {
        "name": "Legendary Actions",
        "description": "Bite.(Costs 2 Actions). The vampire makes one bite attack."
      }
    ]
  },
  {
    "name": "Mummy Lord",
    "type": "monster",
    "race": "Undead",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "15",
    "experiencePoints": 13000,
    "str": 18,
    "dex": 10,
    "con": 17,
    "int": 11,
    "wis": 18,
    "cha": 16,
    "armorClass": 17,
    "hpMax": 97,
    "speed": "20 ft.",
    "savingThrowProficiencies": [
      "con",
      "int",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "history",
      "religion"
    ],
    "languages": [
      "The Languages It Knew In Life"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "The mummy lord has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Rejuvenation",
        "description": "A destroyed mummy lord gains a new body in 24 hours if its heart is intact, regaining all its hit points and becoming active again. The new body appears within 5 feet of the mummy lord's heart."
      },
      {
        "name": "Spellcasting",
        "description": "The mummy lord is a 10th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 17, +9 to hit with spell attacks). The mummy lord has the following cleric spells prepared:"
      },
      {
        "name": "Trait",
        "description": "Cantrips (at will): sacred flame, thaumaturgy"
      },
      {
        "name": "Trait",
        "description": "1st level (4 slots): command, guiding bolt, shield of faith"
      },
      {
        "name": "Trait",
        "description": "2nd level (3 slots): hold person, silence, spiritual weapon"
      },
      {
        "name": "Trait",
        "description": "3rd level (3 slots): animate dead, dispel magic"
      },
      {
        "name": "Trait",
        "description": "4th level (3 slots): divination, guardian of faith"
      },
      {
        "name": "Trait",
        "description": "5th level (2 slots): contagion, insect plague"
      },
      {
        "name": "Trait",
        "description": "6th level (1 slot): harm"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The mummy can use its Dreadful Glare and makes one attack with its rotting fist."
      },
      {
        "name": "Rotting Fist",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 14 (3d6 + 4) bludgeoning damage plus 21 (6d6) necrotic damage. If the target is a creature, it must succeed on a DC 16 Constitution saving throw or be cursed with mummy rot. The cursed target can't regain hit points, and its hit point maximum decreases by 10 (3d6) for every 24 hours that elapse. If the curse reduces the target's hit point maximum to 0, the target dies, and its body turns to dust. The curse lasts until removed by the remove curse spell or other magic."
      },
      {
        "name": "Dreadful Glare",
        "description": "The mummy lord targets one creature it can see within 60 feet of it. If the target can see the mummy lord, it must succeed on a DC 16 Wisdom saving throw against this magic or become frightened until the end of the mummy's next turn. If the target fails the saving throw by 5 or more, it is also paralyzed for the same duration. A target that succeeds on the saving throw is immune to the Dreadful Glare of all mummies and mummy lords for the next 24 hours."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The mummy lord can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The mummy lord regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Attack",
        "description": "The mummy lord makes one attack with its rotting fist or uses its Dreadful Glare."
      },
      {
        "name": "Blinding Dust",
        "description": "Blinding dust and sand swirls magically around the mummy lord. Each creature within 5 feet of the mummy lord must succeed on a DC 16 Constitution saving throw or be blinded until the end of the creature's next turn."
      },
      {
        "name": "Blasphemous Word (Costs 2 Actions)",
        "description": "The mummy lord utters a blasphemous word. Each non-undead creature within 10 feet of the mummy lord that can hear the magical utterance must succeed on a DC 16 Constitution saving throw or be stunned until the end of the mummy lord's next turn."
      },
      {
        "name": "Channel Negative Energy (Costs 2 Actions)",
        "description": "The mummy lord magically unleashes negative energy. Creatures within 60 feet of the mummy lord, including ones behind barriers and around corners, can't regain hit points until the end of the mummy lord's next turn."
      },
      {
        "name": "Whirlwind of Sand (Costs 2 Actions)",
        "description": "The mummy lord magically transforms into a whirlwind of sand, moves up to 60 feet, and reverts to its normal form. While in whirlwind form, the mummy lord is immune to all damage, and it can't be grappled, petrified, knocked prone, restrained, or stunned. Equipment worn or carried by the mummy lord remain in its possession."
      }
    ]
  },
  {
    "name": "Iron Golem",
    "type": "monster",
    "race": "Construct",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "16",
    "experiencePoints": 15000,
    "str": 24,
    "dex": 9,
    "con": 20,
    "int": 3,
    "wis": 11,
    "cha": 1,
    "armorClass": 20,
    "hpMax": 210,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Understands The Languages Of Its Creator But Can't Speak"
    ],
    "traits": [
      {
        "name": "Fire Absorption",
        "description": "Whenever the golem is subjected to fire damage, it takes no damage and instead regains a number of hit points equal to the fire damage dealt."
      },
      {
        "name": "Immutable Form",
        "description": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Magic Resistance",
        "description": "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "description": "The golem's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The golem makes two melee attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +13 to hit, reach 5 ft., one target. Hit: 20 (3d8 + 7) bludgeoning damage."
      },
      {
        "name": "Sword",
        "description": "Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 23 (3d10 + 7) slashing damage."
      },
      {
        "name": "Poison Breath (Recharge 6)",
        "description": "The golem exhales poisonous gas in a 15-foot cone. Each creature in that area must make a DC 19 Constitution saving throw, taking 45 (10d8) poison damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Stone Golem",
    "type": "monster",
    "race": "Construct",
    "size": "Large",
    "alignment": "Unaligned",
    "challengeRating": "10",
    "experiencePoints": 5900,
    "str": 22,
    "dex": 9,
    "con": 20,
    "int": 3,
    "wis": 11,
    "cha": 1,
    "armorClass": 17,
    "hpMax": 178,
    "speed": "30 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [
      "Understands The Languages Of Its Creator But Can't Speak"
    ],
    "traits": [
      {
        "name": "Immutable Form",
        "description": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Magic Resistance",
        "description": "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "description": "The golem's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The golem makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 19 (3d8 + 6) bludgeoning damage."
      },
      {
        "name": "Slow (Recharge 5–6)",
        "description": "The golem targets one or more creatures it can see within 10 feet of it. Each target must make a DC 17 Wisdom saving throw against this magic. On a failed save, a target can't use reactions, its speed is halved, and it can't make more than one attack on its turn. In addition, the target can take either an action or a bonus action on its turn, not both. These effects last for 1 minute. A target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Roper",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Large",
    "alignment": "Neutral Evil",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 18,
    "dex": 8,
    "con": 17,
    "int": 7,
    "wis": 16,
    "cha": 6,
    "armorClass": 20,
    "hpMax": 93,
    "speed": "10 ft., climb 10 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [],
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the roper remains motionless, it is indistinguishable from a normal cave formation, such as a stalagmite."
      },
      {
        "name": "Grasping Tendrils",
        "description": "The roper can have up to six tendrils at a time. Each tendril can be attacked (AC 20; 10 hit points; immunity to poison and psychic damage). Destroying a tendril deals no damage to the roper, which can extrude a replacement tendril on its next turn. A tendril can also be broken if a creature takes an action and succeeds on a DC 15 Strength check against it."
      },
      {
        "name": "Spider Climb",
        "description": "The roper can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The roper makes four attacks with its tendrils, uses Reel, and makes one attack with its bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 22 (4d8 + 4) piercing damage."
      },
      {
        "name": "Tendril",
        "description": "Melee Weapon Attack: +7 to hit, reach 50 ft., one creature. Hit: The target is grappled (escape DC 15). Until the grapple ends, the target is restrained and has disadvantage on Strength checks and Strength saving throws, and the roper can't use the same tendril on another target."
      },
      {
        "name": "Reel",
        "description": "The roper pulls each creature grappled by it up to 25 feet straight toward it."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Otyugh",
    "type": "monster",
    "race": "Aberration",
    "size": "Large",
    "alignment": "Neutral",
    "challengeRating": "5",
    "experiencePoints": 1800,
    "str": 16,
    "dex": 11,
    "con": 19,
    "int": 6,
    "wis": 13,
    "cha": 6,
    "armorClass": 14,
    "hpMax": 114,
    "speed": "30 ft.",
    "savingThrowProficiencies": [
      "con"
    ],
    "skillProficiencies": [],
    "languages": [
      "Otyugh"
    ],
    "traits": [
      {
        "name": "Limited Telepathy",
        "description": "The otyugh can magically transmit simple messages and images to any creature within 120 feet of it that can understand a language. This form of telepathy doesn't allow the receiving creature to telepathically respond."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The otyugh makes three attacks: one with its bite and two with its tentacles."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) piercing damage. If the target is a creature, it must succeed on a DC 15 Constitution saving throw against disease or become poisoned until the disease is cured. Every 24 hours that elapse, the target must repeat the saving throw, reducing its hit point maximum by 5 (1d10) on a failure. The disease is cured on a success. The target dies if the disease reduces its hit point maximum to 0. This reduction to the target's hit point maximum lasts until the disease is cured."
      },
      {
        "name": "Tentacle",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage plus 4 (1d8) piercing damage. If the target is Medium or smaller, it is grappled (escape DC 13) and restrained until the grapple ends. The otyugh has two tentacles, each of which can grapple one target."
      },
      {
        "name": "Tentacle Slam",
        "description": "The otyugh slams creatures grappled by it into each other or a solid surface. Each creature must succeed on a DC 14 Constitution saving throw or take 10 (2d6 + 3) bludgeoning damage and be stunned until the end of the otyugh's next turn. On a successful save, the target takes half the bludgeoning damage and isn't stunned."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Rakshasa",
    "type": "monster",
    "race": "Fiend",
    "size": "Medium",
    "alignment": "Lawful Evil",
    "challengeRating": "13",
    "experiencePoints": 10000,
    "str": 14,
    "dex": 17,
    "con": 18,
    "int": 13,
    "wis": 16,
    "cha": 20,
    "armorClass": 16,
    "hpMax": 110,
    "speed": "40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "deception",
      "insight"
    ],
    "languages": [
      "Common",
      "Infernal"
    ],
    "traits": [
      {
        "name": "Limited Magic Immunity",
        "description": "The rakshasa can't be affected or detected by spells of 6th level or lower unless it wishes to be. It has advantage on saving throws against all other spells and magical effects."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The rakshasa's innate spellcasting ability is Charisma (spell save DC 18, +10 to hit with spell attacks). The rakshasa can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect thoughts, disguise self, mage hand, minor illusion"
      },
      {
        "name": "Trait",
        "description": "3/day each: charm person, detect magic, invisibility, major image, suggestion"
      },
      {
        "name": "Trait",
        "description": "1/day each: dominate person, fly, plane shift, true seeing"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The rakshasa makes two claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 2) slashing damage, and the target is cursed if it is a creature. The magical curse takes effect whenever the target takes a short or long rest, filling the target's thoughts with horrible images and dreams. The cursed target gains no benefit from finishing a short or long rest. The curse lasts until it is lifted by a remove curse spell or similar magic."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Aboleth",
    "type": "monster",
    "race": "Aberration",
    "size": "Large",
    "alignment": "Lawful Evil",
    "challengeRating": "10",
    "experiencePoints": 5900,
    "str": 21,
    "dex": 9,
    "con": 15,
    "int": 18,
    "wis": 15,
    "cha": 18,
    "armorClass": 17,
    "hpMax": 135,
    "speed": "10 ft., swim 40 ft.",
    "savingThrowProficiencies": [
      "con",
      "int",
      "wis"
    ],
    "skillProficiencies": [
      "history",
      "perception"
    ],
    "languages": [
      "Deep Speech",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The aboleth can breathe air and water."
      },
      {
        "name": "Mucous Cloud",
        "description": "While underwater, the aboleth is surrounded by transformative mucus. A creature that touches the aboleth or that hits it with a melee attack while within 5 feet of it must make a DC 14 Constitution saving throw. On a failure, the creature is diseased for 1d4 hours. The diseased creature can breathe only underwater."
      },
      {
        "name": "Probing Telepathy",
        "description": "If a creature communicates telepathically with the aboleth, the aboleth learns the creature's greatest desires if the aboleth can see the creature."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The aboleth makes three tentacle attacks."
      },
      {
        "name": "Tentacle",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 12 (2d6 + 5) bludgeoning damage. If the target is a creature, it must succeed on a DC 14 Constitution saving throw or become diseased. The disease has no effect for 1 minute and can be removed by any magic that cures disease. After 1 minute, the diseased creature's skin becomes translucent and slimy, the creature can't regain hit points unless it is underwater, and the disease can be removed only by heal or another disease-curing spell of 6th level or higher. When the creature is outside a body of water, it takes 6 (1d12) acid damage every 10 minutes unless moisture is applied to the skin before 10 minutes have passed."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft. one target. Hit: 15 (3d6 + 5) bludgeoning damage."
      },
      {
        "name": "Enslave (3/Day)",
        "description": "The aboleth targets one creature it can see within 30 feet of it. The target must succeed on a DC 14 Wisdom saving throw or be magically charmed by the aboleth until the aboleth dies or until it is on a different plane of existence from the target. The charmed target is under the aboleth's control and can't take reactions, and the aboleth and the target can communicate telepathically with each other over any distance."
      },
      {
        "name": "Action",
        "description": "Whenever the charmed target takes damage, the target can repeat the saving throw. On a success, the effect ends. No more than once every 24 hours, the target can also repeat the saving throw when it is at least 1 mile away from the aboleth."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The aboleth can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The aboleth regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Detect",
        "description": "The aboleth makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Swipe",
        "description": "The aboleth makes one tail attack."
      },
      {
        "name": "Psychic Drain (Costs 2 Actions)",
        "description": "One creature charmed by the aboleth takes 10 (3d6) psychic damage, and the aboleth regains hit points equal to the damage the creature takes."
      }
    ]
  },
  {
    "name": "Roc",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Gargantuan",
    "alignment": "Unaligned",
    "challengeRating": "11",
    "experiencePoints": 7200,
    "str": 28,
    "dex": 10,
    "con": 20,
    "int": 3,
    "wis": 10,
    "cha": 9,
    "armorClass": 15,
    "hpMax": 248,
    "speed": "20 ft., fly 120 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [],
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The roc has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The roc makes two attacks: one with its beak and one with its talons."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 27 (4d8 + 9) piercing damage."
      },
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +13 to hit, reach 5 ft., one target. Hit: 23 (4d6 + 9) slashing damage, and the target is grappled (escape DC 19). Until this grapple ends, the target is restrained, and the roc can't use its talons on another target."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Purple Worm",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Gargantuan",
    "alignment": "Unaligned",
    "challengeRating": "15",
    "experiencePoints": 13000,
    "str": 28,
    "dex": 7,
    "con": 22,
    "int": 1,
    "wis": 8,
    "cha": 4,
    "armorClass": 18,
    "hpMax": 247,
    "speed": "50 ft., burrow 30 ft.",
    "savingThrowProficiencies": [
      "con",
      "wis"
    ],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Tunneler",
        "description": "The worm can burrow through solid rock at half its burrow speed and leaves a 10-foot-diameter tunnel in its wake."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The worm makes two attacks: one with its bite and one with its stinger."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 22 (3d8 + 9) piercing damage. If the target is a Large or smaller creature, it must succeed on a DC 19 Dexterity saving throw or be swallowed by the worm. A swallowed creature is blinded and restrained, it has total cover against attacks and other effects outside the worm, and it takes 21 (6d6) acid damage at the start of each of the worm's turns."
      },
      {
        "name": "Action",
        "description": "If the worm takes 30 damage or more on a single turn from a creature inside it, the worm must succeed on a DC 21 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the worm. If the worm dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 20 feet of movement, exiting prone."
      },
      {
        "name": "Tail Stinger",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one creature. Hit: 19 (3d6 + 9) piercing damage, and the target must make a DC 19 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Remorhaz",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Huge",
    "alignment": "Unaligned",
    "challengeRating": "11",
    "experiencePoints": 7200,
    "str": 24,
    "dex": 13,
    "con": 21,
    "int": 4,
    "wis": 10,
    "cha": 5,
    "armorClass": 17,
    "hpMax": 195,
    "speed": "30 ft., burrow 20 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Heated Body",
        "description": "A creature that touches the remorhaz or hits it with a melee attack while within 5 feet of it takes 10 (3d6) fire damage."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 40 (6d10 + 7) piercing damage plus 10 (3d6) fire damage. If the target is a creature, it is grappled (escape DC 17). Until this grapple ends, the target is restrained, and the remorhaz can't bite another target."
      },
      {
        "name": "Swallow",
        "description": "The remorhaz makes one bite attack against a Medium or smaller creature it is grappling. If the attack hits, that creature takes the bite's damage and is swallowed, and the grapple ends. While swallowed, the creature is blinded and restrained, it has total cover against attacks and other effects outside the remorhaz, and it takes 21 (6d6) acid damage at the start of each of the remorhaz's turns."
      },
      {
        "name": "Action",
        "description": "If the remorhaz takes 30 damage or more on a single turn from a creature inside it, the remorhaz must succeed on a DC 15 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the remorhaz. If the remorhaz dies, a swallowed creature is no longer restrained by it and can escape from the corpse using 15 feet of movement, exiting prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Behir",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Huge",
    "alignment": "Neutral Evil",
    "challengeRating": "11",
    "experiencePoints": 7200,
    "str": 23,
    "dex": 16,
    "con": 18,
    "int": 7,
    "wis": 14,
    "cha": 12,
    "armorClass": 17,
    "hpMax": 168,
    "speed": "50 ft., climb 40 ft.",
    "savingThrowProficiencies": [],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Draconic"
    ],
    "traits": [],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The behir makes two attacks: one with its bite and one to constrict."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 22 (3d10 + 6) piercing damage."
      },
      {
        "name": "Constrict",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one Large or smaller creature. Hit: 17 (2d10 + 6) bludgeoning damage plus 17 (2d10 + 6) slashing damage. The target is grappled (escape DC 16) if the behir isn't already constricting a creature, and the target is restrained until this grapple ends."
      },
      {
        "name": "Lightning Breath (Recharge 5–6)",
        "description": "The behir exhales a line of lightning that is 20 feet long and 5 feet wide. Each creature in that line must make a DC 16 Dexterity saving throw, taking 66 (12d10) lightning damage on a failed save, or half as much damage on a successful one."
      },
      {
        "name": "Swallow",
        "description": "The behir makes one bite attack against a Medium or smaller target it is grappling. If the attack hits, the target is also swallowed, and the grapple ends. While swallowed, the target is blinded and restrained, it has total cover against attacks and other effects outside the behir, and it takes 21 (6d6) acid damage at the start of each of the behir's turns. A behir can have only one creature swallowed at a time."
      },
      {
        "name": "Action",
        "description": "If the behir takes 30 damage or more on a single turn from the swallowed creature, the behir must succeed on a DC 14 Constitution saving throw at the end of that turn or regurgitate the creature, which falls prone in a space within 10 feet of the behir. If the behir dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 15 feet of movement, exiting prone."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Adult Red Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Huge",
    "alignment": "Chaotic Evil",
    "challengeRating": "17",
    "experiencePoints": 18000,
    "str": 27,
    "dex": 10,
    "con": 25,
    "int": 16,
    "wis": 13,
    "cha": 21,
    "armorClass": 19,
    "hpMax": 256,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 7 (2d6) fire damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +14 to hit, reach 5 ft., one target. Hit: 15 (2d6 + 8) slashing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +14 to hit, reach 15 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage."
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours."
      },
      {
        "name": "Fire Breath (Recharge 5–6)",
        "description": "The dragon exhales fire in a 60-foot cone. Each creature in that area must make a DC 21 Dexterity saving throw, taking 63 (18d6) fire damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The dragon can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The dragon regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 feet of the dragon must succeed on a DC 22 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Black Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Huge",
    "alignment": "Chaotic Evil",
    "challengeRating": "14",
    "experiencePoints": 11500,
    "str": 23,
    "dex": 14,
    "con": 21,
    "int": 14,
    "wis": 13,
    "cha": 17,
    "armorClass": 19,
    "hpMax": 195,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 4 (1d8) acid damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage."
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours."
      },
      {
        "name": "Acid Breath (Recharge 5–6)",
        "description": "The dragon exhales acid in a 60-­foot line that is 5 feet wide. Each creature in that line must make a DC 18 Dexterity saving throw, taking 54 (12d8) acid damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The dragon can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The dragon regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 feet of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Blue Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Huge",
    "alignment": "Lawful Evil",
    "challengeRating": "16",
    "experiencePoints": 15000,
    "str": 25,
    "dex": 10,
    "con": 23,
    "int": 16,
    "wis": 15,
    "cha": 19,
    "armorClass": 19,
    "hpMax": 225,
    "speed": "40 ft., burrow 30 ft., fly 80 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 18 (2d10 + 7) piercing damage plus 5 (1d10) lightning damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +12 to hit, reach 5 ft., one target. Hit: 14 (2d6 + 7) slashing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +12 to hit, reach 15 ft., one target. Hit: 16 (2d8 + 7) bludgeoning damage."
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 17 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours."
      },
      {
        "name": "Lightning Breath (Recharge 5–6)",
        "description": "The dragon exhales lightning in a 90-­foot line that is 5 feet wide. Each creature in that line must make a DC 19 Dexterity saving throw, taking 66 (12d10) lightning damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The dragon can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The dragon regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 feet of the dragon must succeed on a DC 20 Dexterity saving throw or take 14 (2d6 + 7) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult White Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Huge",
    "alignment": "Chaotic Evil",
    "challengeRating": "13",
    "experiencePoints": 10000,
    "str": 22,
    "dex": 10,
    "con": 22,
    "int": 8,
    "wis": 12,
    "cha": 12,
    "armorClass": 18,
    "hpMax": 200,
    "speed": "40 ft., burrow 30 ft., fly 80 ft., swim 40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Ice Walk",
        "description": "The dragon can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra movement."
      },
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 4 (1d8) cold damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage."
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 14 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours."
      },
      {
        "name": "Cold Breath (Recharge 5–6)",
        "description": "The dragon exhales an icy blast in a 60-foot cone. Each creature in that area must make a DC 19 Constitution saving throw, taking 54 (12d8) cold damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The dragon can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The dragon regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 feet of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Green Dragon",
    "type": "monster",
    "race": "Dragon",
    "size": "Huge",
    "alignment": "Lawful Evil",
    "challengeRating": "15",
    "experiencePoints": 13000,
    "str": 23,
    "dex": 12,
    "con": 21,
    "int": 18,
    "wis": 15,
    "cha": 17,
    "armorClass": 19,
    "hpMax": 207,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "savingThrowProficiencies": [
      "dex",
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "deception",
      "insight",
      "perception",
      "persuasion",
      "stealth"
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 7 (2d6) poison damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage."
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours."
      },
      {
        "name": "Poison Breath (Recharge 5–6)",
        "description": "The dragon exhales poisonous gas in a 60-foot cone. Each creature in that area must make a DC 18 Constitution saving throw, taking 56 (16d6) poison damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The dragon can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The dragon regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 feet of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Solar",
    "type": "monster",
    "race": "Celestial",
    "size": "Large",
    "alignment": "Lawful Good",
    "challengeRating": "21",
    "experiencePoints": 33000,
    "str": 26,
    "dex": 22,
    "con": 26,
    "int": 25,
    "wis": 25,
    "cha": 30,
    "armorClass": 21,
    "hpMax": 243,
    "speed": "50 ft., fly 150 ft.",
    "savingThrowProficiencies": [
      "int",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "All",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Angelic Weapons",
        "description": "The solar's weapon attacks are magical. When the solar hits with any weapon, the weapon deals an extra 6d8 radiant damage (included in the attack)."
      },
      {
        "name": "Divine Awareness",
        "description": "The solar knows if it hears a lie."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The solar's spellcasting ability is Charisma (spell save DC 25). It can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect evil and good, invisibility (self only)"
      },
      {
        "name": "Trait",
        "description": "3/day each: blade barrier, dispel evil and good, resurrection"
      },
      {
        "name": "Trait",
        "description": "1/day each: commune, control weather"
      },
      {
        "name": "Magic Resistance",
        "description": "The solar has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The solar makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +15 to hit, reach 5 ft., one target. Hit: 22 (4d6 + 8) slashing damage plus 27 (6d8) radiant damage."
      },
      {
        "name": "Slaying Longbow",
        "description": "Ranged Weapon Attack: +13 to hit, range 150/600 ft., one target. Hit: 15 (2d8 + 6) piercing damage plus 27 (6d8) radiant damage. If the target is a creature that has 100 hit points or fewer, it must succeed on a DC 15 Constitution saving throw or die."
      },
      {
        "name": "Flying Sword",
        "description": "The solar releases its greatsword to hover magically in an unoccupied space within 5 feet of it. If the solar can see the sword, the solar can mentally command it as a bonus action to fly up to 50 feet and either make one attack against a target or return to the solar's hands. If the hovering sword is targeted by any effect, the solar is considered to be holding it. The hovering sword falls if the solar dies."
      },
      {
        "name": "Healing Touch (4/Day)",
        "description": "The solar touches another creature. The target magically regains 40 (8d8 + 4) hit points and is freed from any curse, disease, poison, blindness, or deafness."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The solar can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The solar regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Teleport",
        "description": "The solar magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see."
      },
      {
        "name": "Searing Burst (Costs 2 Actions)",
        "description": "The solar emits magical, divine energy. Each creature of its choice in a 10-foot radius must make a DC 23 Dexterity saving throw, taking 14 (4d6) fire damage plus 14 (4d6) radiant damage on a failed save, or half as much damage on a successful one."
      },
      {
        "name": "Blinding Gaze (Costs 3 Actions)",
        "description": "The solar targets one creature it can see within 30 feet of it. If the target can see it, the target must succeed on a DC 15 Constitution saving throw or be blinded until magic such as the lesser restoration spell removes the blindness."
      }
    ]
  },
  {
    "name": "Planetar",
    "type": "monster",
    "race": "Celestial",
    "size": "Large",
    "alignment": "Lawful Good",
    "challengeRating": "16",
    "experiencePoints": 15000,
    "str": 24,
    "dex": 20,
    "con": 24,
    "int": 19,
    "wis": 22,
    "cha": 25,
    "armorClass": 19,
    "hpMax": 200,
    "speed": "40 ft., fly 120 ft.",
    "savingThrowProficiencies": [
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "perception"
    ],
    "languages": [
      "All",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Angelic Weapons",
        "description": "The planetar's weapon attacks are magical. When the planetar hits with any weapon, the weapon deals an extra 5d8 radiant damage (included in the attack)."
      },
      {
        "name": "Divine Awareness",
        "description": "The planetar knows if it hears a lie."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The planetar's spellcasting ability is Charisma (spell save DC 20). The planetar can innately cast the following spells, requiring no material components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect evil and good, invisibility (self only)"
      },
      {
        "name": "Trait",
        "description": "3/day each: blade barrier, dispel evil and good, flame strike, raise dead"
      },
      {
        "name": "Trait",
        "description": "1/day each: commune, control weather, insect plague"
      },
      {
        "name": "Magic Resistance",
        "description": "The planetar has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The planetar makes two melee attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +12 to hit, reach 5 ft., one target. Hit: 21 (4d6 + 7) slashing damage plus 22 (5d8) radiant damage."
      },
      {
        "name": "Healing Touch (4/Day)",
        "description": "The planetar touches another creature. The target magically regains 30 (6d8 + 3) hit points and is freed from any curse, disease, poison, blindness, or deafness."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Deva",
    "type": "monster",
    "race": "Celestial",
    "size": "Medium",
    "alignment": "Lawful Good",
    "challengeRating": "10",
    "experiencePoints": 5900,
    "str": 18,
    "dex": 18,
    "con": 18,
    "int": 17,
    "wis": 20,
    "cha": 20,
    "armorClass": 17,
    "hpMax": 136,
    "speed": "30 ft., fly 90 ft.",
    "savingThrowProficiencies": [
      "wis",
      "cha"
    ],
    "skillProficiencies": [
      "insight",
      "perception"
    ],
    "languages": [
      "All",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Angelic Weapons",
        "description": "The deva's weapon attacks are magical. When the deva hits with any weapon, the weapon deals an extra 4d8 radiant damage (included in the attack)."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The deva's spellcasting ability is Charisma (spell save DC 17). The deva can innately cast the following spells, requiring only verbal components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect evil and good"
      },
      {
        "name": "Trait",
        "description": "1/day each: commune, raise dead"
      },
      {
        "name": "Magic Resistance",
        "description": "The deva has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The deva makes two melee attacks."
      },
      {
        "name": "Mace",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) bludgeoning damage plus 18 (4d8) radiant damage."
      },
      {
        "name": "Healing Touch (3/Day)",
        "description": "The deva touches another creature. The target magically regains 20 (4d8 + 2) hit points and is freed from any curse, disease, poison, blindness, or deafness."
      },
      {
        "name": "Change Shape",
        "description": "The deva magically polymorphs into a humanoid or beast that has a challenge rating equal to or less than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the deva's choice)."
      },
      {
        "name": "Action",
        "description": "In a new form, the deva retains its game statistics and ability to speak, but its AC, movement modes, Strength, Dexterity, and special senses are replaced by those of the new form, and it gains any statistics and capabilities (except class features, legendary actions, and lair actions) that the new form has but that it lacks."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Couatl",
    "type": "monster",
    "race": "Celestial",
    "size": "Medium",
    "alignment": "Lawful Good",
    "challengeRating": "4",
    "experiencePoints": 1100,
    "str": 16,
    "dex": 20,
    "con": 17,
    "int": 18,
    "wis": 20,
    "cha": 18,
    "armorClass": 19,
    "hpMax": 97,
    "speed": "30 ft., fly 90 ft.",
    "savingThrowProficiencies": [
      "con",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [
      "All",
      "Telepathy 120 Ft."
    ],
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "The couatl's spellcasting ability is Charisma (spell save DC 14). It can innately cast the following spells, requiring only verbal components:"
      },
      {
        "name": "Trait",
        "description": "At will: detect evil and good, detect magic, detect thoughts"
      },
      {
        "name": "Trait",
        "description": "3/day each: bless, create food and water, cure wounds, lesser restoration, protection from poison, sanctuary, shield"
      },
      {
        "name": "Trait",
        "description": "1/day each: dream, greater restoration, scrying"
      },
      {
        "name": "Magic Weapons",
        "description": "The couatl's weapon attacks are magical."
      },
      {
        "name": "Shielded Mind",
        "description": "The couatl is immune to scrying and to any effect that would sense its emotions, read its thoughts, or detect its location."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one creature. Hit: 8 (1d6 + 5) piercing damage, and the target must succeed on a DC 13 Constitution saving throw or be poisoned for 24 hours. Until this poison ends, the target is unconscious. Another creature can use an action to shake the target awake."
      },
      {
        "name": "Constrict",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one Medium or smaller creature. Hit: 10 (2d6 + 3) bludgeoning damage, and the target is grappled (escape DC 15). Until this grapple ends, the target is restrained, and the couatl can't constrict another target."
      },
      {
        "name": "Change Shape",
        "description": "The couatl magically polymorphs into a humanoid or beast that has a challenge rating equal to or less than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the couatl's choice)."
      },
      {
        "name": "Action",
        "description": "In a new form, the couatl retains its game statistics and ability to speak, but its AC, movement modes, Strength, Dexterity, and other actions are replaced by those of the new form, and it gains any statistics and capabilities (except class features, legendary actions, and lair actions) that the new form has but that it lacks. If the new form has a bite attack, the couatl can use its bite in that form."
      }
    ],
    "reactions": [],
    "legendaryActions": []
  },
  {
    "name": "Kraken",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Gargantuan",
    "alignment": "Chaotic Evil",
    "challengeRating": "23",
    "experiencePoints": 50000,
    "str": 30,
    "dex": 11,
    "con": 25,
    "int": 22,
    "wis": 18,
    "cha": 20,
    "armorClass": 18,
    "hpMax": 472,
    "speed": "20 ft., swim 60 ft.",
    "savingThrowProficiencies": [
      "str",
      "dex",
      "con",
      "int",
      "wis"
    ],
    "skillProficiencies": [],
    "languages": [
      "Abyssal",
      "Celestial",
      "Infernal",
      "Primordial",
      "Telepathy 120 Ft. But Can't Speak"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "The kraken can breathe air and water."
      },
      {
        "name": "Freedom of Movement",
        "description": "The kraken ignores difficult terrain, and magical effects can't reduce its speed or cause it to be restrained. It can spend 5 feet of movement to escape from nonmagical restraints or being grappled."
      },
      {
        "name": "Siege Monster",
        "description": "The kraken deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The kraken makes three tentacle attacks, each of which it can replace with one use of Fling."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +17 to hit, reach 5 ft., one target. Hit: 23 (3d8 + 10) piercing damage. If the target is a Large or smaller creature grappled by the kraken, that creature is swallowed, and the grapple ends. While swallowed, the creature is blinded and restrained, it has total cover against attacks and other effects outside the kraken, and it takes 42 (12d6) acid damage at the start of each of the kraken's turns."
      },
      {
        "name": "Action",
        "description": "If the kraken takes 50 damage or more on a single turn from a creature inside it, the kraken must succeed on a DC 25 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the kraken. If the kraken dies, a swallowed creature is no longer restrained by it and can escape from the corpse using 15 feet of movement, exiting prone."
      },
      {
        "name": "Tentacle",
        "description": "Melee Weapon Attack: +17 to hit, reach 30 ft., one target. Hit: 20 (3d6 + 10) bludgeoning damage, and the target is grappled (escape DC 18). Until this grapple ends, the target is restrained. The kraken has ten tentacles, each of which can grapple one target."
      },
      {
        "name": "Fling",
        "description": "One Large or smaller object held or creature grappled by the kraken is thrown up to 60 feet in a random direction and knocked prone. If a thrown target strikes a solid surface, the target takes 3 (1d6) bludgeoning damage for every 10 feet it was thrown. If the target is thrown at another creature, that creature must succeed on a DC 18 Dexterity saving throw or take the same damage and be knocked prone."
      },
      {
        "name": "Lightning Storm",
        "description": "The kraken magically creates three bolts of lightning, each of which can strike a target the kraken can see within 120 feet of it. A target must make a DC 23 Dexterity saving throw, taking 22 (4d10) lightning damage on a failed save, or half as much damage on a successful one."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The kraken can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The kraken regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Tentacle Attack or Fling",
        "description": "The kraken makes one tentacle attack or uses its Fling."
      },
      {
        "name": "Lightning Storm (Costs 2 Actions)",
        "description": "The kraken uses Lightning Storm."
      },
      {
        "name": "Ink Cloud (Costs 3 Actions)",
        "description": "While underwater, the kraken expels an ink cloud in a 60-foot radius. The cloud spreads around corners, and that area is heavily obscured to creatures other than the kraken. Each creature other than the kraken that ends its turn there must succeed on a DC 23 Constitution saving throw, taking 16 (3d10) poison damage on a failed save, or half as much damage on a successful one. A strong current disperses the cloud, which otherwise disappears at the end of the kraken's next turn."
      }
    ]
  },
  {
    "name": "Tarrasque",
    "type": "monster",
    "race": "Monstrosity",
    "size": "Gargantuan",
    "alignment": "Unaligned",
    "challengeRating": "30",
    "experiencePoints": 155000,
    "str": 30,
    "dex": 11,
    "con": 30,
    "int": 3,
    "wis": 11,
    "cha": 11,
    "armorClass": 25,
    "hpMax": 676,
    "speed": "40 ft.",
    "savingThrowProficiencies": [
      "int",
      "wis",
      "cha"
    ],
    "skillProficiencies": [],
    "languages": [],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the tarrasque fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Magic Resistance",
        "description": "The tarrasque has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Reflective Carapace",
        "description": "Any time the tarrasque is targeted by a magic missile spell, a line spell, or a spell that requires a ranged attack roll, roll a d6. On a 1 to 5, the tarrasque is unaffected. On a 6, the tarrasque is unaffected, and the effect is reflected back at the caster as though it originated from the tarrasque, turning the caster into the target."
      },
      {
        "name": "Siege Monster",
        "description": "The tarrasque deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The tarrasque can use its Frightful Presence. It then makes five attacks: one with its bite, two with its claws, one with its horns, and one with its tail. It can use its Swallow instead of its bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +19 to hit, reach 10 ft., one target. Hit: 36 (4d12 + 10) piercing damage. If the target is a creature, it is grappled (escape DC 20). Until this grapple ends, the target is restrained, and the tarrasque can't bite another target."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +19 to hit, reach 15ft., one target. Hit: 28 (4d8 + 10) slashing damage."
      },
      {
        "name": "Horns",
        "description": "Melee Weapon Attack: +19 to hit, reach 10ft., one target. Hit: 32 (4d10 + 10) piercing damage."
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +19 to hit, reach 20ft., one target. Hit: 24 (4d6 + 10) bludgeoning damage. If the target is a creature, it must succeed on a DC 20 Strength saving throw or be knocked prone."
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the tarrasque's choice within 120 feet of it and aware of it must succeed on a DC 17 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, with disadvantage if the tarrasque is within line of sight, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the tarrasque's Frightful Presence for the next 24 hours."
      },
      {
        "name": "Swallow",
        "description": "The tarrasque makes one bite attack against a Large or smaller creature it is grappling. If the attack hits, the target takes the bite's damage, the target is swallowed, and the grapple ends. While swallowed, the creature is blinded and restrained, it has total cover against attacks and other effects outside the tarrasque, and it takes 56 (16d6) acid damage at the start of each of the tarrasque's turns."
      },
      {
        "name": "Action",
        "description": "If the tarrasque takes 60 damage or more on a single turn from a creature inside it, the tarrasque must succeed on a DC 20 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the tarrasque. If the tarrasque dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 30 feet of movement, exiting prone."
      }
    ],
    "reactions": [],
    "legendaryActions": [
      {
        "name": "Legendary Actions",
        "description": "The tarrasque can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The tarrasque regains spent legendary actions at the start of its turn."
      },
      {
        "name": "Attack",
        "description": "The tarrasque makes one claw attack or tail attack."
      },
      {
        "name": "Move",
        "description": "The tarrasque moves up to half its speed."
      },
      {
        "name": "Chomp (Costs 2 Actions)",
        "description": "The tarrasque makes one bite attack or uses its Swallow."
      }
    ]
  }
];
