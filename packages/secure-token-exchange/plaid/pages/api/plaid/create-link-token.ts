import type { NextApiRequest, NextApiResponse } from "next";
import { createLinkToken } from "../../../app/plaid";

export default async function createLinkTokenApi(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const linkToken = await createLinkToken();
        res.status(200).json(linkToken);
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
