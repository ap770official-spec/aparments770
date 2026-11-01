@AGENTS.md

## UI/UX design

For any design or UI task (pages, components, layout, colors, typography, spacing, animation, responsiveness, accessibility, or reviewing or fixing how something looks or behaves), always invoke the `ui-ux-pro-max` skill first and follow its workflow and rules. That includes running its search script (`python3 .claude/skills/ui-ux-pro-max/scripts/search.py ...`) for design-system, style, color, and typography decisions, and checking the result against its pre-delivery checklist before finishing.

For animation and motion work, and for UI polish details, also follow Emil Kowalski's skills: `emil-design-eng` (polish philosophy), `animate` (building an animation), `animation-performance`, `apple-design`, `mobile-native`, and `break-ui` (stress-testing UI with worst-case data). Where they overlap with `ui-ux-pro-max`, use the more specific rule.

When writing, reviewing, or refactoring React/Next.js code, also follow the `vercel-react-best-practices` skill. Its Next.js guidance may predate the Next.js version in this repo: where it conflicts with the docs in `node_modules/next/dist/docs/`, the docs win. Do not add a new dependency a skill recommends (e.g. SWR, lru-cache) without asking first.

Use the `scroll-craft` skill only when the user explicitly asks for it or for a scroll-driven/cinematic landing page. It builds standalone HTML sites in a `scrollcraft/` workspace, not pages in this Next.js app, so don't use it for regular page or component work here. Never run its kie.ai asset generation (paid credits) without asking first.
