"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** How long to keep looking for a record that renders late (lists load async, tabs switch). */
const LOOK_FOR_MS = 2500;
const HIGHLIGHT_MS = 2400;

/**
 * Deep-links from search to a single record on a list page.
 *
 * A link carrying `?focus=<type>-<id>` scrolls the card marked
 * `data-record="<type>-<id>"` into view and briefly rings it. If the card sits
 * on a tab that isn't showing, a tab trigger marked `data-focus-tab="<type>"`
 * is activated first.
 *
 * `?new=1` instead presses the page's create button (marked
 * `data-create-trigger`), which is how the palette's "New quest" and friends
 * open the right dialog. The flag is then dropped from the address so a
 * reload doesn't open it again.
 */
export function RecordFocus() {
  const pathname = usePathname();
  const params = useSearchParams();
  const focus = params.get("focus");
  const create = params.get("new") === "1";

  useEffect(() => {
    if (!create) return;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const attempt = () => {
      const button = document.querySelector<HTMLElement>("[data-create-trigger]");
      if (button) {
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        window.history.replaceState(window.history.state, "", url);
        button.click();
        return;
      }
      if (Date.now() - started < LOOK_FOR_MS) timer = setTimeout(attempt, 100);
    };
    attempt();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [create, pathname]);

  useEffect(() => {
    if (!focus || !/^[a-z_]+-\d+$/.test(focus)) return;
    const type = focus.slice(0, focus.lastIndexOf("-"));
    const started = Date.now();
    let triedTab = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cleared: ReturnType<typeof setTimeout> | null = null;

    const attempt = () => {
      const el = document.querySelector<HTMLElement>(`[data-record="${focus}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("record-focus");
        cleared = setTimeout(() => el.classList.remove("record-focus"), HIGHLIGHT_MS);
        return;
      }
      if (!triedTab) {
        const tab = document.querySelector<HTMLElement>(`[data-focus-tab="${type}"]`);
        if (tab) {
          triedTab = true;
          // Radix tabs switch on mousedown (and on focus), not on click.
          tab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
          tab.focus();
        }
      }
      if (Date.now() - started < LOOK_FOR_MS) timer = setTimeout(attempt, 100);
    };
    attempt();
    return () => {
      if (timer) clearTimeout(timer);
      if (cleared) clearTimeout(cleared);
    };
  }, [focus, pathname]);

  return null;
}
