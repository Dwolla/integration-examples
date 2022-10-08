import { NextApiRequest, NextApiResponse } from "next";
import { createFundingSource, CreateFundingSourceOptions } from "../../../integrations/dwolla";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export interface DwollaFundingSourcesAPIResponse {
    readonly resourceHref: string;
}

export type DwollaFundingSourceAPIBody = Partial<CreateFundingSourceOptions>;

/**
 * POST: Creates a Funding Source for a Customer, using Dwolla's Secure Exchange
 */
export default async function dwollaFundingSourcesApi(
    req: Omit<NextApiRequest, "body"> & { body: DwollaFundingSourceAPIBody },
    res: NextApiResponse<DwollaFundingSourcesAPIResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["customerId", "exchangeUrl", "name", "type"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const resourceHref = await createFundingSource(body);
        res.status(201).json({ resourceHref });
    }, res);
}
