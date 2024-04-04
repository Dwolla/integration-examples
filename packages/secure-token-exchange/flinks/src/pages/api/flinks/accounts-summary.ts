import type { NextApiRequest, NextApiResponse } from "next";
import type { GetAccountsSummaryOptions, GetAccountsSummaryResponse } from "../../../integrations/flinks";
import { getAccountsSummary } from "../../../integrations/flinks";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export type FlinksGetAccountsSummaryAPIBody = Partial<GetAccountsSummaryOptions>;
export type FlinksGetAccountsSummaryAPIResponse = Partial<GetAccountsSummaryResponse>;

export default async function flinksAccountsSummaryApi(
    req: Omit<NextApiRequest, "body"> & { body: FlinksGetAccountsSummaryAPIBody },
    res: NextApiResponse<GetAccountsSummaryResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["requestId"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const accounts = await getAccountsSummary(body);
        res.status(200).json(accounts);
    }, res);
}
