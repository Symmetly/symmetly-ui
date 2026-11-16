import type { AppEntry } from "./shell";

// The one registry of Symmetly apps, shared by every app's app menu (the grid in the top bar) and by the
// launcher at account.symmetly.com/apps. Nobody edits this to add an app to their menu: an app is
// UNLOCKED by giving it an address, by setting its `<KEY>_URL` variable (PLAN_URL, KEEP_URL, PAIR_URL,
// ASSESS_URL, ATTEND_URL, ORG_URL) in the app that shows the menu. No address means locked: it is left out
// of the menu and the launcher shows it as "Soon". Add a new product here only once, when it is invented.

export type AppKey = "plan" | "keep" | "pair" | "assess" | "attend" | "organisation";
export type AppUrls = Partial<Record<AppKey, string>>;

type AppDef = {
  key: AppKey;
  name: string;
  /** Icon file served by the account app (`<accountUrl>/<iconPath>`). */
  iconPath: string;
  /** Product name in core.entitlements that unlocks it for an organisation, or null (Keep comes with Plan). */
  entitlement: "plan" | "companion" | "assess" | "attend" | null;
  /** Page on the marketing site. */
  sitePath: string;
  description: string;
  /** Shown on the launcher at all (the Organisation app is only reached from the menu and settings). */
  launcher: boolean;
};

export const symmetlyApps: readonly AppDef[] = [
  { key: "plan", name: "Plan", iconPath: "/products/plan-icon.svg", entitlement: "plan", sitePath: "/plan", description: "Lesson, class and year plans.", launcher: true },
  { key: "keep", name: "Keep", iconPath: "/products/keep-icon.svg", entitlement: null, sitePath: "/keep", description: "Your teaching resources, in one place.", launcher: true },
  { key: "pair", name: "Pair", iconPath: "/products/pair-icon.svg", entitlement: "companion", sitePath: "/pair", description: "AI help across every app.", launcher: true },
  { key: "assess", name: "Assess", iconPath: "/products/assess-icon.svg", entitlement: "assess", sitePath: "/assess", description: "Mark and report on learning.", launcher: true },
  { key: "attend", name: "Attend", iconPath: "/products/attend-icon.svg", entitlement: "attend", sitePath: "/attend", description: "QR check-in and attendance.", launcher: true },
  { key: "organisation", name: "Organisation", iconPath: "/brand/symmetly-mark.svg", entitlement: null, sitePath: "/", description: "Members, seats and settings.", launcher: false },
];

const envName: Record<AppKey, string> = {
  plan: "PLAN_URL",
  keep: "KEEP_URL",
  pair: "PAIR_URL",
  assess: "ASSESS_URL",
  attend: "ATTEND_URL",
  organisation: "ORG_URL",
};

/** Read the app addresses from environment variables (pass `process.env`; call it on the server). */
export function appUrlsFromEnv(env: Record<string, string | undefined>): AppUrls {
  const urls: AppUrls = {};
  for (const app of symmetlyApps) {
    const value = env[envName[app.key]];
    if (value) urls[app.key] = value;
  }
  return urls;
}

/**
 * The entries for the top bar's app menu: every unlocked app, in the registry's order. `current` marks the app
 * the person is in; `canManage` shows the Organisation app (owners and admins of a school or business).
 */
export function appMenu({
  accountUrl,
  urls,
  current,
  canManage,
}: {
  accountUrl: string;
  urls: AppUrls;
  current: AppKey;
  canManage: boolean;
}): AppEntry[] {
  return symmetlyApps
    .filter((app) => urls[app.key] && (app.key !== "organisation" || canManage))
    .map((app) => ({
      name: app.name,
      href: urls[app.key]!,
      icon: new URL(app.iconPath, accountUrl).toString(),
      current: app.key === current,
    }));
}

export type LauncherTile = {
  key: AppKey;
  name: string;
  description: string;
  /** available: opens the app. get: not in any of your organisations yet. soon: no address (locked).
   *  info: has no app of its own (Keep comes with Plan). */
  state: "available" | "get" | "soon" | "info";
  href: string;
};

/** The cards of the launcher. `entitled` is the set of product names the person's organisations have. */
export function launcherTiles({
  entitled,
  urls,
  siteUrl,
}: {
  entitled: ReadonlySet<string>;
  urls: AppUrls;
  siteUrl: string;
}): LauncherTile[] {
  return symmetlyApps
    .filter((app) => app.launcher)
    .map((app) => {
      const site = siteUrl + app.sitePath;
      const base = { key: app.key, name: app.name, description: app.description };
      const url = urls[app.key];
      if (app.entitlement === null) return { ...base, state: "info" as const, href: url ?? site };
      if (!url) return { ...base, state: "soon" as const, href: site };
      return entitled.has(app.entitlement)
        ? { ...base, state: "available" as const, href: url }
        : { ...base, state: "get" as const, href: site };
    });
}
