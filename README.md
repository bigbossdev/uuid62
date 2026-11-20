# @bboss/uuid62

[![npm](https://img.shields.io/npm/v/@bboss/uuid62)](https://www.npmjs.com/package/@bboss/uuid62)
[![CI](https://github.com/bigbossdev/uuid62/actions/workflows/ci.yml/badge.svg)](https://github.com/bigbossdev/uuid62/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@bboss/uuid62)](LICENSE)

A lightweight TypeScript library for encoding and decoding UUIDs to/from Base62 strings, designed exclusively for Node.js environments.

## Features

- 🚀 **Fast & Lightweight**: Zero dependencies, optimized for performance
- 🔒 **Node.js Only**: Built specifically for server-side applications
- 📦 **TypeScript Native**: Full TypeScript support with type definitions
- 🔀 **ESM + CommonJS**: Ships native builds for both `import` and `require()`
- 🧪 **Well Tested**: Comprehensive test suite with high coverage
- 🔧 **Simple API**: Easy-to-use functions for encoding, decoding, and validation

## Installation

```bash
# npm
npm install @bboss/uuid62

# yarn
yarn add @bboss/uuid62
```

## Requirements

- Node.js 16.0.0 or higher (requires `crypto.randomUUID()`)
- **Node.js only** - not compatible with browser environments

## Usage

The package ships both an ES module build and a CommonJS build (since 1.3.0); Node picks the right one automatically. Both default and named imports are supported:

```javascript
// ESM — default import
import uuid62 from '@bboss/uuid62';

// ESM — named imports
import { encode, decode, v4, generateBase62, isValidBase62 } from '@bboss/uuid62';

// CommonJS
const uuid62 = require('@bboss/uuid62');
const { encode, decode } = require('@bboss/uuid62');
```

```javascript
// Generate a new Base62 UUID
const shortId = uuid62.v4();
console.log(shortId); // → "2fgT6HSnoa1fpeINbxJIo0" (random)

// Alternative way to generate Base62 UUID
const shortId2 = uuid62.generateBase62();
console.log(shortId2); // → "3hgU7ITopa2gqfJOcyKJp1" (random)

// Encode existing UUID to Base62
const encoded = uuid62.encode('49ceabcf-5e02-4449-be28-a9b341df4b08');
console.log(encoded); // → "2fgT6HSnoa1fpeINbxJIo0"

// Decode Base62 back to standard UUID
const decoded = uuid62.decode('2fgT6HSnoa1fpeINbxJIo0');
console.log(decoded); // → "49ceabcf-5e02-4449-be28-a9b341df4b08"

// Validation
console.log(uuid62.isValidBase62('2fgT6HSnoa1fpeINbxJIo0')); // → true
```

## API Reference

### `v4(): string`
Generates a new UUID v4 using `crypto.randomUUID()` and encodes it to Base62.

**Returns:** Base62 encoded UUID string

### `generateBase62(): string`
Generates a new UUID v4 using `crypto.randomUUID()` and encodes it to Base62 (alias for v4).

**Returns:** Base62 encoded UUID string

### `encode(uuid: string): string`
Encodes a standard UUID to Base62 format.

**Parameters:**
- `uuid` - Standard UUID string (with or without hyphens, case-insensitive)

**Returns:** Base62 encoded string, always exactly 22 characters (left-padded with `0`)

**Throws:** `Invalid UUID format` if the input is not a valid UUID

### `decode(base62: string): string`
Decodes a Base62 string back to standard UUID format.

**Parameters:**
- `base62` - Base62 encoded string. Shorter-than-22-character input is accepted and treated as if left-padded with `0`.

**Returns:** Standard UUID string in lowercase with hyphens

**Throws:**
- `Invalid Base62 format` if the input is empty or contains non-Base62 characters
- `Invalid Base62 value: too large for UUID` if the decoded value exceeds 128 bits

### `isValidBase62(str: string): boolean`
Checks whether a string consists only of Base62 characters (`0-9a-zA-Z`). It does **not** check length, so it does not guarantee the string is a decodable 22-character UUID.

**Parameters:**
- `str` - String to validate

**Returns:** `true` if non-empty and all characters are Base62, `false` otherwise

## Error Handling

The library throws descriptive errors for invalid inputs:

```javascript
try {
    uuid62.encode('invalid-uuid');
} catch (error) {
    console.log(error.message); // → "Invalid UUID format"
}

try {
    uuid62.decode('invalid@base62!');
} catch (error) {
    console.log(error.message); // → "Invalid Base62 format"
}
```

## Base62 Character Set

Uses the following 62 characters: `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`

## Development

```bash
yarn install
yarn test     # run the Jest suite against TypeScript sources
yarn build    # build dist/cjs + dist/esm and verify both outputs match
```

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

MIT License - see [LICENSE](LICENSE) file for details.