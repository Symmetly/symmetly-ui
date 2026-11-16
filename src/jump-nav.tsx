"use client";

import { useEffect, useRef, useState } from "react";

// A section counts as being read once its top has passed this share of the screen height (an anchor
// jump lands a section well below the floating bars, so a fixed pixel line would miss it).
const READING_LINE = 0.45;

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
  const scroller = useRef<Element | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < lockUntil.current) return;
      const line = window.innerHeight * READING_LINE;
      let current = sections[0]?.[0] ?? "";
      for (const [id] of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // At the very bottom the last sections may be too short to reach the line.
      const s = scroller.current;
      if (s && s.scrollTop > 0 && s.scrollTop + s.clientHeight >= s.scrollHeight - 4) current = sections[sections.length - 1][0];
      setActive(current);
    };
    const onScroll = (e?: Event) => {
      const target = e?.target;
      scroller.current = target instanceof Element ? target : document.scrollingElement;
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
