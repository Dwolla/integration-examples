import type { NextApiRequest, NextApiResponse } from "next";
<<<<<<<< HEAD:packages/secure-token-exchange/plaid/pages/api/plaid/exchange-public-token.ts
import { exchangePublicToken } from "../../../app/plaid";
========
import { exchangePublicToken } from "../../../integrations/plaid";
>>>>>>>> 3519ac51a280200c1c39edbb57f29ba438092074:packages/secure-token-exchange/plaid/src/pages/api/plaid/exchange-public-token.ts

interface RequestBody {
    accountId?: string;
    publicToken?: string;
}

export default async function exchangePublicTokenApi(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { accountId, publicToken } = req.body as RequestBody;

        if (accountId && publicToken) {
            const processorToken = await exchangePublicToken(accountId, publicToken);
            return res.status(200).json({ processorToken });
        }
        return res.status(400).json({ error: "Both accountId and publicToken are required in the JSON body" });
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
