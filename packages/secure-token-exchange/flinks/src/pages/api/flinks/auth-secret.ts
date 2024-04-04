import type { NextApiRequest, NextApiResponse } from "next";
import type { RequestAuthSecretOptions, RequestAuthSecretResponse } from "../../../integrations/flinks";
import { requestAuthSecret } from "../../../integrations/flinks";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export type FlinksAuthSecretAPIBody = Partial<RequestAuthSecretOptions>;
export type FlinksAuthSecretAPIResponse = Partial<RequestAuthSecretResponse>;

export default async function flinksAuthSecretApi(
    req: Omit<NextApiRequest, "body"> & { body: FlinksAuthSecretAPIBody },
    res: NextApiResponse<RequestAuthSecretResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["nameOfPartner"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const authSecret = await requestAuthSecret(body);
        res.status(200).json(authSecret);
    }, res);
}
