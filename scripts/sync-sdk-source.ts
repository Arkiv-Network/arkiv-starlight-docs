#!/usr/bin/env bun
// Clones arkiv-sdk-js into .sdk-cache/ and installs its dependencies so the
// starlight-typedoc Astro plugin can generate API docs from source at build
// time.
//
// Env vars:
//   SDK_DOCS_REF       git ref to check out. Default "develop", the SDK branch
//                      that cuts the dev releases (staging builds it too).
//                      "latest" resolves to the newest release tag (vX.Y.Z,
//                      prereleases skipped); production builds use it.
//   SDK_DOCS_REFRESH=1 — wipe the cached clone and re-clone fresh.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_URL = "https://github.com/Arkiv-Network/arkiv-sdk-js.git";
const REQUESTED_REF = process.env.SDK_DOCS_REF || "develop";
const FORCE =
	process.env.SDK_DOCS_REFRESH === "1" || process.argv.includes("--force");

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheRoot = join(repoRoot, ".sdk-cache");
const clonePath = join(cacheRoot, "arkiv-sdk-js");

const log = (msg: string): void => console.log(`[sync-sdk-source] ${msg}`);

// The newest stable release tag: vX.Y.Z without a -dev/-next suffix.
function latestRelease(): string {
	const result = spawnSync("git", ["ls-remote", "--tags", "--refs", REPO_URL], {
		encoding: "utf8",
	});
	if (result.status !== 0) {
		throw new Error(`git ls-remote exited with code ${result.status}`);
	}
	const versions = result.stdout
		.split("\n")
		.map((line) => line.split("refs/tags/")[1])
		.filter((tag): tag is string => /^v\d+\.\d+\.\d+$/.test(tag ?? ""))
		.map((tag) => ({ tag, parts: tag.slice(1).split(".").map(Number) }));
	if (versions.length === 0) throw new Error("no release tags found");
	versions.sort((a, b) => {
		for (let i = 0; i < 3; i++) {
			if (a.parts[i] !== b.parts[i]) return b.parts[i] - a.parts[i];
		}
		return 0;
	});
	return versions[0].tag;
}

function run(cmd: string, args: string[], cwd?: string): void {
	const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
	if (result.status !== 0) {
		throw new Error(
			`${cmd} ${args.join(" ")} exited with code ${result.status}`,
		);
	}
}

async function main(): Promise<void> {
	const REF = REQUESTED_REF === "latest" ? latestRelease() : REQUESTED_REF;
	if (REF !== REQUESTED_REF) log(`latest release is ${REF}`);

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
