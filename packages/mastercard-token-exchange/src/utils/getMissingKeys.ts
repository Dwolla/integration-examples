/**
 * Gets if all the `keys` are defined within an object `T`. Returns all the key(s) that are not present.
 */
export default function getMissingKeys<T>(obj: T, keys: (keyof T)[]): (keyof T)[] {
    return keys.filter((key) => !(key in obj) || !obj[key]);
}
