> **Archived 2026-11-18.** This repository moved into the monorepo [Symmetly/symmetly-platform](https://github.com/Symmetly/symmetly-platform) (`apps/*` and `packages/*`). Do not make changes here.

# @symmetly/ui

The shared glass UI of the Symmetly apps (Plan, Account, Organisation and the ones to come): design
tokens for light and dark, the theme circle, the floating top bar, the rail, menus, the Pair and
notifications panel, focus view, and the `g-` page primitives.

Internal to Symmetly. It ships TypeScript source and CSS, so each Next.js app must compile it:

```ts
// next.config.ts
transpilePackages: ["@symmetly/ui"],
```

```css
/* globals.css */
@import "tailwindcss";
@import "@symmetly/ui/styles.css";
```

```tsx
import { Shell, TopBar, Rail } from "@symmetly/ui";
```

## Changing it

Edit here, never copy shell code into an app. Then:

1. `npm run typecheck`
2. Bump `version` in `package.json` (semver), commit, `npm publish`.
3. Bump `@symmetly/ui` in each app and reinstall.

While iterating on the design, an app can temporarily depend on `file:../symmetly-ui` so edits show
live; switch it back to a published version before deploying.
