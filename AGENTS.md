# Prototype Instructions

The user clarified that this is a front-of-room bingo display. A spinning wheel is one possible draw animation, but other engaging draw mechanisms are welcome. The supplied illustration is a color and mood reference: warm cream, coral pink, sunflower yellow, turquoise, orange, lavender, dark outlines, and playful rounded Japanese typography. Prioritize a large, readable result and an engaging shared draw experience over a personal bingo card.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Confirmed delivery requirements
- Use the supplied cream, coral, sunflower, turquoise, orange and lavender palette for a shared monitor-based bingo drawing site.
- Deploy to Cloudflare and create a GitHub repository with the implementation committed.
- Do not reference or reuse any existing project designs or illustrations. The user explicitly rejected them. Use only the palette of the image attached in this conversation. Create a fresh, centered monitor display.
