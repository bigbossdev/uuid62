import uuid62, { encode, decode, v4, generateBase62, isValidBase62 } from '../src/index';
import { checkNodeEnvironment } from '../src/utils';

describe('UUID62 Library Tests', () => {
    
    test('encode: should encode UUID to Base62', () => {
        const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        const encoded = encode(uuid);
        expect(typeof encoded).toBe('string');
        expect(encoded.length).toBe(22);
        expect(isValidBase62(encoded)).toBe(true);
    });

    test('encode: should always return 22-character string', () => {
        const testUuids = [
            '00000000-0000-0000-0000-000000000000',
            'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            'ffffffff-ffff-ffff-ffff-ffffffffffff'
        ];
        
        testUuids.forEach(uuid => {
            const encoded = encode(uuid);
            expect(encoded.length).toBe(22);
        });
    });

    test('encode: should handle UUID without hyphens', () => {
        const uuid = 'f47ac10b58cc4372a5670e02b2c3d479';
        const encoded = encode(uuid);
        expect(isValidBase62(encoded)).toBe(true);
    });

    test('encode: should throw error for invalid UUID', () => {
        expect(() => encode('invalid-uuid')).toThrow(/Invalid UUID format/);
        expect(() => encode('')).toThrow(/Invalid UUID format/);
    });

    test('decode: should decode Base62 to UUID', () => {
        const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        const encoded = encode(uuid);
        const decoded = decode(encoded);
        expect(decoded).toBe(uuid);
    });

    test('decode: should throw error for invalid Base62', () => {
        expect(() => decode('invalid@base62!')).toThrow(/Invalid Base62 format/);
        expect(() => decode('')).toThrow(/Invalid Base62 format/);
    });

    test('v4: should generate valid Base62 UUID', () => {
        const uuid = v4();
        expect(typeof uuid).toBe('string');
        expect(isValidBase62(uuid)).toBe(true);
        
        // Should be able to decode back to valid UUID
        const decoded = decode(uuid);
        expect(decoded).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('v4: should generate unique values', () => {
        const uuid1 = v4();
        const uuid2 = v4();
        expect(uuid1).not.toBe(uuid2);
    });

    test('generateBase62: should generate valid Base62 UUID', () => {
        const uuid = generateBase62();
        expect(typeof uuid).toBe('string');
        expect(isValidBase62(uuid)).toBe(true);
        
        // Should be able to decode back to valid UUID
        const decoded = decode(uuid);
        expect(decoded).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('generateBase62: should generate unique values', () => {
        const uuid1 = generateBase62();
        const uuid2 = generateBase62();
        expect(uuid1).not.toBe(uuid2);
    });

    test('generateBase62: should work identically to v4', () => {
        // Both functions should produce valid Base62 UUIDs
        const v4Result = v4();
        const generateResult = generateBase62();
        
        expect(isValidBase62(v4Result)).toBe(true);
        expect(isValidBase62(generateResult)).toBe(true);
        
        // Both should decode to valid UUIDs
        expect(decode(v4Result)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(decode(generateResult)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });



    test('isValidBase62: should validate Base62 formats', () => {
        expect(isValidBase62('5wbwf6yUxVBcr48AMbz9cb')).toBe(true);
        expect(isValidBase62('123ABC')).toBe(true);
        expect(isValidBase62('invalid@base62!')).toBe(false);
        expect(isValidBase62('')).toBe(false);
        expect(isValidBase62('test-with-hyphen')).toBe(false);
    });

    test('round-trip: encode/decode should be consistent', () => {
        const testUuids = [
            'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            '00000000-0000-0000-0000-000000000000',
            'ffffffff-ffff-ffff-ffff-ffffffffffff'
        ];

        testUuids.forEach(uuid => {
            const encoded = encode(uuid);
            const decoded = decode(encoded);
            expect(decoded).toBe(uuid);
        });
    });

    test('round-trip: 1000 random UUIDs survive encode/decode', () => {
        for (let i = 0; i < 1000; i++) {
            const id = v4();
            expect(id).toHaveLength(22);
            expect(encode(decode(id))).toBe(id);
        }
    });
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KNOWN_UUID = '49ceabcf-5e02-4449-be28-a9b341df4b08';
const KNOWN_BASE62 = '2fgT6HSnoa1fpeINbxJIo0';
const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('known vectors', () => {
    test('encode/decode match the documented example', () => {
        expect(encode(KNOWN_UUID)).toBe(KNOWN_BASE62);
        expect(decode(KNOWN_BASE62)).toBe(KNOWN_UUID);
    });

    test('all-zero and all-f UUIDs map to the Base62 bounds', () => {
        expect(encode('00000000-0000-0000-0000-000000000000')).toBe('0'.repeat(22));
        expect(encode(MAX_UUID)).toBe('7N42dgm5tFLK9N8MT7fHC7');
        expect(decode('7N42dgm5tFLK9N8MT7fHC7')).toBe(MAX_UUID);
    });
});

describe('encode input handling', () => {
    test('accepts uppercase and mixed-case UUIDs', () => {
        expect(encode(KNOWN_UUID.toUpperCase())).toBe(KNOWN_BASE62);
        expect(encode('49CEabcf-5E02-4449-bE28-A9B341df4b08')).toBe(KNOWN_BASE62);
    });

    test('hyphenless input encodes the same as hyphenated input', () => {
        expect(encode(KNOWN_UUID.replace(/-/g, ''))).toBe(KNOWN_BASE62);
    });

    test('rejects malformed UUIDs', () => {
        expect(() => encode(KNOWN_UUID.slice(0, -1))).toThrow('Invalid UUID format');
        expect(() => encode(KNOWN_UUID + '0')).toThrow('Invalid UUID format');
        expect(() => encode(KNOWN_UUID.replace('a', 'g'))).toThrow('Invalid UUID format');
    });

    test('rejects non-string input', () => {
        expect(() => encode(123 as unknown as string)).toThrow('Invalid UUID format');
        expect(() => encode(null as unknown as string)).toThrow('Invalid UUID format');
        expect(() => encode(undefined as unknown as string)).toThrow('Invalid UUID format');
    });
});

describe('decode input handling', () => {
    test('always returns lowercase hyphenated UUIDs', () => {
        expect(decode(KNOWN_BASE62)).toMatch(UUID_RE);
    });

    // Current (1.x) behavior: input shorter than 22 chars is treated as left-padded with '0'.
    // A stricter decode is a 2.0.0 candidate (see docs/backlog); update these tests if it lands.
    test('accepts short input as if left-padded with zeros', () => {
        expect(decode('abc')).toBe('00000000-0000-0000-0000-0000000098de');
        expect(decode('0abc')).toBe(decode('abc'));
    });

    test('throws when the value exceeds 128 bits', () => {
        expect(() => decode('Z'.repeat(22))).toThrow('Invalid Base62 value: too large for UUID');
        expect(() => decode('1' + '0'.repeat(22))).toThrow('Invalid Base62 value: too large for UUID');
    });

    test('rejects non-string input', () => {
        expect(() => decode(123 as unknown as string)).toThrow('Invalid Base62 format');
        expect(() => decode(null as unknown as string)).toThrow('Invalid Base62 format');
    });
});

describe('isValidBase62', () => {
    test('returns false for non-string input', () => {
        expect(isValidBase62(123 as unknown as string)).toBe(false);
        expect(isValidBase62(undefined as unknown as string)).toBe(false);
    });

    // Current (1.x) behavior: only the character set is checked, not length or range.
    test('checks characters only, not length or range', () => {
        expect(isValidBase62('a')).toBe(true);
        expect(isValidBase62('Z'.repeat(22))).toBe(true);
    });
});

describe('default export', () => {
    test('exposes the same functions as the named exports', () => {
        expect(uuid62.encode).toBe(encode);
        expect(uuid62.decode).toBe(decode);
        expect(uuid62.v4).toBe(v4);
        expect(uuid62.generateBase62).toBe(generateBase62);
        expect(uuid62.isValidBase62).toBe(isValidBase62);
    });
});

describe('checkNodeEnvironment', () => {
    const g = globalThis as Record<string, unknown>;

    afterEach(() => {
        delete g.window;
        delete g.document;
    });

    test('does not throw in Node', () => {
        expect(() => checkNodeEnvironment()).not.toThrow();
    });

    test.each(['window', 'document'])('throws when a browser global (%s) is present', (name) => {
        g[name] = {};
        expect(() => checkNodeEnvironment()).toThrow('Node.js only');
    });
});