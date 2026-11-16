import type { ReactNode } from "react";

// Stroke icons used by the shell. Each takes an optional className; they inherit currentColor.
function G({ children, className = "", size }: { children: ReactNode; className?: string; size?: number }) {
  return (
    <svg
      className={`g-glyph ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden
      style={size ? { width: size, height: size } : undefined}
    >
      {children}
    </svg>
  );
}
type P = { className?: string; size?: number };

export const GridIcon = (p: P) => (
  <G {...p}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </G>
);
export const SunIcon = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </G>
);
export const MoonIcon = (p: P) => (
  <G {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </G>
);
export const BellIcon = (p: P) => (
  <G {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" />
  </G>
);
export const GearIcon = (p: P) => (
  <G {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </G>
);
export const SignOutIcon = (p: P) => (
  <G {...p}>
    <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />
  </G>
);
export const ChevronIcon = (p: P) => (
  <G {...p}>
    <path d="M9 6l6 6-6 6" />
  </G>
);
export const CloseIcon = (p: P) => (
  <G {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </G>
);
export const PlusIcon = (p: P) => (
  <G {...p}>
    <path d="M12 5v14M5 12h14" />
  </G>
);
export const HomeIcon = (p: P) => (
  <G {...p}>
    <path d="M4 11l8-7 8 7v9H4zM10 20v-5h4v5" />
  </G>
);
export const DocIcon = (p: P) => (
  <G {...p}>
    <path d="M5 4h14v16H5zM9 9h6M9 13h6" />
  </G>
);
export const ArchiveIcon = (p: P) => (
  <G {...p}>
    <path d="M4 7h16v13H4zM3 4h18v3H3zM10 12h4" />
  </G>
);
export const CalendarIcon = (p: P) => (
  <G {...p}>
    <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
  </G>
);
export const UsersIcon = (p: P) => (
  <G {...p}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2.2 1.6-4 4-4" />
  </G>
);

// Icons from the Organisation prototype.
export const PeopleIcon = (p: P) => (
  <G {...p}>
    <path d="M4 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="10" cy="8" r="3.2" />
    <path d="M16 5.5a3 3 0 0 1 0 5.6M18 14.4c1.7.8 2.9 2.8 3 5.6" />
  </G>
);
export const CardIcon = (p: P) => (
  <G {...p}>
    <rect x="3" y="6" width="18" height="12" rx="3" />
    <path d="M3 10h18M7 15h4" />
  </G>
);
export const ReceiptIcon = (p: P) => (
  <G {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />
  </G>
);
export const InfoIcon = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </G>
);
export const SearchIcon = (p: P) => (
  <G {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </G>
);
