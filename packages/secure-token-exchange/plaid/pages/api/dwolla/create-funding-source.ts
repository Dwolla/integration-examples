import type { NextApiRequest, NextApiResponse } from "next";
import type { CreateFundingSourceOptions } from "../../../app/dwolla";
import { createFundingSource } from "../../../app/dwolla";

export default async function createFundingSourceApi(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { customerId, fundingSourceName, plaidToken, _links } = req.body as CreateFundingSourceOptions;

        if (customerId && fundingSourceName && plaidToken && _links) {
            const response = await createFundingSource(req.body);
            return res.status(200).json({ location: response?.headers?.get("Location") });
        }
        return res
            .status(400)
            .json({ error: "customerId, fundingSourceName, and processorToken are all required in the JSON body" });
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
