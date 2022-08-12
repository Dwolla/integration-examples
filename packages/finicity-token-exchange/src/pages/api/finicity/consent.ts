import { NextApiRequest, NextApiResponse } from "next";
import { fetchPartnerConsent, FetchPartnerConsentOptions } from "../../../integrations/finicity";
import { assertRequestMethod, assertValidBody, tryWithResponse } from "../../../utils";

/**
 * POST: Fetches partner consent given a (FI) account and customer ID
 */
export default async function finicityConsentApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = req.body as FetchPartnerConsentOptions;
    if (!assertValidBody(body, ["accountId", "customerId"], res)) return;

    await tryWithResponse(async () => {
        const receipt = await fetchPartnerConsent(body);
        res.status(200).json({ ...receipt });
    }, res);
}
