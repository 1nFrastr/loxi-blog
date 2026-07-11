# AGENTS.md

## Cursor Cloud specific instructions

This is a static personal blog/documentation site built with VuePress 2 (`@vuepress/bundler-vite`) and the `vuepress-theme-plume` theme. The package manager is Yarn 4 (pinned via `packageManager` in `package.json`; `corepack` provides it). All content lives under `docs/` (markdown + `docs/.vuepress/` config).

Standard commands are documented in `README.md` and `package.json` scripts; use those:
- Dev server: `yarn docs:dev` (serves at `http://localhost:8080/`).
- Build: `yarn docs:build` (renders static pages).
- Preview built output: `yarn docs:preview`.

Non-obvious caveats:
- There is no separate lint step or automated test suite; `yarn docs:build` is the effective correctness check (it compiles and renders every page).
- If the dev server logs `Failed to resolve dependency: ...` (Vite `optimizeDeps`) and pages fail to render, run `yarn docs:dev-clean` (or delete `docs/.vuepress/.cache` and `docs/.vuepress/.temp`) to clear stale Vite caches, then restart. `docs:build` already cleans these automatically.
