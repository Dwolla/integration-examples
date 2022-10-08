import { UserResponse } from "mx-platform-node";
import { NextApiRequest, NextApiResponse } from "next";
import { createUser, CreateUserOptions } from "../../../integrations/mx";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export interface MXUsersAPIResponse {
    readonly user?: UserResponse;
}

export type MXUsersAPIBody = Partial<CreateUserOptions>;

/**
 * POST: Creates an MX User.
 */
export default async function mxUsersApi(
    req: Omit<NextApiRequest, "body"> & { body: MXUsersAPIBody },
    res: NextApiResponse<MXUsersAPIResponse>
) {
    if (!assertRequestMethod("POST", req, res)) return;
    const body = assertValidBody(req.body, ["email"], res);
    if (!body) return;

    await tryNextResponse(async () => {
        const user = await createUser(body);
        res.status(201).json({ user });
    }, res);
}
