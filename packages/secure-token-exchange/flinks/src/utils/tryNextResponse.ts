import type { NextApiResponse } from "next";

/**
 * Wraps a closure in a `try`/`catch`, and if the function panics, print the stacktrace, inform the user, and end the session.
 */
export default async function tryNextResponse<R>(fn: () => R | Promise<R>, res: NextApiResponse) {
    try {
        await fn();
    } catch (err) {
        console.trace(err);
        res.status(500).json({ error: "Internal Server Error: Check console for more information." });
    }
}
