# Changelog

## [Unreleased]

### Documentation
- README: documented the import-time browser check (including Jest `jsdom`), that `encode` accepts any UUID version, the non-ASCII sort order of the Base62 alphabet, the "too large" decode error, and the `typecheck`/`test:coverage` scripts

### Internal
- Switched the development package manager from Yarn (Berry) to npm: `package-lock.json` replaces `yarn.lock`/`.yarn/`, CI and publish workflows use `npm ci`/`npm run`. No change for package consumers.
- Resolved `npm audit` advisories in dev-only transitive dependencies of Jest (`glob` <14.0.2, `minimatch` <11.0.1) via `overrides` in `package.json`

## [1.3.1] - 2026-11-21

### Packaging
- `exports` now declares per-condition `types`: `import` resolves `dist/esm/index.d.ts`, `require` resolves `dist/cjs/index.d.ts`
- ESM declaration files use explicit `.js` extensions for relative imports (`node16`/`nodenext` resolution)
- TypeScript sources (`src/**/*.ts`) are now published so source maps and declaration maps resolve

### Internal
- Added PR CI: typecheck (new `yarn typecheck` script), tests with 100% coverage threshold, build, `@arethetypeswrong/cli`, and a runtime smoke test of the built output on Node 16/18/20/22/24
- Publish workflow runs an explicit build step
- Expanded test suite (edge cases, 100% coverage threshold); removed unreachable code in `decode`/`encode` (no behavior change)
- Updated dev dependencies: Jest 30, TypeScript 6, Yarn 4.18.1
- Added `.gitattributes` (LF line endings)
- Added Dependabot for dev dependencies and GitHub Actions; README badges

## [1.3.0] - 2026-08-01

- Added dual ESM/CommonJS build output (`dist/cjs`, `dist/esm`) with a matching `exports` map in `package.json` — both `require()` and `import` are now natively supported

## [1.2.0] - 2025-10-27

- Added `generateBase62()` function as an alias for `v4()`
- Removed `isValidUuid()` from public API (kept as internal function)

## [1.1.2] - 2025-10-26

- Improved CI/CD workflow and yarn consistency
- Updated package.json scripts and dependencies

## [1.1.1] - 2025-10-25

- Updated README.md examples to use consistent UUID/Base62 values that match actual encoding/decoding results

## [1.1.0] - 2025-10-25

- Base62 character set order changed from `0-9A-Za-z` to `0-9a-zA-Z` (lowercase before uppercase)
- `encode()` function now returns fixed 22-character strings with zero-padding

## [1.0.0] - 2025-10-25 (REMOVED)

**Note**: This version has been removed from the NPM registry.

- Initial release
- UUID to Base62 encoding/decoding
- TypeScript support
- Zero dependencies
- Node.js 16+ only