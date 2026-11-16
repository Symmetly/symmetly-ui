"use client";

import { useEffect, useRef, useState } from "react";

// A section counts as being read once its top has passed just under the floating top bar.
const READING_LINE = 170;

/**
 * The section links of a long page (the lesson editor): chips on a phone, a pinned vertical list on a
 * desktop in the focus view. The link of the section being read is highlighted. Each target needs an
 * element whose id is the section id.
 */
export function JumpNav({ sections, label = "Jump to section" }: { sections: readonly (readonly [string, string])[]; label?: string }) {
  const [active, setActive] = useState(sections[0]?.[0] ?? "");
  // After a click the page scrolls to the section; ignore scroll updates until it has settled so the
  // clicked link stays highlighted even when the page is too short to bring it to the top.
  const lockUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < lockUntil.current) return;
      let current = sections[0]?.[0] ?? "";
      for (const [id] of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= READING_LINE) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Capture: the page may scroll inside the shell rather than the window.
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections]);

  return (
    <nav aria-label={label} className="g-jumps no-print -mt-2 text-sm">
      {sections.map(([id, text]) => (
        <a
          key={id}
          href={`#${id}`}
          className={`g-chip shrink-0${active === id ? " on" : ""}`}
          aria-current={active === id ? "true" : undefined}
          onClick={() => {
            lockUntil.current = Date.now() + 900;
            setActive(id);
          }}
        >
          {text}
        </a>
      ))}
    </nav>
  );
}
