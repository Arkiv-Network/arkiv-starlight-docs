#!/usr/bin/env bun
// Clones arkiv-sdk-js into .sdk-cache/ and installs its dependencies so the
// starlight-typedoc Astro plugin can generate API docs from source at build
// time.
//
// Env vars:
//   SDK_DOCS_REF       git ref to check out. Default "develop", the SDK branch
//                      that cuts the dev releases. Set it to a tag to pin.
//   SDK_DOCS_REFRESH=1 — wipe the cached clone and re-clone fresh.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_URL = "https://github.com/Arkiv-Network/arkiv-sdk-js.git";
const REF = process.env.SDK_DOCS_REF ?? "develop";
const FORCE =
	process.env.SDK_DOCS_REFRESH === "1" || process.argv.includes("--force");

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheRoot = join(repoRoot, ".sdk-cache");
const clonePath = join(cacheRoot, "arkiv-sdk-js");

const log = (msg: string): void => console.log(`[sync-sdk-source] ${msg}`);

function run(cmd: string, args: string[], cwd?: string): void {
	const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
	if (result.status !== 0) {
		throw new Error(
			`${cmd} ${args.join(" ")} exited with code ${result.status}`,
		);
	}
}

async function main(): Promise<void> {
	if (FORCE) {
		log(`wiping ${clonePath}`);
		await rm(clonePath, { recursive: true, force: true });
	}

	await mkdir(cacheRoot, { recursive: true });

	if (existsSync(clonePath)) {
		log(`updating existing clone → ${REF}`);
		run("git", ["fetch", "--depth=1", "origin", REF], clonePath);
		run("git", ["reset", "--hard", "FETCH_HEAD"], clonePath);
		run("git", ["clean", "-fdx", "--exclude=node_modules"], clonePath);
	} else {
		log(`cloning ${REPO_URL}#${REF}`);
		run("git", [
			"clone",
			"--depth=1",
			"--branch",
			REF,
			REPO_URL,
			clonePath,
		]);
	}

	log("installing SDK dependencies (bun install)");
	run("bun", ["install", "--frozen-lockfile"], clonePath);

	log(`ready at ${clonePath}`);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	console.error(`[sync-sdk-source] ${msg}`);
	process.exit(1);
});
