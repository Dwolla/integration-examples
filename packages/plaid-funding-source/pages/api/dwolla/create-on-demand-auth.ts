import { NextApiRequest, NextApiResponse } from "next";
import { createOnDemandAuthorization } from "../../../app/dwolla";

export default async function createOnDemandAuthApi(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const response = await createOnDemandAuthorization();
        return res.status(200).json({ body: response?.body });
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
