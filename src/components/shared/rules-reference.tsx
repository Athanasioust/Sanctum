"use client";

import { useState } from "react";
import { BookOpen, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type RuleSection = {
  title: string;
  entries: { term: string; detail: string }[];
};

const CONDITION_RULES: RuleSection = {
  title: "Conditions",
  entries: [
    { term: "Blinded", detail: "Can't see, auto-fails checks requiring sight, attacks at disadvantage against it, attacks against it at advantage." },
    { term: "Charmed", detail: "Can't attack charmer. Charmer has advantage on social checks against it." },
    { term: "Deafened", detail: "Can't hear, auto-fails hearing checks." },
    { term: "Frightened", detail: "Disadvantage on checks/attacks while source is in sight. Can't move closer." },
    { term: "Grappled", detail: "Speed 0. Ends if grappler incapacitated or creature moved out of reach." },
    { term: "Incapacitated", detail: "Can't take actions or reactions." },
    { term: "Invisible", detail: "Can't be seen without special sense. Advantage on attacks, attacks against at disadvantage." },
    { term: "Paralyzed", detail: "Incapacitated + can't move or speak. Auto-fail STR/DEX saves. Attacks against at advantage. Critical if within 5 ft." },
    { term: "Petrified", detail: "Transformed to stone. Incapacitated, auto-fail STR/DEX, resistance to all damage, immune to poison/disease." },
    { term: "Poisoned", detail: "Disadvantage on attack rolls and ability checks." },
    { term: "Prone", detail: "Can only crawl. Disadvantage on attacks. Attacks within 5 ft advantage, beyond 5 ft disadvantage." },
    { term: "Restrained", detail: "Speed 0. Attack rolls disadvantage. DEX saves disadvantage. Attacks against at advantage." },
    { term: "Stunned", detail: "Incapacitated, can't move, can speak only falteringly. Auto-fail STR/DEX. Attacks against at advantage." },
    { term: "Unconscious", detail: "Incapacitated, can't move/speak, no awareness. Auto-fail STR/DEX. Attacks against at advantage + crit within 5 ft." },
  ],
};

const COMBAT_RULES: RuleSection = {
  title: "Combat Quick Reference",
  entries: [
    { term: "Initiative", detail: "DEX check at combat start. Higher goes first. Ties: higher DEX modifier. Further ties: simultaneous." },
    { term: "Attack Roll", detail: "d20 + ability modifier + proficiency (if proficient) vs target AC." },
    { term: "Critical Hit", detail: "Natural 20. Roll all damage dice twice, add modifiers once." },
    { term: "Cover (Half)", detail: "+2 AC and DEX saves from attacks and effects originating past the cover." },
    { term: "Cover (Three-Quarters)", detail: "+5 AC and DEX saves." },
    { term: "Total Cover", detail: "Can't be targeted directly. Can still be affected by AoE." },
    { term: "Disengage", detail: "Action. Your movement doesn't provoke opportunity attacks for the rest of your turn." },
    { term: "Dodge", detail: "Action. Attackers have disadvantage. DEX saves at advantage. No benefit if incapacitated or speed 0." },
    { term: "Help", detail: "Action. Give one ally advantage on next ability check or attack this turn." },
    { term: "Hide", detail: "Action. DEX (Stealth) vs passive Perception. Must be heavily obscured or behind cover." },
    { term: "Ready", detail: "Action. Specify trigger + reaction. Reaction used before end of your next turn or lost." },
    { term: "Opportunity Attack", detail: "Reaction when a hostile creature leaves your reach voluntarily without Disengage." },
    { term: "Concentration", detail: "Broken by: taking damage (CON save DC 10 or half damage), incapacitation, death, casting another concentration spell." },
    { term: "Death Saves", detail: "At 0 HP: d20 at turn start. 10+ success (3 = stable), 1-9 failure (3 = dead). Natural 20 = 1 HP. Natural 1 = 2 failures." },
  ],
};

const EXHAUSTION_RULES: RuleSection = {
  title: "Exhaustion Levels",
  entries: [
    { term: "Level 1", detail: "Disadvantage on ability checks." },
    { term: "Level 2", detail: "Speed halved." },
    { term: "Level 3", detail: "Disadvantage on attack rolls and saving throws." },
    { term: "Level 4", detail: "Hit point maximum halved." },
    { term: "Level 5", detail: "Speed reduced to 0." },
    { term: "Level 6", detail: "Death." },
  ],
};

const RESTS_RULES: RuleSection = {
  title: "Rests",
  entries: [
    { term: "Short Rest", detail: "≥1 hour. Spend Hit Dice to regain HP (roll die + CON mod per die). Each die adds that much HP." },
    { term: "Long Rest", detail: "≥8 hours (≤2 hours of activity). Regain all HP. Regain half Hit Dice (min 1). Reset exhaustion by 1 level." },
  ],
};

const PROFICIENCY_BONUS: RuleSection = {
  title: "Proficiency Bonus by Level",
  entries: [
    { term: "Levels 1–4", detail: "+2" },
    { term: "Levels 5–8", detail: "+3" },
    { term: "Levels 9–12", detail: "+4" },
    { term: "Levels 13–16", detail: "+5" },
    { term: "Levels 17–20", detail: "+6" },
  ],
};

const SECTIONS = [COMBAT_RULES, CONDITION_RULES, EXHAUSTION_RULES, RESTS_RULES, PROFICIENCY_BONUS];

function CollapsibleSection({ section }: { section: RuleSection }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-1 py-3 text-left text-sm font-semibold hover:text-primary"
      >
        {section.title}
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <ul className="mb-3 space-y-2 px-1">
          {section.entries.map((e) => (
            <li key={e.term} className="rounded-lg bg-muted/40 p-2.5 text-xs">
              <span className="font-semibold text-foreground">{e.term}:</span>{" "}
              <span className="text-muted-foreground">{e.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RulesReference() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="D&D 5e Rules Reference">
          <BookOpen className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" /> D&amp;D 5e Quick Reference
          </SheetTitle>
        </SheetHeader>
        <div>
          {SECTIONS.map((s) => (
            <CollapsibleSection key={s.title} section={s} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
