import type { NextApiRequest, NextApiResponse } from "next";
import type { CreateExchangeOptions } from "../../../integrations/dwolla";
import { createExchange } from "../../../integrations/dwolla";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export interface DwollaExchangesAPIResponse {
    readonly resourceHref: string;
}

export type DwollaExchangesAPIBody = Partial<CreateExchangeOptions>;

/**
 * POST: Creates a Dwolla Exchange for a Customer
 */
export default async function dwollaExchangesApi(
    req: Omit<NextApiRequest, "body"> & { body: DwollaExchangesAPIBody },
    res: NextApiResponse<DwollaExchangesAPIResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["customerId", "exchangePartnerHref", "authSecret", "accessToken"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const resourceHref = await createExchange(body);
        res.status(201).json({ resourceHref });
    }, res);
}
