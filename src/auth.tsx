"use client";

import { useRef, useTransition, type ReactNode } from "react";
import { MoonIcon, SunIcon } from "./icons";
import { currentIsDark, paintTheme, switchTheme } from "./theme";

/**
 * The frame of a page you see before you are signed in (sign-in, forgot password, reset): the logo
 * top left, the theme button top right, one centred card, and a small footer. No bar, no rail.
 */
export function AuthLayout({
  logo,
  actions,
  footer,
  children,
}: {
  logo: ReactNode;
  /** Top right, next to the theme button (for example a language picker later). */
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="g-auth">
      <header className="g-auth-top">
        <div className="g-auth-logo">{logo}</div>
        <div className="g-auth-actions">{actions}</div>
      </header>
      <main className="g-auth-main">{children}</main>
      {footer && <footer className="g-auth-foot">{footer}</footer>}
    </div>
  );
}

/** The sun and moon button on its own. `onChange` saves the choice (it receives "light" or "dark"). */
export function ThemeToggle({ onChange }: { onChange?: (theme: string) => Promise<unknown> }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [, start] = useTransition();
  return (
    <button
      ref={ref}
      type="button"
      className="sy-bubble round sy-theme"
      title="Appearance"
      aria-label="Switch between light and dark"
      onClick={() => {
        const next = currentIsDark() ? "light" : "dark";
        switchTheme(next, ref.current, () => paintTheme(next));
        if (onChange) start(async () => void (await onChange(next)));
      }}
    >
      <SunIcon className="sun" />
      <MoonIcon className="moon" />
    </button>
  );
}
