"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  BellIcon,
  ChevronIcon,
  CloseIcon,
  GearIcon,
  GridIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
} from "./icons";
import { currentIsDark, paintTheme, switchTheme } from "./theme";

// The glass shell every Symmetly app shares: a floating top bar, a rail that expands into a
// sidebar, and a slide-in panel for Pair and notifications. The page scrolls behind the bar.
//
//   <Shell bar={<TopBar .../>} rail={<Rail items={...}/>} pair={...} notifications={...}>
//     <main className="page-main">...</main>
//   </Shell>
//
// Focus view (editor, builder): pass `focus` and leave `rail` out; only the Pair pill stays.

type Panel = null | "pair" | "notifications";

type ShellState = {
  panel: Panel;
  setPanel: (p: Panel) => void;
  sideOpen: boolean;
  setSideOpen: (open: boolean) => void;
  hasPair: boolean;
  pairIcon: string | undefined;
  hasNotifications: boolean;
  unread: boolean;
  clearUnread: () => void;
};
const ShellContext = createContext<ShellState | null>(null);
function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("TopBar and Rail must be rendered inside <Shell>.");
  return ctx;
}

const SIDE_KEY = "sym-side-open";

export function Shell({
  bar,
  rail,
  pair,
  notifications,
  unread = false,
  focus = false,
  children,
}: {
  bar: ReactNode;
  rail?: ReactNode;
  /** The Pair chat. Leave out in apps that have no Pair yet; the pill then hides the button. */
  pair?: { icon: string; content: ReactNode };
  notifications?: ReactNode;
  /** Shows a dot on the bell. */
  unread?: boolean;
  /** Focus view: no rail, the page gets the whole width. */
  focus?: boolean;
  children: ReactNode;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [sideOpen, setSideOpenState] = useState(false);
  const [hasUnread, setHasUnread] = useState(unread);

  // The expanded/collapsed rail is a per-viewer convenience; never let storage break the page.
  useEffect(() => {
    try {
      if (localStorage.getItem(SIDE_KEY) === "1") setSideOpenState(true);
    } catch {}
  }, []);
  const setSideOpen = useCallback((open: boolean) => {
    setSideOpenState(open);
    try {
      localStorage.setItem(SIDE_KEY, open ? "1" : "0");
    } catch {}
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel]);

  const value: ShellState = {
    panel,
    setPanel: (p) => {
      setPanel(p);
      if (p === "notifications") setHasUnread(false);
    },
    sideOpen,
    setSideOpen,
    hasPair: !!pair,
    pairIcon: pair?.icon,
    hasNotifications: !!notifications,
    unread: hasUnread,
    clearUnread: () => setHasUnread(false),
  };

  const showRail = !focus && !!rail;
  return (
    <ShellContext.Provider value={value}>
      <div className={`sy-app${showRail ? "" : " focus"}`}>
        {bar}
        {showRail && rail}
        <div className="sy-main" id="sy-scroller">
          {children}
        </div>
        {(pair || notifications) && (
          <aside
            className={`sy-ai g-glass${panel ? " open" : ""}`}
            aria-label={panel === "notifications" ? "Notifications" : "Pair"}
            inert={!panel}
          >
            <div className="sy-ai-top">
              <div className="sy-ai-title">
                {panel !== "notifications" && pair && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pair.icon} alt="" />
                )}
                <b>{panel === "notifications" ? "Notifications" : "Pair"}</b>
              </div>
              <button type="button" className="sy-bubble round" style={{ width: 36, height: 36, minWidth: 36 }} aria-label="Close" onClick={() => value.setPanel(null)}>
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="sy-ai-body">
              {pair && <div hidden={panel !== "pair"} style={{ display: panel === "pair" ? "flex" : "none", flex: 1, flexDirection: "column" }}>{pair.content}</div>}
              {notifications && <div hidden={panel !== "notifications"}>{notifications}</div>}
            </div>
          </aside>
        )}
      </div>
    </ShellContext.Provider>
  );
}

// ---------------------------------------------------------------------------------------------
// Rail

export type RailItem = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  /** The primary action (for example "New lesson plan"). */
  variant?: "plus";
};

export function Rail({ items, label = "Main" }: { items: RailItem[]; label?: string }) {
  const { sideOpen, setSideOpen } = useShell();
  return (
    <aside className={`sy-side no-print${sideOpen ? " open" : ""}`}>
      <nav aria-label={label} style={{ display: "contents" }}>
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={item.active ? "page" : undefined}
            className={`sy-item${item.active ? " on" : ""}${item.variant === "plus" ? " plus" : ""}`}
          >
            {item.icon}
            <span className="label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className="sy-item toggle"
        aria-expanded={sideOpen}
        title={sideOpen ? "Collapse" : "Expand"}
        onClick={() => setSideOpen(!sideOpen)}
      >
        <ChevronIcon />
        <span className="label">{sideOpen ? "Collapse" : "Expand"}</span>
      </button>
    </aside>
  );
}

