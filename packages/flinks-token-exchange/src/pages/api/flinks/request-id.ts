import type { NextApiRequest, NextApiResponse } from "next";
import type { GenerateRequestIdOptions, GenerateRequestIdResponse } from "../../../integrations/flinks";
import { generateRequestId } from "../../../integrations/flinks";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export type FlinksGenerateRequestIdAPIBody = Partial<GenerateRequestIdOptions>;
export type FlinksGenerateRequestIdAPIResponse = Partial<GenerateRequestIdResponse>;

export default async function flinksRequestIdApi(
    req: Omit<NextApiRequest, "body"> & { body: FlinksGenerateRequestIdAPIBody },
    res: NextApiResponse<GenerateRequestIdResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["loginId"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const requestId = await generateRequestId(body);
        res.status(200).json(requestId);
    }, res);
}
