import type { AccountNumberResponse } from "mx-platform-node";
import type { NextApiRequest, NextApiResponse } from "next";
import type { ListVerifiedAccountsOptions } from "../../../integrations/mx";
import { listVerifiedAccounts } from "../../../integrations/mx";
import { assertRequestMethod, assertValidBody, tryNextResponse } from "../../../utils";

export interface MXAccountsAPIResponse {
    readonly accounts?: AccountNumberResponse[];
}

export type MXAccountsAPIQuery = Partial<ListVerifiedAccountsOptions>;

/**
 * GET: Fetches an array of verified accounts assigned to a member/user by GUID.
 */
export default async function mxAccountsApi(
    req: Omit<NextApiRequest, "query"> & { query: MXAccountsAPIQuery },
    res: NextApiResponse<MXAccountsAPIResponse>
) {
    if (!assertRequestMethod("GET", req, res)) return;
    const query = assertValidBody(req.query, ["memberGuid", "userGuid"], res);
    if (!query) return;

    await tryNextResponse(async () => {
        const accounts = await listVerifiedAccounts(query);
        res.status(200).json({ accounts });
    }, res);
}
