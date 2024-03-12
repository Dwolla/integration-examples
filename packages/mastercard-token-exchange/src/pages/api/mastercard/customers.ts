import type { NextApiRequest, NextApiResponse } from "next";
import type { CreateCustomerOptions } from "../../../integrations/mastercard";
import { createTestingCustomer } from "../../../integrations/mastercard";
import { assertRequestMethod, assertValidBody, tryWithResponse } from "../../../utils";

/**
 * POST: Creates a customer record
 */
export default async function mastercardCustomersApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = req.body as CreateCustomerOptions;
    if (!assertValidBody(body, ["username"], res)) return;

    await tryWithResponse(async () => {
        const customerId = await createTestingCustomer({ ...body });
        res.status(201).json({ id: customerId });
    }, res);
}
