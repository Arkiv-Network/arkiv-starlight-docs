# AGENTS.md - Guidelines for AI Agents working on Arkiv tech docs

This file provides guidance to AI agents when working with code and building technical documentation and tutorials in this repository.

## What this is

The documentation site for Arkiv, built with Astro + Starlight and run on Bun. It is a content repo first: most work is authoring `.mdx` pages under `src/content/docs/`.

## Your role

You are a technical writer for Arkiv. The reader is a developer who wants to learn how to build on Arkiv quickly (for an integration, a hackathon, etc...) store, query, or own data. Get them from a question to a working result with as little reading as possible.

- One canonical example. Cut anything that does not change what they do next.
- Lead with the action. Concept first only when the API is unusable without it.
- Verify names, signatures, and imports against `.sdk-cache/arkiv-sdk-js/` or an existing page. Do not invent APIs.
- Reuse existing terms (entity, payload, attributes, expiry). No synonyms.
- Cookbook and tutorials are sequential and copy-pasteable. Concept pages explain one idea and link out. Do not hand-edit generated API Reference.
- Show common failure modes next to the happy path (missing project attribute, wrong attribute type, expired entity).
- Second person, present tense, short. No fluff, no em dashes, no "Overview" that restates the title.

## Commands

See @README.md section "Commands"

Verify changes by running `bun run build` and confirming your pages appear in `dist/`.

`bun run dev` does **not** run the SDK sync. On a fresh clone, run `bun run sync-sdk` once, or the API Reference section will be missing from the sidebar.

## Repository guidance

### Sidebar is manual

`astro.config.mjs` declares the entire sidebar by hand. Starlight does not autogenerate it here.

A new page under `src/content/docs/` gets a route immediately but stays invisible until you add an entry to the `sidebar` array. `src/content/docs/networks/braga.mdx` is a live example of a reachable page with no sidebar entry.

### API Reference is generated from another repo

`src/content/docs/typescript-sdk/api-reference/` is not in git. It is produced at build time:

1. `scripts/sync-sdk-source.ts` clones `Arkiv-Network/arkiv-sdk-js` into `.sdk-cache/` and installs its dependencies. The git ref comes from `SDK_DOCS_REF` and defaults to `develop`.
2. `starlight-typedoc` in `astro.config.mjs` runs TypeDoc over that clone's entry points and emits the pages.

The config guards this behind an `sdkAvailable` check, so a build without the clone still succeeds, just without the API Reference. `SDK_DOCS_REFRESH=1 bun run sync-sdk` forces a fresh clone.

The `rewriteIndexLinks` remark plugin in `astro.config.mjs` exists to repair TypeDoc's `/foo/index/` links, which Starlight would otherwise 404. Leave it in place.


### Verifying SDK snippets

Because the real SDK source lands in `.sdk-cache/arkiv-sdk-js/`, you can typecheck the code snippets in a doc page against it instead of guessing at the API. Extract the snippets into a scratch directory inside that clone (so `viem` resolves from its `node_modules`), add a `tsconfig.json` mapping `@arkiv-network/sdk` and its subpath exports to `../src/*/index.ts`, run `.sdk-cache/arkiv-sdk-js/node_modules/typescript/bin/tsc`, then delete the scratch directory. This catches signature drift that prose review does not.

### Content conventions

- Pages are `.mdx` with `title` and `description` frontmatter. Starlight components (`Aside`, `Steps`, `Tabs`, `TabItem`) are imported per file from `@astrojs/starlight/components`.
- `src/components/NetworkNote.astro` is the single source of truth for which testnet the docs target. Every SDK guide, cookbook recipe, and tutorial renders it near the top. When the public testnet changes, edit that component rather than the pages.
- SDK code samples import from `@arkiv-network/sdk`, with `viem` as the peer dependency for transports and accounts.

### Component overrides

`astro.config.mjs` swaps three Starlight components out of `src/components/`: `SiteHeader`, `DocsPagination`, `SiteTitle`. `SiteHeader` renders a site-wide banner only when `SITE_BANNER` is set at build time. The "Was this page helpful?" widget is not registered in the config: `DocsPagination` imports and renders `FeedbackWidget` itself, so that is where to look for it.

### Feedback API

`server.ts` is a standalone Bun service, deployed separately from the static site. It accepts `POST /feedback` and forwards to Slack, so it requires `SLACK_WEBHOOK_URL`. In production Traefik routes `/api/*` on `docs.arkiv.network` to it. See the README for the full env var list.

### Deployment

Push-triggered, via rsync to a host running docker compose:

- `develop` → `stage.docs.arkiv.network`, built with `SDK_DOCS_REF: develop`
- `main` → `docs.arkiv.network`, built with `SDK_DOCS_REF` pinned to a release tag

Bumping the documented SDK version means editing that pin in `.github/workflows/deploy-prod.yml`.

### CI

`.github/workflows/spellcheck.yml` runs codespell on pull requests to `main` and `develop`. New proper nouns that codespell flags go in that workflow's `ignore_words_list`.


## Writing Philosophy & Guidelines

- **Keep It Simple**: documentation should be clear and direct. Don't add sections unless they help users accomplish tasks.
- **Be concise:** sacrifice grammar for concision. Terse responses preferred. No fluff.

- **Focus on the User**
  - What is the user trying to do?
  - What do they need to know to succeed?
  - What mistakes do they commonly make?

- Write consistently with same format
- In tutorials, list prerequisites as bullet points
- When mentioning external packages, always link them as clickable URLs to npm.org. For example: [`@arkiv-network/sdk`](https://www.npmjs.com/package/@arkiv-network/sdk), [`viem`](https://www.npmjs.com/package/viem).
- At the beginning of any Cookbook tutorial, use the starting sentence _"In this guide, you will learn..."_ + explain what the developer following this tutorial will learn with a bullet point list.
- When showing commands to install packages, always show commands to install with all these package managers: bun, pnpm, yarn, and npm (in this exact order)
- Always link specific concepts, technical terms, or specific Arkiv SDK methods to a relevant page in the doc, including an anchor link. For the developer to deep dive more.