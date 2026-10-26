"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/form";
import { useT } from "@/components/i18n/i18n-provider";
import { COMBAT_LOG_ADDED_EVENT } from "@/components/dice/dice-roller";
import { api } from "@/lib/client";
import { announceCombatChange } from "@/lib/combat-sync";
import { applyHpDelta, concentrationDc } from "@/lib/combat-hp";
import { DAMAGE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BattleToken, CombatParticipant } from "@/db/schema";

/** Which tokens the template hits and which of them made their save. */
export type AoeSelection = { affected: string[]; saved: string[] };

/**
 * Damage everyone under an AoE template in one go. The DM starts from the
 * tokens whose centre is inside the template, adjusts who's caught and who
 * saved, and each hit goes through the same HP rules as the tracker (temp HP
 * first, never below 0) before one summary line lands in the combat log.
 */
export function AoeDamagePanel({
  tokens,
  participants,
  encounterId,
  round,
  selection,
  onSelectionChange,
  onApplied,
}: {
  tokens: BattleToken[];
  participants: CombatParticipant[];
  encounterId: number;
  round: number;
  selection: AoeSelection;
  onSelectionChange: (next: AoeSelection) => void;
  onApplied: () => void;
}) {
  const t = useT();
  const [effect, setEffect] = useState("");
  const [amount, setAmount] = useState("");
  const [damageType, setDamageType] = useState("");
  const [saveForHalf, setSaveForHalf] = useState(true);
  const [applying, setApplying] = useState(false);

  const byId = new Map(participants.map((p) => [p.id, p]));
  // Only tokens tied to a combatant have HP to take damage from.
  const targets = tokens
    .map((token) => ({
      token,
      participant: token.participantId !== undefined ? byId.get(token.participantId) : undefined,
    }))
    .filter((x): x is { token: BattleToken; participant: CombatParticipant } => !!x.participant);
  const affected = new Set(selection.affected);
  const saved = new Set(selection.saved);
  const caught = targets.filter((x) => affected.has(x.token.id));

  function toggle(list: "affected" | "saved", tokenId: string) {
    const set = new Set(selection[list]);
    if (set.has(tokenId)) set.delete(tokenId);
    else set.add(tokenId);
    onSelectionChange({ ...selection, [list]: [...set] });
  }

  function setAllSaved(all: boolean) {
    onSelectionChange({
      ...selection,
      saved: all ? caught.map((x) => x.token.id) : [],
    });
  }

  async function apply() {
    const dmg = Math.max(0, Math.round(Number(amount)));
    if (!dmg || caught.length === 0) return;
    setApplying(true);
    const type = damageType.trim().toLowerCase();
    const label = effect.trim() || t("aoe.defaultEffect");
    const lines: string[] = [];
    try {
      for (const { token, participant: p } of caught) {
        const madeSave = saveForHalf && saved.has(token.id);
        const taken = madeSave ? Math.floor(dmg / 2) : dmg;
        const next = applyHpDelta(p, -taken);
        await api.patch(`/api/participants/${p.id}`, next);
        const dealt = p.hpCurrent - next.hpCurrent + (p.hpTemp - next.hpTemp);
        if (dealt > 0 && p.concentrationSpell) {
          toast.warning(
            `${p.name} is concentrating on ${p.concentrationSpell}! CON save DC ${concentrationDc(dealt)}`,
            { duration: 6000 },
          );
        }
        const outcome = saveForHalf ? ` (${madeSave ? "saved" : "failed"})` : "";
        lines.push(`${taken}${type ? ` ${type}` : ""} to ${p.name}${outcome}`);
      }
      const summary = lines.join(", ");
      await api.post("/api/combat-log", {
        encounterId,
        round,
        actorName: label.slice(0, 120),
        // The log's action field is short; a big blast spills into details.
        action: summary.length <= 200 ? summary : `${caught.length} creatures hit`,
        details: summary.length <= 200 ? "" : summary.slice(0, 2000),
      });
      window.dispatchEvent(new Event(COMBAT_LOG_ADDED_EVENT));
      announceCombatChange(encounterId);
      toast.success(`${label}: ${summary}`);
      setAmount("");
      onApplied();
    } catch {
      toast.error(t("aoe.failed"));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <h4 className="flex items-center gap-1.5 text-sm font-medium">
        <Flame className="size-4 text-orange-400" /> {t("aoe.title")}
      </h4>
      {targets.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("aoe.noTargets")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("aoe.effect")}>
              <Input
                value={effect}
                onChange={(e) => setEffect(e.target.value)}
                placeholder="Fireball"
                maxLength={120}
              />
            </Field>
            <Field label={t("aoe.damage")}>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="28"
              />
            </Field>
          </div>
          <Field label={t("aoe.type")}>
            <Input
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              list="aoe-damage-types"
              placeholder="fire"
              maxLength={40}
            />
            <datalist id="aoe-damage-types">
              {DAMAGE_TYPES.map((d) => (
                <option key={d} value={d.toLowerCase()} />
              ))}
            </datalist>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveForHalf}
              onChange={(e) => setSaveForHalf(e.target.checked)}
              className="accent-primary"
            />
            {t("aoe.saveForHalf")}
          </label>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t("aoe.caught")} ({caught.length})
              </span>
              {saveForHalf && caught.length > 0 ? (
                <span className="flex gap-2">
                  <button type="button" className="hover:text-foreground" onClick={() => setAllSaved(false)}>
                    {t("aoe.allFailed")}
                  </button>
                  <button type="button" className="hover:text-foreground" onClick={() => setAllSaved(true)}>
                    {t("aoe.allSaved")}
                  </button>
                </span>
              ) : null}
            </div>
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {targets.map(({ token, participant: p }) => {
                const isIn = affected.has(token.id);
                const madeSave = saved.has(token.id);
                return (
                  <li
                    key={token.id}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1 text-sm",
                      isIn ? "bg-orange-500/10" : "opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isIn}
                      onChange={() => toggle("affected", token.id)}
                      className="accent-primary"
                      aria-label={`${p.name}: ${t("aoe.caught")}`}
                    />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {p.hpCurrent}/{p.hpMax}
                    </span>
                    {saveForHalf && isIn ? (
                      <button
                        type="button"
                        onClick={() => toggle("saved", token.id)}
                        aria-pressed={madeSave}
                        className={cn(
                          "rounded-full border px-1.5 py-0.5 text-[11px] leading-none",
                          madeSave
                            ? "border-emerald-500/50 text-emerald-300"
                            : "border-red-500/40 text-red-300",
                        )}
                      >
                        {madeSave ? t("aoe.saved") : t("aoe.failedSave")}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={apply}
            disabled={applying || caught.length === 0 || !(Number(amount) > 0)}
          >
            <Flame className="size-4" />
            {applying ? t("common.saving") : t("aoe.apply")}
          </Button>
        </>
      )}
    </div>
  );
}
