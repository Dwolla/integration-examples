/**
 * Compare two strings for equality, ignore case sensitivity, except for accent characters
 */
export default function equalsIgnoreCase(a: string | undefined, b: string | undefined): boolean {
    if (!a || !b) return false;
    return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}
