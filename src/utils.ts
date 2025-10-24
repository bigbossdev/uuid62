/**
 * Base62 character set
 */
export const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * UUID validation regex (with or without hyphens)
 */
const UUID_REGEX = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/**
 * Base62 validation regex
 */
const BASE62_REGEX = /^[0-9A-Za-z]+$/;

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUuid(str: string): boolean {
    if (typeof str !== 'string') return false;
    return UUID_REGEX.test(str);
}

/**
 * Validates if a string is a valid Base62 format
 */
export function isValidBase62(str: string): boolean {
    if (typeof str !== 'string') return false;
    return BASE62_REGEX.test(str) && str.length > 0;
}

/**
 * Normalizes UUID by removing hyphens
 */
export function normalizeUuid(uuid: string): string {
    return uuid.replace(/-/g, '');
}

/**
 * Formats UUID by adding hyphens
 */
export function formatUuid(uuid: string): string {
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, 32)}`;
}

/**
 * Checks if running in browser environment
 */
export function checkNodeEnvironment(): void {
    if (typeof (globalThis as any).window !== 'undefined' || typeof (globalThis as any).document !== 'undefined') {
        throw new Error('@bboss/uuid62 is Node.js only and cannot run in browser environments');
    }
}