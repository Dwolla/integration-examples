import type { NextApiRequest, NextApiResponse } from "next";
import type { RequestAuthorizationCodeOptions, RequestAuthorizationCodeResponse } from "../../../integrations/mx";
import { requestAuthorizationCode } from "../../../integrations/mx";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export interface MXProcessorTokenAPIResponse {
    readonly token?: RequestAuthorizationCodeResponse;
}

export type MXProcessorTokenAPIBody = Partial<RequestAuthorizationCodeOptions>;

/**
 * POST: Generates a payment processor token using an account, member, and user GUID.
 */
export default async function mxProcessorTokenApi(
    req: Omit<NextApiRequest, "body"> & { body: MXProcessorTokenAPIBody },
    res: NextApiResponse<MXProcessorTokenAPIResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["accountGuid", "memberGuid", "userGuid"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const token = await requestAuthorizationCode(body);
        res.status(200).json({ token });
    }, res);
}
