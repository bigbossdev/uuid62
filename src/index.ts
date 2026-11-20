import { randomUUID } from 'crypto';
import { 
    BASE62_CHARS, 
    isValidUuid, 
    isValidBase62, 
    normalizeUuid, 
    formatUuid, 
    checkNodeEnvironment 
} from './utils';

// Check environment on module load
checkNodeEnvironment();

/**
 * Encodes a UUID to Base62 string
 */
export function encode(uuid: string): string {
    if (!isValidUuid(uuid)) {
        throw new Error('Invalid UUID format');
    }

    const normalized = normalizeUuid(uuid);
    let num = BigInt('0x' + normalized);
    let result = '';

    while (num > 0n) {
        result = BASE62_CHARS[Number(num % 62n)] + result;
        num = num / 62n;
    }
    
    return result.padStart(22, '0');
}

/**
 * Decodes a Base62 string to UUID
 */
export function decode(base62: string): string {
    if (!isValidBase62(base62)) {
        throw new Error('Invalid Base62 format');
    }
    
    let num = 0n;
    
    // isValidBase62 guarantees every character is in BASE62_CHARS
    for (const char of base62) {
        num = num * 62n + BigInt(BASE62_CHARS.indexOf(char));
    }

    const hex = num.toString(16).padStart(32, '0');
    
    if (hex.length > 32) {
        throw new Error('Invalid Base62 value: too large for UUID');
    }
    
    return formatUuid(hex);
}

/**
 * Generates a new UUID v4 and encodes it to Base62
 */
export function v4(): string {
    const uuid = randomUUID();
    return encode(uuid);
}

/**
 * Generates a new UUID v4 and encodes it to Base62 (alias for v4)
 */
export function generateBase62(): string {
    return v4();
}

// Export utility functions
export { isValidBase62 };

// Default export for CommonJS compatibility
export default {
    encode,
    decode,
    v4,
    generateBase62,
    isValidBase62
};