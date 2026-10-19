# AGENTS.md - Guidelines for AI Agents working on Arkiv tech docs

This file provides guidance to AI agents when working with code and building technical documentation and tutorials in this repository.

## What this is

The documentation site for Arkiv, built with Astro + Starlight and run on Bun. It is a content repo first: most work is authoring `.mdx` pages under `src/content/docs/`.

## Your role

You are a technical writer for Arkiv. The reader is a developer who wants to learn how to build on Arkiv quickly (for an integration, a hackathon, etc...) store, query, or own data. Get them from a question to a working result with as little reading as possible.

- One canonical example. Cut anything that does not change what they do next.
- Lead with the action. Concept first only when the API is unusable without it.
- Verify names, signatures, and imports against `.sdk-cache/arkiv-sdk-js/` or an existing page. Do not invent APIs.
- Reuse existing terms (entity, attribute, column, schema, expiration, entity field). No synonyms.
- Show common failure modes next to the happy path (a value of the wrong type, a filter on a column that isn't indexed, an expired entity).
- Arkiv is a public database: anyone can write entities of any shape. Examples name schemas after the project (`my-app.posts`), and pages that read data the app trusts filter by owner or creator (`ownedBy`, `createdBy`).
- Do not hand-edit the generated API Reference.

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

### Site structure

The sidebar follows the reader's path: Get Started (what Arkiv is, the first-entity tutorial, connecting), Schemas, Write Data, Query Data, Events, Reference (query language, errors, limits, the generated API Reference), JSON-RPC API (read methods and the write calldata, for clients without an SDK), then Networks and Tools. One page does one job: a tutorial, a how-to, a reference or a concept, never a mix.

### Content conventions

- Pages are `.mdx` with `title` and `description` frontmatter. Starlight components (`Aside`, `Steps`, `Tabs`, `TabItem`) are imported per file from `@astrojs/starlight/components`.
- SDK code samples import from `@arkiv-network/sdk` and its subpaths (`/schema`, `/query`, `/chains`), with `viem` as the peer dependency for transports and accounts.
- Every page after the tutorial reuses its `Posts` schema, `account`, `publicClient` and `walletClient`, and says so in its first paragraph. Don't redefine them per page.
- Wherever a page shows or uses the public RPC URL (including `http()` with no URL), render `src/components/RpcTerms.astro` next to it. It links the Terms of Use and Privacy Policy.
- `src/components/NetworkNote.astro` is the single source of truth for which testnet the docs target. The tutorial and the "Connect to Arkiv" page render it near the top. When the public testnet changes, edit that component rather than the pages.

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


## Writing guidelines

Follow the [Vercel writing guidelines](https://raw.githubusercontent.com/vercel-labs/writing-guidelines/refs/heads/main/README.md). The ones that come up most:

- Open every page with a one-paragraph summary. Don't over-explain: say it once, link to the page that covers it
- Active voice, second person, present tense, sentences under 20 words. Contractions are fine
- No `easy`, `simple`, `quick`, `just`, `very`, `really`. No rhetorical questions
- No em dashes or hyphens as punctuation. Use colons, commas or periods. Curly quotes and apostrophes in prose
- Sentence case for page titles and headings, title case for sidebar labels
- Introduce every list with a colon. No periods on list items that aren't full sentences
- Every code block has a language tag, explains itself in the prose around it, and stays under 80 columns and 25 lines
- Placeholders are descriptive `snake_case`: `your_private_key_here`

Repo conventions on top of those:

- Link external packages to npm the first time they appear: [`@arkiv-network/sdk`](https://www.npmjs.com/package/@arkiv-network/sdk), [`viem`](https://www.npmjs.com/package/viem)
- Show install commands in `<Tabs syncKey="pkg">` with bun, pnpm, yarn and npm, in that order
- Link SDK methods and concepts to the page that covers them, with an anchor
