"use client";

import { useRouter } from "next/navigation";
import { useCombatChanges } from "@/lib/combat-sync";

/**
 * Re-renders the page when another window starts, ends or reopens a fight —
 * so a popped-out tracker sitting on "No active encounter" picks up the
 * encounter the DM just started in the main window.
 */
export function CombatRefresher() {
  const router = useRouter();
  useCombatChanges(() => router.refresh(), 400);
  return null;
}
