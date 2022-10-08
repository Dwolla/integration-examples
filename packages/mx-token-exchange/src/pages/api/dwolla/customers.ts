import type { NextApiRequest, NextApiResponse } from "next";
import type { CreateUnverifiedCustomerOptions } from "../../../integrations/dwolla";
import { createUnverifiedCustomer } from "../../../integrations/dwolla";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export interface DwollaCustomersAPIResponse {
    readonly resourceHref: string;
}

export type DwollaCustomersAPIBody = Partial<CreateUnverifiedCustomerOptions>;

/**
 * POST: Creates a Dwolla Unverified Customer Record
 */
export default async function dwollaCustomersApi(
    req: Omit<NextApiRequest, "body"> & { body: DwollaCustomersAPIBody },
    res: NextApiResponse<DwollaCustomersAPIResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["firstName", "lastName", "email"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const resourceHref = await createUnverifiedCustomer(body);
        res.status(201).json({ resourceHref });
    }, res);
}
