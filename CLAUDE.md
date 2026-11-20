# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn build` — clean `dist/`, compile CommonJS to `dist/cjs` and ESM to `dist/esm` (two `tsc` passes via `tsconfig.cjs.json`/`tsconfig.esm.json`), then post-process (`scripts/postbuild.js`) and verify parity between the two outputs (`scripts/verify-dual-build.js`)
- `yarn test` — run the Jest test suite
- `yarn test:watch` — run tests in watch mode
- `yarn test:coverage` — run tests with coverage report (output to `coverage/`)
- Run a single test: `yarn test -t "test name substring"` (matches Jest's `-t` filter against `test()`/`describe()` names)

Package manager is Yarn (Berry, `yarn@4.18.1` via `.yarnrc.yml` / `.yarn/`). If `yarn` isn't on PATH (e.g. in the Bash/PowerShell tool shells), prefix with `corepack`: `corepack yarn test`, `corepack yarn build`. Tests live in `test/index.test.ts` and run directly against TypeScript sources via `ts-jest`; no build step is needed to run tests.

There is no PR CI — the only workflow is the tag-triggered publish. Run `yarn test` and `yarn build` locally before opening a PR. `main` is branch-protected; changes go through feature branches + PRs.

**Always create a feature branch (`git checkout -b <type>/<topic>`, e.g. `feat/...`, `fix/...`, `docs/...`) before making any change to tracked files** — never edit on `main`. Use a plain branch in the main checkout, not `git worktree`.

## Architecture

Two-file source layout:

- `src/utils.ts` — pure helpers: the Base62 alphabet (`BASE62_CHARS`, ordered `0-9a-zA-Z`), UUID/Base62 format validation via regex, hyphen normalization/formatting, and `checkNodeEnvironment()` which throws if `window`/`document` exist (guards against browser bundling).
- `src/index.ts` — public API (`encode`, `decode`, `v4`, `generateBase62`, `isValidBase62`) plus a default export object for CommonJS consumers. Calls `checkNodeEnvironment()` once at module load.

Encoding is a straight base conversion: a UUID's 32 hex digits are parsed as a single `BigInt`, then repeatedly divided by 62 to produce Base62 digits, left-padded with `'0'` to a **fixed 22-character** output. Decoding reverses this — Base62 digits are folded into a `BigInt`, converted back to a 32-char hex string (padded with leading zeros), and re-hyphenated into standard UUID form. Because the algorithm is pure `BigInt` arithmetic, `encode`/`decode` have no Node-specific dependency; only `v4()` needs `crypto.randomUUID()`.

`isValidUuid()` is intentionally *not* exported from `index.ts` (see CHANGELOG 1.2.0) — it's exported from `utils.ts` for internal use only. Keep this asymmetry in mind: `isValidBase62` is public, `isValidUuid` is not.

Behavioral quirks (existing public behavior — changing any of these is a breaking change):
- `encode` accepts uppercase and hyphenless UUIDs; `decode` always returns lowercase, hyphenated form.
- `decode` accepts Base62 input of any length — short input is treated as having leading zeros (`decode('abc')` → `00000000-0000-0000-0000-0000000098de`). Only values exceeding 128 bits throw (`Invalid Base62 value: too large for UUID`).
- `isValidBase62` checks the character set only, not the 22-char length.

Build output is dual-format: `tsc` compiles `src/` twice — `tsconfig.cjs.json` → `dist/cjs` (CommonJS), `tsconfig.esm.json` → `dist/esm` (ES modules), both with declaration files and source maps. `scripts/postbuild.js` writes a `package.json` marker into each folder (`{"type":"commonjs"}` / `{"type":"module"}`) and rewrites `dist/esm`'s relative import specifiers to add the `.js` extension Node's ESM resolver requires but `tsc` doesn't emit. `package.json`'s `exports` field routes `require`/`import` to the matching folder; `main`/`types` still point at `dist/cjs` for tools that ignore `exports`. `scripts/verify-dual-build.js` runs as the final build step and fails the build if the two outputs' `encode`/`decode`/`v4` behavior diverges. `dist/**/*` plus `README.md`/`LICENSE` are what actually ships (`package.json` `files`).

TS config layout: shared compiler options live in `tsconfig.base.json`; `tsconfig.cjs.json`/`tsconfig.esm.json` only set `module` + `outDir`. The root `tsconfig.json` is *not* used by the build (it's for editors/ts-jest) — change `tsconfig.base.json` for compiler-option changes. TypeScript is on 6.x: `types` must be listed explicitly (`["node"]` in base, plus `"jest"` in `tsconfig.json` for ts-jest) and `moduleResolution` is `bundler` (`node`/`node10` errors in TS 6). Don't bump to TypeScript 7 until ts-jest supports it (its peer range is `<7`). `exports["."].types` points at the CJS `.d.ts` for both `import` and `require`.

## Working files

Superpowers skill outputs (design specs, implementation plans, etc.) go under `.superpowers/` (e.g. `.superpowers/specs/`, `.superpowers/plans/`), **not** `docs/superpowers/`. `.superpowers/` is gitignored — never commit these files.

## Release flow

Publishing is tag-triggered: pushing a `v*` tag runs `.github/workflows/publish.yml`, which installs via `yarn install --immutable`, runs `yarn test`, then `npm publish --access=public`. The workflow has no explicit build step — `npm publish` triggers `prepublishOnly` (`yarn build`), so the dual-build verification runs at publish time and a parity failure aborts the publish. Bump `version` in `package.json` and update `CHANGELOG.md` before tagging a release.
