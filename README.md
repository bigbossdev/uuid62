# @bboss/uuid62

A lightweight TypeScript library for encoding and decoding UUIDs to/from Base62 strings, designed exclusively for Node.js environments.

## Features

- 🚀 **Fast & Lightweight**: Zero dependencies, optimized for performance
- 🔒 **Node.js Only**: Built specifically for server-side applications
- 📦 **TypeScript Native**: Full TypeScript support with type definitions
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

```javascript
import uuid62 from '@bboss/uuid62';
// const uuid62 = require('@bboss/uuid62'); // legacy way

// Generate a new Base62 UUID
const shortId = uuid62.v4();
console.log(shortId); // → "2fgT6HSnoa1fpeINbxJIo0" (random)

// Encode existing UUID to Base62
const encoded = uuid62.encode('49ceabcf-5e02-4449-be28-a9b341df4b08');
console.log(encoded); // → "2fgT6HSnoa1fpeINbxJIo0"

// Decode Base62 back to standard UUID
const decoded = uuid62.decode('2fgT6HSnoa1fpeINbxJIo0');
console.log(decoded); // → "49ceabcf-5e02-4449-be28-a9b341df4b08"

// Validation
console.log(uuid62.isValidUuid('49ceabcf-5e02-4449-be28-a9b341df4b08')); // → true
console.log(uuid62.isValidBase62('2fgT6HSnoa1fpeINbxJIo0')); // → true
```

## API Reference

### `v4(): string`
Generates a new UUID v4 using `crypto.randomUUID()` and encodes it to Base62.

**Returns:** Base62 encoded UUID string

### `encode(uuid: string): string`
Encodes a standard UUID to Base62 format.

**Parameters:**
- `uuid` - Standard UUID string (with or without hyphens)

**Returns:** Base62 encoded string

**Throws:** Error if UUID format is invalid

### `decode(base62: string): string`
Decodes a Base62 string back to standard UUID format.

**Parameters:**
- `base62` - Base62 encoded string

**Returns:** Standard UUID string with hyphens

**Throws:** Error if Base62 format is invalid

### `isValidUuid(str: string): boolean`
Validates if a string is a valid UUID format.

**Parameters:**
- `str` - String to validate

**Returns:** `true` if valid UUID, `false` otherwise

### `isValidBase62(str: string): boolean`
Validates if a string is a valid Base62 format.

**Parameters:**
- `str` - String to validate

**Returns:** `true` if valid Base62, `false` otherwise

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

## License

MIT License - see [LICENSE](LICENSE) file for details.