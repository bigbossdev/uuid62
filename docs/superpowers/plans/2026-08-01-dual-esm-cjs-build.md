# Dual ESM/CJS Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@bboss/uuid62` with native CommonJS *and* ESM entry points, produced by two `tsc` passes over the same `src/`, with an automated smoke test that fails the build if the two outputs ever diverge.

**Architecture:** `tsc` compiles `src/` twice — once with `tsconfig.cjs.json` (`module: CommonJS`) into `dist/cjs`, once with `tsconfig.esm.json` (`module: ES2020`) into `dist/esm`. A post-build Node script (`scripts/postbuild.js`) writes a `package.json` marker (`type: commonjs` / `type: module`) into each output folder and rewrites `dist/esm`'s relative import specifiers to carry an explicit `.js` extension, since Node's native ESM resolver requires it and `tsc` does not add it automatically. `package.json`'s `exports` field routes `require`/`import` to the matching folder, and legacy `main`/`types` fields keep pointing at `dist/cjs` for tools that don't understand `exports`. `scripts/verify-dual-build.js` runs as the last build step, `require()`s the CJS output and dynamically `import()`s the ESM output, and asserts they behave identically.

**Tech Stack:** TypeScript 5.9.3, `tsc` (no bundler), Node.js built-ins only (no new dependencies), Jest + ts-jest for the existing unit suite.

## Global Constraints

- Zero new npm dependencies — everything (postbuild, verify) is a plain Node script using only built-in modules (`fs`, `path`, `assert`, `url`).
- No change to runtime encode/decode behavior or public API surface — this is a packaging-only change.
- Existing CommonJS consumers (`require('@bboss/uuid62')`) must keep working exactly as before — `main`/`types` fields keep resolving to the same effective output.
- Node.js >=16.0.0 support floor (per `package.json` `engines`) must be preserved.
- Existing Jest suite (`test/index.test.ts`, imports from `../src/index`) must keep passing unmodified.
- Known reference pair used throughout for spot-checks: UUID `49ceabcf-5e02-4449-be28-a9b341df4b08` ↔ Base62 `2fgT6HSnoa1fpeINbxJIo0` (from README.md, verified consistent with existing tests).
- This environment is Windows (Git Bash / PowerShell) — any Node dynamic `import()` of an absolute filesystem path must go through `url.pathToFileURL(...)`, since Node's ESM loader rejects raw Windows absolute paths (`D:\...`) passed to `import()`.

---

### Task 1: Dual `tsc` build configuration + postbuild fix-up

**Files:**
- Create: `tsconfig.base.json`
- Create: `tsconfig.cjs.json`
- Create: `tsconfig.esm.json`
- Modify: `tsconfig.json` (root — used by ts-jest and editors; becomes a thin CJS-flavored config extending the new base)
- Create: `scripts/postbuild.js`
- Modify: `package.json:34` (the `"build"` script line)

**Interfaces:**
- Produces: `dist/cjs/index.js`, `dist/cjs/index.d.ts`, `dist/cjs/package.json` (`{"type":"commonjs"}`) — CommonJS build
- Produces: `dist/esm/index.js`, `dist/esm/index.d.ts`, `dist/esm/package.json` (`{"type":"module"}`) — ESM build, with relative imports rewritten to include `.js`
- Produces: `yarn build` runs `rimraf dist && tsc -p tsconfig.cjs.json && tsc -p tsconfig.esm.json && node scripts/postbuild.js`