// ---------------------------------------------------------------------------------------------
// Top bar

export type AppEntry = { name: string; href: string; icon: string; current?: boolean };
export type OrgEntry = {
  key: string;
  name: string;
  hint?: string;
  href: string;
  current?: boolean;
  /** Owners and admins only: a gear that appears on hover and goes to the organisation's settings. */
  settingsHref?: string;
};
export type MenuLink = { label: string; href: string; icon?: ReactNode };

type OpenMenu = null | "apps" | "org" | "who";

function hue(text: string) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function TopBar({
  brand,
  apps,
  allAppsHref,
  credits,
  orgs,
  newOrg,
  user,
  profileLinks,
  signOutAction,
  setThemeAction,
}: {
  brand: { name: string; icon: string; href: string };
  apps: AppEntry[];
  allAppsHref: string;
  /** The credits chip contents (coin is added). Leave out where credits do not apply. */
  credits?: { summary: ReactNode; mobileSummary?: ReactNode; topUp?: { href: string; label: string } };
  /** Organisations to switch between. Leave out to hide the selector. */
  orgs?: OrgEntry[];
  newOrg?: { label: string; href: string };
  user: { name: string | null; email: string };
  profileLinks: MenuLink[];
  signOutAction: () => void | Promise<void>;
  /** Saves the choice for this device on the account. Receives "light" or "dark". */
  setThemeAction: (theme: string) => Promise<unknown>;
}) {
  const { panel, setPanel, hasPair, hasNotifications, unread } = useShell();
  const [open, setOpen] = useState<OpenMenu>(null);
  const [, startTransition] = useTransition();
  const root = useRef<HTMLElement>(null);
  const themeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (m: Exclude<OpenMenu, null>) => setOpen(open === m ? null : m);

  const toggleTheme = () => {
    const next = currentIsDark() ? "light" : "dark";
    switchTheme(next, themeBtn.current, () => paintTheme(next));
    startTransition(async () => {
      await setThemeAction(next);
    });
  };

  const display = user.name ?? user.email;
  const initial = display.trim().charAt(0).toUpperCase() || "?";
  // The current organisation comes from the address, so the bar itself never has to re-render
  // (or show a loading state) when the person switches organisation.
  const path = usePathname();
  const current = orgs?.find((o) => o.current) ?? orgs?.find((o) => path === o.href || path.startsWith(o.href + "/"));
  const brandHref = current?.href ?? brand.href;

  return (
    <header className="sy-bar no-print" ref={root}>
      <div className="sy-group">
        <Link href={brandHref} className="sy-bubble brand" aria-label={brand.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.icon} alt="" />
          {brand.name}
        </Link>
        <div className="sy-relative">
          <button
            type="button"
            className="sy-bubble round"
            title="Apps"
            aria-label="Apps"
            aria-haspopup="menu"
            aria-expanded={open === "apps"}
            onClick={() => toggle("apps")}
          >
            <GridIcon />
          </button>
          {open === "apps" && (
            <div className="sy-menu apps left g-glass" role="menu" aria-label="Apps">
              <div className="sy-tiles">
                {apps.map((a) => (
                  <a
                    key={a.name}
                    href={a.href}
                    role="menuitem"
                    title={a.name}
                    aria-label={a.name}
                    aria-current={a.current ? "page" : undefined}
                    className={`sy-tile${a.current ? " current" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.icon} alt="" />
                  </a>
                ))}
              </div>
              <a href={allAppsHref} role="menuitem" className="sy-allapps">
                <GridIcon />
                All apps
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="sy-group">
        {credits && (
          <div className="sy-bubble sy-credits">
            <span className="coin" aria-hidden>
              &cent;
            </span>
            {credits.summary}
            {credits.topUp && <a href={credits.topUp.href}>{credits.topUp.label}</a>}
          </div>
        )}

        {orgs && (orgs.length > 1 || newOrg) && (
          <div className="sy-relative">
            <button
              type="button"
              className="sy-bubble sy-orgbtn"
              data-initial={(current?.name ?? "O").charAt(0).toUpperCase()}
              aria-haspopup="menu"
              aria-expanded={open === "org"}
              aria-label="Organisation"
              onClick={() => toggle("org")}
            >
              <span>{current?.name ?? "Organisation"}</span>
              <span className="caret" aria-hidden style={{ opacity: 0.5 }}>
                &#9662;
              </span>
            </button>
            {open === "org" && (
              <div className="sy-menu org right g-glass" role="menu" aria-label="Organisations">
                {orgs.map((o) => (
                  <div key={o.key} style={{ position: "relative" }}>
                    <Link
                      href={o.href}
                      role="menuitem"
                      className="sy-row"
                      aria-current={o.key === current?.key ? "page" : undefined}
                      onClick={() => setOpen(null)}
                    >
                      <span className="sy-oa" style={{ ["--h" as string]: hue(o.name) }}>
                        {o.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="nm">
                        <b>{o.name}</b>
                        {o.hint && <small>{o.hint}</small>}
                      </span>
                      {o.key === current?.key && <span className="chk">&#10003;</span>}
                      {o.settingsHref && <span style={{ width: 34 }} />}
                    </Link>
                    {o.settingsHref && (
                      <Link
                        href={o.settingsHref}
                        className="sy-gear"
                        title={`Settings for ${o.name}`}
                        aria-label={`Settings for ${o.name}`}
                        style={{ position: "absolute", right: 12, top: "50%", marginTop: -17 }}
                        onClick={() => setOpen(null)}
                      >
                        <GearIcon />
                      </Link>
                    )}
                  </div>
                ))}
                {newOrg && (
                  <>
                    <div className="sy-sep" />
                    <Link href={newOrg.href} role="menuitem" className="sy-row accent act" onClick={() => setOpen(null)}>
                      <span className="sy-plus">+</span>
                      {newOrg.label}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button ref={themeBtn} type="button" className="sy-bubble round sy-theme" title="Appearance" aria-label="Switch between light and dark" onClick={toggleTheme}>
          <SunIcon className="sun" />
          <MoonIcon className="moon" />
        </button>

        {(hasPair || hasNotifications) && (
          <div className="sy-bubble sy-pill">
            {hasPair && (
              <button
                type="button"
                className={`sy-pbtn${panel === "pair" ? " on" : ""}`}
                title="Pair"
                aria-label="Pair"
                aria-pressed={panel === "pair"}
                onClick={() => setPanel(panel === "pair" ? null : "pair")}
              >
                <PairMark />
              </button>
            )}
            {hasNotifications && (
              <button
                type="button"
                className={`sy-pbtn${panel === "notifications" ? " on" : ""}`}
                title="Notifications"
                aria-label="Notifications"
                aria-pressed={panel === "notifications"}
                onClick={() => setPanel(panel === "notifications" ? null : "notifications")}
              >
                <BellIcon />
                {unread && <i className="sy-badge" />}
              </button>
            )}
          </div>
        )}

        <div className="sy-relative">
          <button
            type="button"
            className="sy-bubble who"
            aria-haspopup="menu"
            aria-expanded={open === "who"}
            aria-label="Account menu"
            onClick={() => toggle("who")}
          >
            <span className="sy-who-text">
              <b>{display}</b>
              {user.name && <small>{user.email}</small>}
            </span>
            <span className="sy-avatar">{initial}</span>
          </button>
          {open === "who" && (
            <div className="sy-menu who right g-glass" role="menu" aria-label="Account">
              <div className="sy-whohead">
                <span className="sy-oa" style={{ ["--h" as string]: hue(display), borderRadius: "50%" }}>
                  {initial}
                </span>
                <span className="sy-row nm" style={{ padding: 0, cursor: "default", background: "none" }}>
                  <span className="nm">
                    <b>{display}</b>
                    {user.name && <small>{user.email}</small>}
                  </span>
                </span>
              </div>
              <div className="sy-sep" />
              {credits?.mobileSummary && (
                <div className="sy-row sy-mobile-only" style={{ cursor: "default" }}>
                  <span className="sy-plus" style={{ border: 0 }}>
                    &cent;
                  </span>
                  <span className="nm">{credits.mobileSummary}</span>
                </div>
              )}
              <button
                type="button"
                role="menuitem"
                className="sy-row act sy-mobile-only"
                onClick={() => {
                  setOpen(null);
                  toggleTheme();
                }}
              >
                <MoonIcon />
                Switch theme
              </button>
              {profileLinks.map((l) => (
                <a key={l.href} href={l.href} role="menuitem" className="sy-row act">
                  {l.icon ?? <GearIcon />}
                  {l.label}
                </a>
              ))}
              <form action={signOutAction}>
                <button role="menuitem" className="sy-row act">
                  <SignOutIcon />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function PairMark() {
  const { pairIcon } = useShell();
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={pairIcon} alt="" width={24} height={24} />;
}
