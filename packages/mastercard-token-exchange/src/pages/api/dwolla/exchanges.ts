import type { NextApiRequest, NextApiResponse } from "next";
import type { CreateExchangeOptions } from "../../../integrations/dwolla";
import { createExchange } from "../../../integrations/dwolla";
import { assertRequestMethod, assertValidBody, tryWithResponse } from "../../../utils";

/**
 * POST: Creates an exchange resource for a customer
 */
export default async function dwollaExchangesApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = req.body as CreateExchangeOptions;
    if (!assertValidBody(body, ["customerId", "exchangePartnerHref", "mastercardReceipt"], res)) return;

    await tryWithResponse(async () => {
        const location = await createExchange({ ...body });
        res.status(200).json({ location });
    }, res);
}
