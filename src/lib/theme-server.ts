import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, isThemeId, themeById, type ThemeDef } from "@/lib/themes";

/** The theme chosen in Settings, from the cookie both sides can read. */
export async function getTheme(): Promise<ThemeDef> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return themeById(isThemeId(value) ? value : DEFAULT_THEME);
}
