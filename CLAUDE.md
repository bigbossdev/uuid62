# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn build` — clean `dist/`, compile CommonJS to `dist/cjs` and ESM to `dist/esm` (two `tsc` passes via `tsconfig.cjs.json`/`tsconfig.esm.json`), then post-process (`scripts/postbuild.js`) and verify parity between the two outputs (`scripts/verify-dual-build.js`)
- `yarn test` — run the Jest test suite
- `yarn test:watch` — run tests in watch mode
- `yarn test:coverage` — run tests with coverage report (output to `coverage/`)
- Run a single test: `yarn test -t "test name substring"` (matches Jest's `-t` filter against `test()`/`describe()` names)

Package manager is Yarn (Berry, `yarn@4.10.3` via `.yarnrc.yml` / `.yarn/`). Tests run directly against TypeScript sources via `ts-jest`; no build step is needed to run tests.

## Architecture

Two-file source layout:

- `src/utils.ts` — pure helpers: the Base62 alphabet (`BASE62_CHARS`, ordered `0-9a-zA-Z`), UUID/Base62 format validation via regex, hyphen normalization/formatting, and `checkNodeEnvironment()` which throws if `window`/`document` exist (guards against browser bundling).
- `src/index.ts` — public API (`encode`, `decode`, `v4`, `generateBase62`, `isValidBase62`) plus a default export object for CommonJS consumers. Calls `checkNodeEnvironment()` once at module load.

Encoding is a straight base conversion: a UUID's 32 hex digits are parsed as a single `BigInt`, then repeatedly divided by 62 to produce Base62 digits, left-padded with `'0'` to a **fixed 22-character** output. Decoding reverses this — Base62 digits are folded into a `BigInt`, converted back to a 32-char hex string (padded with leading zeros), and re-hyphenated into standard UUID form. Because the algorithm is pure `BigInt` arithmetic, `encode`/`decode` have no Node-specific dependency; only `v4()` needs `crypto.randomUUID()`.

`isValidUuid()` is intentionally *not* exported from `index.ts` (see CHANGELOG 1.2.0) — it's an internal-only check re-exported just within `utils.ts`. Keep this asymmetry in mind: `isValidBase62` is public, `isValidUuid` is not.

Build output (`dist/`) targets CommonJS (`tsconfig.json`: `module: CommonJS`, `target: ES2020`) with declaration files and source maps; `dist/**/*` plus `README.md`/`LICENSE` are what actually ships (`package.json` `files`).

Build output is dual-format: `tsc` compiles `src/` twice — `tsconfig.cjs.json` → `dist/cjs` (CommonJS), `tsconfig.esm.json` → `dist/esm` (ES modules). `scripts/postbuild.js` writes a `package.json` marker into each folder (`{"type":"commonjs"}` / `{"type":"module"}`) and rewrites `dist/esm`'s relative import specifiers to add the `.js` extension Node's ESM resolver requires but `tsc` doesn't emit. `package.json`'s `exports` field routes `require`/`import` to the matching folder; `main`/`types` still point at `dist/cjs` for tools that ignore `exports`. `scripts/verify-dual-build.js` runs as the final build step and fails the build if the two outputs' `encode`/`decode`/`v4` behavior diverges.

## Release flow

Publishing is tag-triggered: pushing a `v*` tag runs `.github/workflows/publish.yml`, which installs via `yarn install --immutable`, runs `yarn test`, then `npm publish --access=public`. Bump `version` in `package.json` and update `CHANGELOG.md` before tagging a release.
