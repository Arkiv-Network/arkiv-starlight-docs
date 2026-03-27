// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import starlightPageActions from 'starlight-page-actions';

// https://astro.build/config
export default defineConfig({
	site: 'https://arkiv-network.github.io/',
	base: '/arkiv-starlight-docs/',
	integrations: [
		starlight({
			title: 'Arkiv documentation',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/arkiv-network' }],
			sidebar: [
				{
					label: 'Start Here',
					items: [
						{ label: 'Fundamentals', slug: 'start-here/fundamentals' },
						{ label: 'Testnet', slug: 'start-here/testnet' },
						{ label: 'Installation', slug: 'start-here/installation' },
						{ label: 'Agent Skill', slug: 'start-here/agent-skill' },
					],
				},
				{
					label: 'TypeScript SDK',
					items: [
						{ label: 'Querying Data', slug: 'typescript-sdk/querying-data' },
						{ label: 'Mutating Data', slug: 'typescript-sdk/mutating-data' },
						{ label: 'Live Events', slug: 'typescript-sdk/live-events' },
						{ label: 'React Integration', slug: 'typescript-sdk/react-integration' },
						{ label: 'Best Practices', slug: 'typescript-sdk/best-practices' },
					],
				},
				{
					label: 'Learn by Doing',
					items: [
						{
							label: 'MetaMask Sketch App',
							items: [
								{ label: 'Overview', slug: 'learn/metamask-sketch-app' },
								{ label: '1. Project Setup & Wallet', slug: 'learn/metamask-sketch-app/1-setup' },
								{ label: '2. Reading & Writing Data', slug: 'learn/metamask-sketch-app/2-data' },
								{ label: '3. Main Application', slug: 'learn/metamask-sketch-app/3-app' },
							],
						},
						{
							label: 'Fullstack Dashboard',
							items: [
								{ label: 'Overview', slug: 'learn/fullstack-dashboard' },
								{ label: '1. Project Setup & Wallet', slug: 'learn/fullstack-dashboard/01-project-setup' },
								{ label: '2. Storing Data on Arkiv', slug: 'learn/fullstack-dashboard/02-storing-data-on-arkiv' },
								{ label: '3. Visualizing on the Frontend', slug: 'learn/fullstack-dashboard/03-visualizing-on-the-frontend' },
								{ label: '4. Summary and Next Steps', slug: 'learn/fullstack-dashboard/04-summary-and-next-steps' },

							],
						},
					],
				},
				{
					label: 'JSON-RPC API',
					items: [
						{ label: 'Querying Data', slug: 'json-rpc/querying-data' },
						{ label: 'Mutating Entities', slug: 'json-rpc/mutating-entities' },
					],
				},
			],
			customCss: [
				'./src/fonts/font-face.css',
				'@fontsource/ibm-plex-mono/400.css',
				'@fontsource/ibm-plex-mono/500.css',
				'@fontsource/ibm-plex-mono/700.css',
				'./src/styles/global.css',
			],
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
			},
			plugins: [starlightPageActions({
				baseUrl: 'https://arkiv-network.github.io/arkiv-starlight-docs/'
			})]
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
