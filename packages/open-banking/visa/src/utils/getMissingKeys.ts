/**
 * Returns an array of `keys` that are missing or have falsy values in the object `T`.
 */
export default function getMissingKeys<T extends object>(obj: T, keys: Array<keyof T>): Array<keyof T> {
    return keys.filter((key) => !(key in obj) || !obj[key]);
}