- [ ] **Step 1: Create `tsconfig.base.json` with the shared compiler options**

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "lib": ["ES2020"],
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "allowSyntheticDefaultImports": true
    },
    "include": [
        "src/**/*"
    ],
    "exclude": [
        "node_modules",
        "dist",
        "test/**/*"
    ]
}
```

- [ ] **Step 2: Create `tsconfig.cjs.json`**

```json
{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "CommonJS",
        "outDir": "./dist/cjs"
    }
}
```

- [ ] **Step 3: Create `tsconfig.esm.json`**

```json
{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "ES2020",
        "outDir": "./dist/esm"
    }
}
```

- [ ] **Step 4: Replace the root `tsconfig.json` to extend the base (keeps editor/ts-jest type-checking working, mirrors the old CJS-flavored settings)**

Replace the full contents of `tsconfig.json` with:

```json
{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "CommonJS",
        "outDir": "./dist"
    }
}
```

- [ ] **Step 5: Run the existing Jest suite to confirm the tsconfig change didn't break test compilation**

Run: `yarn test`
Expected: all existing tests pass (same count as before this change — no test files were touched).

- [ ] **Step 6: Manually compile both targets to confirm the configs are valid**

Run: `npx tsc -p tsconfig.cjs.json && npx tsc -p tsconfig.esm.json`
Expected: no errors; `dist/cjs/index.js`, `dist/cjs/index.d.ts`, `dist/esm/index.js`, `dist/esm/index.d.ts` all exist.

- [ ] **Step 7: Inspect the raw ESM output to confirm the extension problem exists (so the next step's fix is verifiable)**

Run: `node -e "console.log(require('fs').readFileSync('dist/esm/index.js','utf8').split('\n').slice(0,3).join('\n'))"`
Expected: second line reads `import { BASE62_CHARS, ... } from './utils';` — **no** `.js` extension. This confirms Node's ESM loader would fail to resolve it (`ERR_MODULE_NOT_FOUND`) without the postbuild fix.

- [ ] **Step 8: Create `scripts/postbuild.js`**

```js
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const cjsDir = path.join(distDir, 'cjs');
const esmDir = path.join(distDir, 'esm');

fs.writeFileSync(
    path.join(cjsDir, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2) + '\n'
);

fs.writeFileSync(
    path.join(esmDir, 'package.json'),
    JSON.stringify({ type: 'module' }, null, 2) + '\n'
);

