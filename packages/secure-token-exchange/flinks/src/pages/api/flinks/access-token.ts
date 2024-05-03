import type { NextApiRequest, NextApiResponse } from "next";
import type { RequestAccessTokenOptions, RequestAccessTokenResponse } from "../../../integrations/flinks";
import { requestAccessToken } from "../../../integrations/flinks";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export type FlinksAccessTokenAPIBody = Partial<RequestAccessTokenOptions>;
export type FlinksAccessTokenAPIResponse = Partial<RequestAccessTokenResponse>;

export default async function flinksAccessTokenApi(
    req: Omit<NextApiRequest, "body"> & { body: FlinksAccessTokenAPIBody },
    res: NextApiResponse<RequestAccessTokenResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["loginId", "accountId"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const accessToken = await requestAccessToken(body);
        res.status(200).json(accessToken);
    }, res);
}
