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
    const hex = BigInt('0x' + normalized);
    
    if (hex === 0n) return '0'.padStart(22, '0');
    
    let result = '';
    let num = hex;
    
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
    
    for (let i = 0; i < base62.length; i++) {
        const char = base62[i];
        const index = BASE62_CHARS.indexOf(char);
        if (index === -1) {
            throw new Error('Invalid Base62 character');
        }
        num = num * 62n + BigInt(index);
    }
    
    let hex = num.toString(16).padStart(32, '0');
    
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