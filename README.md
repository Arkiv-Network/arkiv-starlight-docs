# Starlight Starter Kit: Tailwind

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

```sh
bun create astro@latest -- --template starlight/tailwind
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro + Starlight project, you'll see the following folders and files:

```text
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   ├── styles/
│   │   └── global.css
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

The project includes [Tailwind CSS](https://starlight.astro.build/guides/css-and-tailwind/#tailwind-css) for styling. Customize your design by modifying `src/styles/global.css`.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `bun install`          | Installs dependencies                            |
| `bun dev`              | Starts local dev server at `localhost:4321`      |
| `bun build`            | Build your production site to `./dist/`          |
| `bun preview`          | Preview your build locally, before deploying     |
| `bun astro ...`        | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help`  | Get help using the Astro CLI                     |
| `bun run feedback:dev` | Starts the Bun feedback API on `localhost:3000`  |

## Feedback API

The repo also includes a small Bun service in `server.ts` for the future "Was this page helpful?" widget.

- Deployed endpoint: `POST /api/feedback`
- Deployed health check: `GET /api/health`
- Direct service endpoint: `POST /feedback`
- Direct service health check: `GET /health`
- Deployed host: `docs.arkiv.network`
- Required body field: `sentiment` (`positive` or `negative`)
- Optional body fields: `comment`, `pageUrl`, `pageTitle`
- Required environment variable: `SLACK_WEBHOOK_URL`
- Optional environment variables: `FEEDBACK_ALLOWED_ORIGINS`, `FEEDBACK_MAX_BODY_BYTES`, `FEEDBACK_MAX_COMMENT_LENGTH`

## 👀 Want to learn more?

Check out [Starlight’s docs](https://starlight.astro.build/), read [the Astro documentation](https://docs.astro.build), or jump into the [Astro Discord server](https://astro.build/chat).
