"use client";

import { useEffect, useState } from "react";

/**
 * The section links of a long page (the lesson editor): chips on a phone, a pinned vertical list on a
 * desktop in the focus view. The link of the section being read is highlighted. Each target needs an
 * element whose id is the section id.
 */
export function JumpNav({ sections, label = "Jump to section" }: { sections: readonly (readonly [string, string])[]; label?: string }) {
  const [active, setActive] = useState(sections[0]?.[0] ?? "");

  useEffect(() => {
    const els = sections.map(([id]) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    // A section counts as being read once its top passes just under the top bar, until the next one does.
    const visible = new Set<string>();
    const pick = () => {
      const first = els.find((el) => visible.has(el.id));
      if (first) setActive(first.id);
    };
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id));
        pick();
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav aria-label={label} className="g-jumps no-print -mt-2 text-sm">
      {sections.map(([id, text]) => (
        <a key={id} href={`#${id}`} className={`g-chip shrink-0${active === id ? " on" : ""}`} aria-current={active === id ? "true" : undefined} onClick={() => setActive(id)}>
          {text}
        </a>
      ))}
    </nav>
  );
}
