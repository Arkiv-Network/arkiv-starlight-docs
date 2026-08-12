// @ts-check

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import starlightPageActions from "starlight-page-actions";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

const configDir = dirname(fileURLToPath(import.meta.url));
const sdkClonePath = resolve(configDir, ".sdk-cache/arkiv-sdk-js");
const sdkAvailable = existsSync(resolve(sdkClonePath, "src/index.ts"));
if (!sdkAvailable) {
	console.warn(
		"[astro.config] SDK source not found at .sdk-cache/arkiv-sdk-js/ — skipping API reference generation. Run `bun run sync-sdk` to populate.",
	);
}

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
		"/start-here/testnet": "/networks/braga/",
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
					label: "Start Here",
					items: [
						{ label: "Fundamentals", slug: "start-here/fundamentals" },
						{ label: "Installation", slug: "start-here/installation" },
						{ label: "Agent Skills", slug: "start-here/agent-skill" },
						{ label: "Data Explorer", slug: "start-here/data-explorer" },
					],
				},
				{
					label: "Networks",
					items: [
						{ label: "Braga", slug: "networks/braga" },
						{ label: "Migrating from Kaolin", slug: "networks/migrate-from-kaolin" },
					],
				},
				{
					label: "TypeScript SDK",
					items: [
						{ label: "Querying Data", slug: "typescript-sdk/querying-data" },
						{ label: "Mutating Data", slug: "typescript-sdk/mutating-data" },
						{ label: "Live Events", slug: "typescript-sdk/live-events" },
						{
							label: "React Integration",
							slug: "typescript-sdk/react-integration",
						},
						{ label: "Best Practices", slug: "typescript-sdk/best-practices" },
						...(sdkAvailable ? [typeDocSidebarGroup] : []),
					],
				},
				{
					label: "Learn by Doing",
					items: [
						{
							label: "MetaMask Sketch App",
							items: [
								{ label: "Overview", slug: "learn/metamask-sketch-app" },
								{
									label: "1. Project Setup & Wallet",
									slug: "learn/metamask-sketch-app/1-setup",
								},
								{
									label: "2. Reading & Writing Data",
									slug: "learn/metamask-sketch-app/2-data",
								},
								{
									label: "3. Main Application",
									slug: "learn/metamask-sketch-app/3-app",
								},
							],
						},
						{
							label: "Fullstack Dashboard",
							items: [
								{ label: "Overview", slug: "learn/fullstack-dashboard" },
								{
									label: "1. Project Setup & Wallet",
									slug: "learn/fullstack-dashboard/01-project-setup",
								},
								{
									label: "2. Storing Data on Arkiv",
									slug: "learn/fullstack-dashboard/02-storing-data-on-arkiv",
								},
								{
									label: "3. Visualizing on the Frontend",
									slug: "learn/fullstack-dashboard/03-visualizing-on-the-frontend",
								},
								{
									label: "4. Summary and Next Steps",
									slug: "learn/fullstack-dashboard/04-summary-and-next-steps",
								},
							],
						},
					],
				},
				{
					label: "JSON-RPC API",
					items: [
						{ label: "Querying Data", slug: "json-rpc/querying-data" },
						{ label: "Mutating Entities", slug: "json-rpc/mutating-entities" },
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
				Banner: "./src/components/SiteBanner.astro",
				Pagination: "./src/components/DocsPagination.astro",
				SiteTitle: "./src/components/SiteTitle.astro",
			},
			plugins: [
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
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
