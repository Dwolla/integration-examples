import { NextApiRequest, NextApiResponse } from "next";
import { createUnverifiedCustomer, CreateUnverifiedCustomerOptions } from "../../../integrations/dwolla";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export interface DwollaCustomersResponseBody {
    location: string;
}

/**
 * POST: Creates a Dwolla Unverified Customer Record
 */
export default async function dwollaCustomersApi(req: NextApiRequest, res: NextApiResponse) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = req.body as CreateUnverifiedCustomerOptions;
    if (!assertValidBody(body, ["firstName", "lastName", "email"], res)) return;

    await tryNextResponse(async () => {
        const location = await createUnverifiedCustomer({ ...body });
        res.status(201).json({ location } as DwollaCustomersResponseBody);
    }, res);
}
