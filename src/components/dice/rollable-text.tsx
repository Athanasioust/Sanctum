"use client";

import { Fragment } from "react";
import { RollableFormula } from "@/components/dice/rollable-stat";

/**
 * Matches the two things worth clicking in stat-block and spell prose:
 * an attack bonus ("+7 to hit") and a damage expression ("2d6 + 3", "1d8").
 */
const ROLLABLE = /([+-]\d+)\s+to hit|(\d+)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?/gi;

type Segment =
  | { kind: "text"; text: string }
  | { kind: "roll"; text: string; formula: string; label: string };

/** Split prose into plain text and rollable expressions. */
export function findRollables(text: string, label: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = new RegExp(ROLLABLE.source, ROLLABLE.flags);
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ kind: "text", text: text.slice(last, match.index) });
    }
    if (match[1]) {
      segments.push({
        kind: "roll",
        text: match[0],
        formula: `1d20${match[1]}`,
        label: `${label} attack`,
      });
    } else {
      const modifier = match[4] && match[5] ? `${match[4]}${match[5]}` : "";
      segments.push({
        kind: "roll",
        text: match[0],
        formula: `${match[2]}d${match[3]}${modifier}`,
        label: `${label} damage`,
      });
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) segments.push({ kind: "text", text: text.slice(last) });
  return segments;
}

/**
 * Render prose with its attack bonuses and damage dice turned into one-click
 * rolls, leaving the wording of the stat block otherwise untouched.
 */
export function RollableText({
  text,
  label,
  actorName,
}: {
  text: string;
  label: string;
  actorName?: string;
}) {
  const segments = findRollables(text, label);
  return (
    <>
      {segments.map((segment, i) =>
        segment.kind === "text" ? (
          <Fragment key={i}>{segment.text}</Fragment>
        ) : (
          <RollableFormula
            key={i}
            formula={segment.formula}
            label={segment.label}
            actorName={actorName}
            display={segment.text}
          />
        ),
      )}
    </>
  );
}
