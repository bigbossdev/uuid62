# @bboss/uuid62

A lightweight TypeScript library for encoding and decoding UUIDs to/from Base62 strings, designed exclusively for Node.js environments.

## Features

- 🚀 **Fast & Lightweight**: Zero dependencies, optimized for performance
- 🔒 **Node.js Only**: Built specifically for server-side applications
- 📦 **TypeScript Native**: Full TypeScript support with type definitions
- 🧪 **Well Tested**: 90%+ test coverage with comprehensive test suite
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
- Not compatible with browser environments

## Usage

### Basic Usage

```javascript
const uuid62 = require('@bboss/uuid62');

// Generate a new Base62 UUID
const shortId = uuid62.v4();
console.log(shortId); // → "3D4bh7HM9Y8EpjkcC9H1uT"

// Decode Base62 back to standard UUID
const standardUuid = uuid62.decode(shortId);
console.log(standardUuid); // → "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// Encode existing UUID to Base62
const encoded = uuid62.encode('f47ac10b-58cc-4372-a567-0e02b2c3d479');
console.log(encoded); // → "5wbwf6yUxVBcr48AMbz9cb"
```

### TypeScript Usage

```typescript
import { v4, encode, decode, isValidUuid, isValidBase62 } from '@bboss/uuid62';

// Generate and validate
const id: string = v4();
const isValid: boolean = isValidBase62(id);

// Type-safe encoding/decoding
const uuid: string = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const encoded: string = encode(uuid);
const decoded: string = decode(encoded);
```

### Validation

```javascript
const uuid62 = require('@bboss/uuid62');

// Validate UUID format
console.log(uuid62.isValidUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')); // → true
console.log(uuid62.isValidUuid('f47ac10b58cc4372a5670e02b2c3d479'));   // → true (no hyphens)
console.log(uuid62.isValidUuid('invalid-uuid'));                        // → false

// Validate Base62 format
console.log(uuid62.isValidBase62('5wbwf6yUxVBcr48AMbz9cb')); // → true
console.log(uuid62.isValidBase62('invalid@base62!'));        // → false
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

## Base62 Character Set

Uses the following 62 characters: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`

## Performance

- **Encoding/Decoding**: ~14,000+ operations per second
- **Memory Usage**: Minimal footprint with zero dependencies
- **Test Results**: 1000 round-trip operations in ~70ms

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

## Browser Compatibility

This library is **Node.js only** and will throw an error if used in browser environments:

```javascript
// In browser environment:
// Error: @bboss/uuid62 is Node.js only and cannot run in browser environments
```

## License

MIT License - see [LICENSE](LICENSE) file for details.