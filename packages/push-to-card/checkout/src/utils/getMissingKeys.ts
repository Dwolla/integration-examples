/**
 * Gets if all the `keys` are defined within an object `T`. Returns all the key(s) that are not present.
 */
export default function getMissingKeys<T extends object>(obj: T, keys: Array<keyof T>): Array<keyof T> {
    return keys.filter((key) => !(key in obj) || !obj[key]);
}
