import type { NextApiRequest, NextApiResponse } from "next";
import type { CreateUnverifiedCustomerOptions } from "../../../integrations/dwolla";
import { createUnverifiedCustomer } from "../../../integrations/dwolla";
import { assertRequestMethod, assertValidBody, tryWithResponse } from "../../../utils";

/**
 * POST: Creates an unverified customer record
 */
export default async function dwollaCustomersApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = req.body as CreateUnverifiedCustomerOptions;
    if (!assertValidBody(body, ["firstName", "lastName", "email"], res)) return;

    await tryWithResponse(async () => {
        const location = await createUnverifiedCustomer({ ...body });
        res.status(200).json({ location });
    }, res);
}
