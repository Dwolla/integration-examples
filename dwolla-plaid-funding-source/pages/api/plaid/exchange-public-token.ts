import { NextApiRequest, NextApiResponse } from "next";
import { exchangePublicToken } from "../../../app/plaid";

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
