// @ts-check

import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import starlightPageActions from "starlight-page-actions";

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL || "https://docs.arkiv.network",
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
						{ label: "Testnet", slug: "start-here/testnet" },
						{ label: "Installation", slug: "start-here/installation" },
						{ label: "Agent Skill", slug: "start-here/agent-skill" },
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
				SiteTitle: "./src/components/SiteTitle.astro",
			},
			plugins: [
				starlightPageActions({
					baseUrl: process.env.SITE_URL || "https://docs.arkiv.network",
				}),
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
				content: `(() => {
					const name = 'outbound-link-click';
					document.querySelectorAll('a').forEach(a => {
						if (a.host !== window.location.host && !a.getAttribute('data-umami-event')) {
							a.setAttribute('data-umami-event', name);
							a.setAttribute('data-umami-event-url', a.href);
						}
					});
				})();`,
			}]
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
