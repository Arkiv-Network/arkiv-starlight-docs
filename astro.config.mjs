// @ts-check

import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import starlightPageActions from "starlight-page-actions";
import starlightLinksValidator from "starlight-links-validator";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

const configDir = dirname(fileURLToPath(import.meta.url));
const sdkClonePath = resolve(configDir, ".sdk-cache/arkiv-sdk-js");
const sdkAvailable = existsSync(resolve(sdkClonePath, "src/index.ts"));
const validateLinks = process.env.VALIDATE_LINKS === "1";
if (!sdkAvailable) {
	console.warn(
		"[astro.config] SDK source not found at .sdk-cache/arkiv-sdk-js/ — skipping API reference generation. Run `bun run sync-sdk` to populate.",
	);
}

// starlight-page-actions writes its own llms.txt, a bare list of the sidebar's
// links, over the one in public/ when the build is done. This integration runs
// after it and puts the hand-written one back.
const handWrittenLlmsTxt = {
	name: "hand-written-llms-txt",
	hooks: {
		/** @param {{ dir: URL }} options */
		"astro:build:done": ({ dir }) => {
			copyFileSync(
				resolve(configDir, "public/llms.txt"),
				resolve(fileURLToPath(dir), "llms.txt"),
			);
		},
	},
};

// typedoc-plugin-markdown emits links like `/foo/bar/index/` when entryFileName
// is "index" (so each module gets its own root page). Starlight collapses any
// `<dir>/index.md` to `/<dir>/`, so those typedoc links 404. This remark plugin
// rewrites them back. Only rewrites trailing `/index/` (with optional fragment)
// to avoid touching anything else.
function rewriteIndexLinks() {
	/** @param {any} tree */
	return (tree) => {
		const walk = (/** @type {any} */ node) => {
			if (node?.type === "link" && typeof node.url === "string") {
				node.url = node.url.replace(/\/index\/(#.*)?$/, "/$1");
			}
			if (Array.isArray(node?.children)) {
				for (const child of node.children) walk(child);
			}
		};
		walk(tree);
	};
}

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL || "https://docs.arkiv.network",
	redirects: {
		"/start-here/testnet": "/networks/tiramisu/",
		"/networks/migrate-from-kaolin": "/networks/older-networks/",
		"/networks/cheesecake": "/networks/tiramisu/",
		"/start-here/api-keys": "/start-here/access-keys/",
		"/start-here/fundamentals": "/start-here/introduction/",
		"/start-here/installation": "/start-here/first-entity/",
		"/typescript-sdk/querying-data": "/querying/select/",
		"/typescript-sdk/mutating-data": "/writing/create/",
		"/typescript-sdk/live-events": "/querying/watch-events/",
		"/events/watch": "/querying/watch-events/",
		"/typescript-sdk/react-integration": "/guides/react/",
		"/typescript-sdk/best-practices": "/start-here/introduction/",
	},
	markdown: {
		remarkPlugins: [rewriteIndexLinks],
	},
	integrations: [
		starlight({
			title: "Arkiv documentation",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/arkiv-network",
				},
				{ icon: "discord", label: "Discord", href: "https://discord.gg/arkiv" },
			],
			sidebar: [
				{
					label: "Get Started",
					items: [
						{ label: "What Arkiv Is", slug: "start-here/introduction" },
						{ label: "Your First Entity", slug: "start-here/first-entity" },
						{ label: "Connect to Arkiv", slug: "start-here/clients" },
					],
				},
				{
					label: "Schemas",
					items: [
						{ label: "Define a Schema", slug: "schemas/define" },
						{ label: "Column Types", slug: "schemas/column-types" },
					],
				},
				{
					label: "Write Data",
					items: [
						{ label: "Create Entities", slug: "writing/create" },
						{ label: "Expiration", slug: "writing/expiration" },
						{ label: "Change & Delete", slug: "writing/change" },
						{ label: "Batches", slug: "writing/batches" },
					],
				},
				{
					label: "Query Data",
					items: [
						{ label: "Select Fields", slug: "querying/select" },
						{ label: "Filter Results", slug: "querying/filter" },
						{ label: "Sort Results", slug: "querying/sort" },
						{ label: "Paginate Results", slug: "querying/paginate" },
						{ label: "Count Entities", slug: "querying/count" },
						{ label: "Read One Entity", slug: "querying/get-entity" },
						{ label: "Query Without a Schema", slug: "querying/without-schema" },
						{ label: "Watch Entity Events", slug: "querying/watch-events" },
					],
				},
				{
					label: "Guides",
					items: [
						{ label: "Use with React", slug: "guides/react" },
					],
				},
				{
					label: "Reference",
					items: [
						{ label: "Query Language", slug: "reference/query-language" },
						{ label: "Errors", slug: "reference/errors" },
						{ label: "Limits", slug: "reference/limits" },
						...(sdkAvailable ? [typeDocSidebarGroup] : []),
					],
				},
				{
					label: "JSON-RPC API",
					items: [
						{ label: "Read Methods", slug: "json-rpc/querying-data" },
						{ label: "Write Transactions", slug: "json-rpc/mutating-entities" },
					],
				},
				{
					label: "Networks",
					items: [
						{ label: "Tiramisu", slug: "networks/tiramisu" },
						{ label: "Older Networks", slug: "networks/older-networks" },
					],
				},
				{
					label: "Tools",
					items: [
						{ label: "Data Explorer", slug: "start-here/data-explorer" },
						{ label: "Access Keys", slug: "start-here/access-keys" },
						{ label: "Agent Skills", slug: "start-here/agent-skill" },
					],
				},
			],
			customCss: [
				"./src/fonts/font-face.css",
				"@fontsource/ibm-plex-mono/400.css",
				"@fontsource/ibm-plex-mono/500.css",
				"@fontsource/ibm-plex-mono/700.css",
				"./src/styles/global.css",
			],
			components: {
				Header: "./src/components/SiteHeader.astro",
				Pagination: "./src/components/DocsPagination.astro",
				SiteTitle: "./src/components/SiteTitle.astro",
			},
			plugins: [
				// only validate in CI
				...(validateLinks
					? [
							starlightLinksValidator({
								exclude: ["/typescript-sdk/api-reference/**"],
							}),
						]
					: []),
				starlightPageActions({
					baseUrl: process.env.SITE_URL || "https://docs.arkiv.network",
				}),
				...(sdkAvailable
					? [
							starlightTypeDoc({
								entryPoints: [
									resolve(sdkClonePath, "src/index.ts"),
									resolve(sdkClonePath, "src/chains/index.ts"),
									resolve(sdkClonePath, "src/query/index.ts"),
									resolve(sdkClonePath, "src/types/index.ts"),
									resolve(sdkClonePath, "src/utils/index.ts"),
								],
								tsconfig: resolve(sdkClonePath, "tsconfig.json"),
								output: "typescript-sdk/api-reference",
								sidebar: {
									label: "API Reference",
									collapsed: true,
								},
							typeDoc: {
								excludeExternals: true,
								includeVersion: true,
								name: "@arkiv-network/sdk",
								entryFileName: "index",
								compilerOptions: {
									ignoreDeprecations: "6.0",
								},
							},
							}),
						]
					: []),
			],
			head: [{
				tag: "meta",
				attrs: {
					name: "google-site-verification",
					content: "OrCFKDnc2YAzKX_OFJr-Qp4XZNKS7dOsGAbp4G63fgQ",
				}
			}, {
				tag: "script",
				attrs: {
					defer: true,
					src: "https://umami.arkiv.network/script.js",
					"data-website-id": "0d5aa092-333b-4d74-b670-3d919cc4f52e",
				}
			}, {
				tag: "script",
				content: `document.addEventListener('DOMContentLoaded', () => {
						const name = 'outbound-link-click';
						document.querySelectorAll('a').forEach(a => {
						if (a.host !== window.location.host && !a.getAttribute('data-umami-event')) {
							a.setAttribute('data-umami-event', name);
							a.setAttribute('data-umami-event-url', a.href);
						}
						});
					});`
			}, {
				tag: "script",
				content: `
    (() => {
      if (window.__copyAnalyticsBound) return;
      window.__copyAnalyticsBound = true;

      const nearestSection = (el) => {
        const headings = document.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]');
        for (let i = headings.length - 1; i >= 0; i--) {
          if (el.compareDocumentPosition(headings[i]) & Node.DOCUMENT_POSITION_PRECEDING) {
            return headings[i].id;
          }
        }
        return 'intro';
      };

      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const btn = target.closest('button[data-code]');
        if (!btn) return;

        const pre = btn.closest('figure')?.querySelector('pre');
        const lang = pre?.getAttribute('data-language') ?? 'unknown';

        window.umami?.track('code-copied', {
          page: location.pathname,
          section: nearestSection(btn),
          lang,
        });
      });
    })();
  `
			}, {
				tag: "script",
				content: `
    (() => {
      if (window.__searchAnalyticsBound) return;
      window.__searchAnalyticsBound = true;

      // Order matters: bearer before jwt before api-key, paths before generic hex.
      const PATTERNS = [
        { name: 'email',       re: /\\S+@\\S+\\.\\S+/g },
        { name: 'bearer',      re: /\\bBearer\\s+\\S+/gi },
        { name: 'jwt',         re: /\\beyJ[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\b/g },
        { name: 'api-key',     re: /\\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\\b/g },
        { name: 'uuid',        re: /\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\b/g },
        { name: 'unix-path',   re: /\\/(?:Users|home)\\/[^\\s/]+/g },
        { name: 'win-path',    re: /[A-Za-z]:\\\\Users\\\\[^\\s\\\\]+/g },
        { name: 'ipv4',        re: /\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/g },
        { name: 'hex-address', re: /\\b0x[0-9a-fA-F]{6,}\\b/g },
        { name: 'cc-like',     re: /\\b(?:\\d[ -]?){13,19}\\b/g },
      ];

      const sanitize = (raw) => {
        const redactions = [];
        let out = raw;
        for (const { name, re } of PATTERNS) {
          if (re.test(out)) {
            redactions.push(name);
            re.lastIndex = 0;
            out = out.replace(re, \`[\${name}]\`);
          }
        }
        return {
          query: out.replace(/\\s+/g, ' ').trim().slice(0, 100),
          redactions,
        };
      };

      let timer;
      let lastSent = '';

      document.addEventListener('input', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (!target.classList.contains('pagefind-ui__search-input')) return;

        clearTimeout(timer);
        timer = setTimeout(() => {
          const { query, redactions } = sanitize(target.value ?? '');
          if (query.length < 2 || query === lastSent) return;
          lastSent = query;

          const hasResults =
            document.querySelectorAll('.pagefind-ui__result').length > 0;

          window.umami?.track('docs-search', {
            query,
            hasResults,
            redacted: redactions.length > 0,
            redactionTypes: redactions.join(','),
          });
        }, 600);
      });
    })();
  `
			}]
		}),
		handWrittenLlmsTxt,
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
