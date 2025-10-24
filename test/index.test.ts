import { encode, decode, v4, isValidUuid, isValidBase62 } from '../src/index';

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
        expect(isValidUuid(decoded)).toBe(true);
    });

    test('v4: should generate unique values', () => {
        const uuid1 = v4();
        const uuid2 = v4();
        expect(uuid1).not.toBe(uuid2);
    });

    test('isValidUuid: should validate UUID formats', () => {
        expect(isValidUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
        expect(isValidUuid('f47ac10b58cc4372a5670e02b2c3d479')).toBe(true);
        expect(isValidUuid('invalid-uuid')).toBe(false);
        expect(isValidUuid('')).toBe(false);
        expect(isValidUuid('f47ac10b-58cc-4372-a567')).toBe(false);
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

    test('performance: should handle 1000 operations quickly', () => {
        const start = Date.now();
        
        for (let i = 0; i < 1000; i++) {
            const uuid = v4();
            const decoded = decode(uuid);
            const reencoded = encode(decoded);
            expect(uuid).toBe(reencoded);
        }
        
        const duration = Date.now() - start;
        console.log(`1000 round-trip operations took ${duration}ms`);
        expect(duration).toBeLessThan(1000);
    });
});