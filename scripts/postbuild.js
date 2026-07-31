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
