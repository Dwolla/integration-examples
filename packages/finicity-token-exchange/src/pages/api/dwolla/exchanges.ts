import { NextApiRequest, NextApiResponse } from "next";
import { assertRequestMethod, assertValidBody, tryWithResponse } from "../../../utils";
import { createExchange, CreateExchangeOptions } from "../../../integrations/dwolla";

/**
 * POST: Creates an exchange resource for a customer
 */
export default async function dwollaExchangesApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = req.body as CreateExchangeOptions;
    if (!assertValidBody(body, ["customerId", "exchangePartnerId", "finicityReceipt"], res)) return;

    await tryWithResponse(async () => {
        const location = await createExchange({ ...body });
        res.status(200).json({ location });
    }, res);
}
