import type { NextApiResponse } from "next";
import { getMissingKeys } from "./index";

type AssertedKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * Asserts that all the `keys` are defined in object `T` and, if not, inform the caller and end the session.
 */
export default function assertValidBody<T extends object, K extends keyof T>(
    obj: T,
    keys: Array<K>,
    res: NextApiResponse
): AssertedKeys<T, K> | undefined {
    const missingKeys = getMissingKeys(obj, keys);

    if (missingKeys.length > 0) {
        res.status(400).json({ error: `The following JSON properties are missing: ${missingKeys}` });
        return undefined;
    }
    return obj as unknown as AssertedKeys<T, K>;
}
