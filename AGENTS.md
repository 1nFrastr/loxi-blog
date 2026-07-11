# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **VuePress 2** static blog/documentation site (theme `vuepress-theme-plume`). There is no backend, database, or API — "running it" means the local dev server or a production build + preview.

- **Package manager:** Yarn 4.6.0 (Berry), pinned via `packageManager` and vendored at `.yarn/releases/`. Run `corepack enable` once so the `yarn` shim resolves to 4.6.0. Node ≥ 20 is required (CI uses Node 20; the VM has Node 22).
- **Commands** (see `package.json` scripts / `README.md`):
  - Dev server: `yarn docs:dev` (defaults to port 8080/8081; hot reload). Serves an SPA, so the page `<title>` and content are rendered client-side — a raw `curl` of `/` returns a shell HTML without the title; use a browser to verify rendering.
  - Build: `yarn docs:build` → outputs to `docs/.vuepress/dist`.
  - Preview built site: `yarn docs:preview` (serves `docs/.vuepress/dist` via `http-server`).
- **No lint or test suite** exists in this repo. `yarn docs:build` is the effective correctness check (it renders all pages and fails on config/content errors).
- **Benign warnings** to ignore: on dev startup Vite logs `Failed to resolve dependency: @vueuse/integrations/useFocusTrap` / `@iconify/vue` (optimizeDeps pre-bundling of optional theme deps); the theme also logs `plugins 不支持以下字段: "markdownEnhance"`. Neither breaks the site — build and dev both succeed.
