import type { CSSProperties, ReactNode } from "react";

// Small visual pieces that every app repeated. Pure markup, no state, so they work in server and
// client components alike. Styles are the `g-` classes in components.css.

/** The text shown while a page streams in (use as the Suspense fallback). */
export function Loading({ children = "Loading…" }: { children?: ReactNode }) {
  return <p className="g-loading">{children}</p>;
}

/** The title block at the top of a page: heading, one line under it, and an optional action on the right. */
export function PageHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="g-head">
      <div>
        <h1 className="g-h1">{title}</h1>
        {sub && <p className="g-sub">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/** A usage bar. Shows nothing wider than full, and an empty bar when there is no capacity. */
export function Meter({ used, capacity }: { used: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0;
  return (
    <div className="g-meter">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

/** A stable colour (0 to 359) for a person, worked out from their name or email. */
export function hueOf(text: string) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** A round initial in a colour that is the same every time for the same name. */
export function Avatar({ name, seed = name, big = false }: { name: string; seed?: string; big?: boolean }) {
  return (
    <span className={big ? "g-av big" : "g-av"} style={{ "--h": hueOf(seed) } as CSSProperties}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