const RELATIVE_IMPORT_RE = /from\s+(['"])(\.\.?\/[^'"]+)\1/g;

for (const file of fs.readdirSync(esmDir)) {
    if (!file.endsWith('.js')) continue;

    const filePath = path.join(esmDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const fixed = content.replace(RELATIVE_IMPORT_RE, (match, quote, specifier) => {
        if (specifier.endsWith('.js')) return match;
        return `from ${quote}${specifier}.js${quote}`;
    });

    if (fixed !== content) {
        fs.writeFileSync(filePath, fixed, 'utf8');
    }
}

console.log('postbuild: wrote dist/cjs/package.json, dist/esm/package.json, fixed ESM relative import extensions');
```

- [ ] **Step 9: Run the postbuild script and confirm the fix-up worked**

Run: `node scripts/postbuild.js`
Then: `node -e "console.log(require('fs').readFileSync('dist/esm/index.js','utf8').split('\n').slice(0,3).join('\n'))"`
Expected: the import line now reads `from './utils.js'`. Also confirm marker files: `node -e "console.log(require('fs').readFileSync('dist/cjs/package.json','utf8'), require('fs').readFileSync('dist/esm/package.json','utf8'))"` prints `{"type": "commonjs"}` and `{"type": "module"}`.

- [ ] **Step 10: Prove the ESM output is now actually loadable by Node**

Run: `node --input-type=module -e "import('./dist/esm/index.js').then(m => console.log(m.encode('49ceabcf-5e02-4449-be28-a9b341df4b08')))"`
Expected: prints `2fgT6HSnoa1fpeINbxJIo0` — no `ERR_MODULE_NOT_FOUND`.

Also confirm CJS still works: `node -e "console.log(require('./dist/cjs').encode('49ceabcf-5e02-4449-be28-a9b341df4b08'))"`
Expected: prints `2fgT6HSnoa1fpeINbxJIo0`.

- [ ] **Step 11: Wire the two-pass build + postbuild into `package.json`'s `build` script**

In `package.json`, change:
```json
"build": "rimraf dist && tsc",
```
to:
```json
"build": "rimraf dist && tsc -p tsconfig.cjs.json && tsc -p tsconfig.esm.json && node scripts/postbuild.js",
```

- [ ] **Step 12: Run the full build end-to-end from clean**

Run: `yarn build`
Expected: exits 0; `dist/cjs/` and `dist/esm/` both exist with `index.js`, `index.d.ts`, `package.json` (and `utils.js`/`utils.d.ts`).

- [ ] **Step 13: Commit**

```bash
git add tsconfig.base.json tsconfig.cjs.json tsconfig.esm.json tsconfig.json scripts/postbuild.js package.json
git commit -m "build: compile dual CommonJS/ESM output via two tsc passes"
```

---

### Task 2: `package.json` `exports`/`main`/`types` wiring

**Files:**
- Modify: `package.json` (top-level `main`, `types`, new `exports` field)

**Interfaces:**
- Consumes: `dist/cjs/index.js`, `dist/cjs/index.d.ts`, `dist/esm/index.js` produced by Task 1
- Produces: `package.json` fields that both legacy tools (`main`/`types`) and modern conditional-export-aware tools (`exports`) resolve to the correct build

- [ ] **Step 1: Update `main`/`types` and add `exports` in `package.json`**

Change:
```json
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
```
to:
```json
    "main": "dist/cjs/index.js",
    "types": "dist/cjs/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/cjs/index.d.ts",
            "require": "./dist/cjs/index.js",
            "import": "./dist/esm/index.js"
        }
    },
```

(Leave `"files": ["dist/**/*", "README.md", "LICENSE"]` untouched — it already covers both `dist/cjs` and `dist/esm`.)

- [ ] **Step 2: Rebuild and verify every path `package.json` now points at actually exists**

Run: `yarn build`
Then run:
```bash
node -e "
const p = require('./package.json');
const fs = require('fs');
console.log('main:', p.main, fs.existsSync(p.main));
console.log('types:', p.types, fs.existsSync(p.types));
console.log('exports.require:', p.exports['.'].require, fs.existsSync(require('path').join('.', p.exports['.'].require)));
console.log('exports.import:', p.exports['.'].import, fs.existsSync(require('path').join('.', p.exports['.'].import)));
console.log('exports.types:', p.exports['.'].types, fs.existsSync(require('path').join('.', p.exports['.'].types)));
"
```
Expected: every line prints `true` for the existence check.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: point package.json main/types/exports at dual cjs/esm output"
```

---

### Task 3: Dual-build smoke test, wired into `yarn build`

**Files:**
- Create: `scripts/verify-dual-build.js`
- Modify: `package.json:34` (append the verify step to the `build` script)

**Interfaces:**
- Consumes: `dist/cjs` (via `require`), `dist/esm/index.js` (via dynamic `import()`) — same public API used by `test/index.test.ts`: `encode`, `decode`, `v4`, `generateBase62`, `isValidBase62`
- Produces: `yarn build` now exits non-zero if the CJS and ESM outputs disagree

- [ ] **Step 1: Create `scripts/verify-dual-build.js`**

```js
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

const KNOWN_UUID = '49ceabcf-5e02-4449-be28-a9b341df4b08';
const KNOWN_BASE62 = '2fgT6HSnoa1fpeINbxJIo0';

async function main() {
    const cjs = require(path.join(__dirname, '..', 'dist', 'cjs'));
    const esmEntry = pathToFileURL(path.join(__dirname, '..', 'dist', 'esm', 'index.js')).href;
    const esm = await import(esmEntry);

    assert.strictEqual(cjs.encode(KNOWN_UUID), KNOWN_BASE62, 'cjs encode() mismatch');
    assert.strictEqual(cjs.decode(KNOWN_BASE62), KNOWN_UUID, 'cjs decode() mismatch');
    assert.strictEqual(esm.encode(KNOWN_UUID), KNOWN_BASE62, 'esm encode() mismatch');
    assert.strictEqual(esm.decode(KNOWN_BASE62), KNOWN_UUID, 'esm decode() mismatch');
    assert.strictEqual(cjs.encode(KNOWN_UUID), esm.encode(KNOWN_UUID), 'cjs/esm encode() diverge');

    const cjsId = cjs.v4();
    const esmId = esm.v4();
    assert.strictEqual(cjs.isValidBase62(cjsId), true, 'cjs v4() produced invalid base62');
    assert.strictEqual(esm.isValidBase62(esmId), true, 'esm v4() produced invalid base62');
    assert.strictEqual(cjsId.length, 22, 'cjs v4() length mismatch');
    assert.strictEqual(esmId.length, 22, 'esm v4() length mismatch');
    assert.strictEqual(esm.generateBase62().length, 22, 'esm generateBase62() length mismatch');

    console.log('verify-dual-build: cjs and esm builds match');
}

main().catch((err) => {
    console.error('verify-dual-build: FAILED');
    console.error(err.message);
    process.exit(1);
});
```

- [ ] **Step 2: Run it against the current (correct) build to confirm it passes**

Run: `node scripts/verify-dual-build.js`
Expected: prints `verify-dual-build: cjs and esm builds match`, exits 0.

- [ ] **Step 3: Prove the checker actually catches a broken build (red check)**

Using the Write tool, overwrite `dist/esm/index.js` with this deliberately-broken content:

```javascript
export function encode(){return "broken"}
export function decode(){return "broken"}
export function v4(){return "0000000000000000000000"}
export function generateBase62(){return v4()}
export function isValidBase62(){return false}
```

Then run: `node scripts/verify-dual-build.js`
Expected: prints `verify-dual-build: FAILED` and an assertion message (e.g. `esm encode() mismatch`), exits with code 1.

- [ ] **Step 4: Restore the build (undo the deliberate corruption from Step 3)**

Run: `yarn build`
Then: `node scripts/verify-dual-build.js`
Expected: back to `verify-dual-build: cjs and esm builds match`, exit 0 (this also re-confirms Task 1/2's build script chain still works standalone).

- [ ] **Step 5: Append the verify step to `package.json`'s `build` script**

Change:
```json
"build": "rimraf dist && tsc -p tsconfig.cjs.json && tsc -p tsconfig.esm.json && node scripts/postbuild.js",
```
to:
```json
"build": "rimraf dist && tsc -p tsconfig.cjs.json && tsc -p tsconfig.esm.json && node scripts/postbuild.js && node scripts/verify-dual-build.js",
```

- [ ] **Step 6: Run the full build one more time end-to-end**

Run: `yarn build`
Expected: exits 0, last line of output is `verify-dual-build: cjs and esm builds match`.

- [ ] **Step 7: Commit**

```bash
git add scripts/verify-dual-build.js package.json
git commit -m "build: verify cjs/esm output parity as the final build step"
```

---

### Task 4: Documentation updates

**Files:**
- Modify: `CLAUDE.md` (Commands section, Architecture section)
- Modify: `README.md` (usage example)
- Modify: `CHANGELOG.md` (new entry)

**Interfaces:**
- Consumes: nothing (pure documentation, describes the behavior built in Tasks 1–3)
- Produces: nothing consumed by later tasks — this is the last task

- [ ] **Step 1: Update the Commands section of `CLAUDE.md`**

Change:
```markdown
- `yarn build` — clean `dist/` and compile with `tsc`
```
to:
```markdown
- `yarn build` — clean `dist/`, compile CommonJS to `dist/cjs` and ESM to `dist/esm` (two `tsc` passes via `tsconfig.cjs.json`/`tsconfig.esm.json`), then post-process (`scripts/postbuild.js`) and verify parity between the two outputs (`scripts/verify-dual-build.js`)
```

- [ ] **Step 2: Add a dual-build paragraph to the Architecture section of `CLAUDE.md`**

After the existing paragraph that starts with "Build output (`dist/`) targets CommonJS...", add:

```markdown
Build output is dual-format: `tsc` compiles `src/` twice — `tsconfig.cjs.json` → `dist/cjs` (CommonJS), `tsconfig.esm.json` → `dist/esm` (ES modules). `scripts/postbuild.js` writes a `package.json` marker into each folder (`{"type":"commonjs"}` / `{"type":"module"}`) and rewrites `dist/esm`'s relative import specifiers to add the `.js` extension Node's ESM resolver requires but `tsc` doesn't emit. `package.json`'s `exports` field routes `require`/`import` to the matching folder; `main`/`types` still point at `dist/cjs` for tools that ignore `exports`. `scripts/verify-dual-build.js` runs as the final build step and fails the build if the two outputs' `encode`/`decode`/`v4` behavior diverges.
```

- [ ] **Step 3: Update the usage example in `README.md`**

Change:
```javascript
import uuid62 from '@bboss/uuid62';
// const uuid62 = require('@bboss/uuid62'); // legacy way
```
to:
```javascript
// ESM
import uuid62 from '@bboss/uuid62';

// CommonJS
const uuid62 = require('@bboss/uuid62');
```

- [ ] **Step 4: Add a changelog entry**

At the top of `CHANGELOG.md`, above `## [1.2.0] - 2025-10-27`, add:

```markdown
## [Unreleased]

- Added dual ESM/CommonJS build output (`dist/cjs`, `dist/esm`) with a matching `exports` map in `package.json` — both `require()` and `import` are now natively supported
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md README.md CHANGELOG.md
git commit -m "docs: document dual ESM/CJS build support"
```
