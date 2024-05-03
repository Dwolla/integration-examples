import type { NextApiRequest, NextApiResponse } from "next";

export type RequestMethod = "GET" | "POST";

/**
 * Asserts that the specified request method was used when the API was called, otherwise inform the caller and end the session.
 */
export default function assertRequestMethod<ReqType extends NextApiRequest, ResType extends NextApiResponse>(
    method: RequestMethod,
    req: ReqType,
    res: ResType
): boolean {
    if (req.method === method) return true;
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return false;
}
