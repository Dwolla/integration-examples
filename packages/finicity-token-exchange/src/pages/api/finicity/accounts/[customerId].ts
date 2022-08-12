import { NextApiRequest, NextApiResponse } from "next";
import { getCustomerAccounts, GetCustomerAccountsOptions } from "../../../../integrations/finicity";
import { assertRequestMethod, tryWithResponse } from "../../../../utils";

/**
 * GET: Fetches customer accounts via a customer ID
 */
export default async function finicityAccountsApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (!assertRequestMethod("GET", req, res)) return;
    const { customerId } = req.query as unknown as GetCustomerAccountsOptions;

    await tryWithResponse(async () => {
        const accounts = await getCustomerAccounts({ customerId });
        res.status(200).json([...accounts]);
    }, res);
}
