import { NextApiRequest, NextApiResponse } from "next";
import { assertRequestMethod, assertValidBody, tryWithResponse } from "../../../utils";
import { createFundingSource, CreateFundingSourceOptions } from "../../../integrations/dwolla";

/**
 * POST: Create a funding source for a customer using an exchange
 */
export default async function dwollaFundingSourcesApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = req.body as CreateFundingSourceOptions;
    if (!assertValidBody(body, ["customerId", "exchangeUrl", "name", "type"], res)) return;

    await tryWithResponse(async () => {
        const location = await createFundingSource({ ...body });
        res.status(200).json({ location });
    }, res);
}
