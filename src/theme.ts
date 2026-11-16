export type Theme = "light" | "dark" | "system";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** Paints a theme on <html> straight away (the saved choice is the app's job). */
export function paintTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function currentIsDark() {
  return document.documentElement.dataset.theme === "dark";
}

/**
 * Switch between light and dark with a circle that grows from the button (light to dark) or
 * shrinks back into it (dark to light), using the View Transitions API. Falls back to an instant
 * switch when the browser has no support or the person prefers reduced motion.
 *
 * `fill: forwards` keeps the last frame so there is no blink, and the animation is cancelled when
 * the transition finishes so it does not leak into the next switch.
 */
export function switchTheme(next: "light" | "dark", origin: HTMLElement | null, apply: () => void) {
  const root = document.documentElement;
  if (!origin || !document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }
  const r = origin.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const shrink = next === "light";
  root.classList.toggle("vt-reverse", shrink);
  const vt = document.startViewTransition(apply);
  const from = `circle(0px at ${x}px ${y}px)`;
  const to = `circle(${radius}px at ${x}px ${y}px)`;
  let anim: Animation | undefined;
  vt.ready.then(() => {
    anim = root.animate(
      { clipPath: shrink ? [to, from] : [from, to] },
      {
        duration: 650,
        easing: "cubic-bezier(.4,0,.2,1)",
        fill: "forwards",
        pseudoElement: shrink ? "::view-transition-old(root)" : "::view-transition-new(root)",
      },
    );
  });
  vt.finished.finally(() => {
    anim?.cancel();
    root.classList.remove("vt-reverse");
  });
}
