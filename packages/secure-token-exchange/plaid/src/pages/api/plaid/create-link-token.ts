import type { NextApiRequest, NextApiResponse } from "next";
<<<<<<<< HEAD:packages/secure-token-exchange/plaid/pages/api/plaid/create-link-token.ts
import { createLinkToken } from "../../../app/plaid";
========
import { createLinkToken } from "../../../integrations/plaid";
>>>>>>>> 3519ac51a280200c1c39edbb57f29ba438092074:packages/secure-token-exchange/plaid/src/pages/api/plaid/create-link-token.ts

export default async function createLinkTokenApi(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const linkToken = await createLinkToken();
        res.status(200).json(linkToken);
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
