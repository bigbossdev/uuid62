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
