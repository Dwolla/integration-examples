import { NextApiResponse } from "next";
import { getMissingKeys } from "./index";

/**
 * Asserts that all the `keys` are defined in object `T` and, if not, inform the caller and end the session.
 */
export default function assertValidBody<T>(obj: T, keys: Array<keyof T>, res: NextApiResponse): boolean {
    const missing = getMissingKeys(obj, keys);

    if (missing.length > 0) {
        res.status(400).json({ error: `The following JSON properties are missing: ${missing}` });
        return false;
    }
    return true;
}
