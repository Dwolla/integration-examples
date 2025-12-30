"use server";
import { Dwolla } from "dwolla";
import { getEnvironmentVariable } from "./index";
import { equalsIgnoreCase, getBaseUrl } from "../utils";

export interface CreateCustomerOptions {
    firstName: string;
    lastName: string;
    email: string;
}
export interface CreateExchangeOptions {
    customerId: string;
    exchangePartnerHref: string;
    plaidPublicToken: string;
}
export interface CreateFundingSourceOptions {
    customerId: string;
    exchangeId: string;
    name: string;
    type: "checking" | "savings";
}
export interface NextAPIResponse {
    success: boolean;
    message?: string;
    resource?: string;
}

/**
 * Initializes the Dwolla client with the provided environment and API credentials.
 * @see https://github.com/Dwolla/dwolla-v2-node?tab=readme-ov-file#initialization
 */
const dwolla = new Dwolla({
  server: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "prod" | "sandbox",
  security: {
    clientID: getEnvironmentVariable("DWOLLA_KEY") ?? "",
    clientSecret: getEnvironmentVariable("DWOLLA_SECRET") ?? "",
  }
});

/**
 * Creates a Customer resource.
 * @param formData - FormData containing firstName, lastName, and email fields.
 * @returns NextAPIResponse containing success status, optional message, and resource if successful.
 */
export async function createCustomer(formData: FormData): Promise<NextAPIResponse> {

    try {
        const response = await dwolla.customers.create({ 
            type: "unverified", 
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            email: formData.get("email") as string  
        });
        const location = response?.headers?.location;
        if (location) {
            console.log("Customer created successfully. Location:", location);
            return {
                success: true,
                message: "Customer created successfully",
                resource: location?.[0] ?? undefined
            };
        }
        return {
            success: false,
            message: "An error occurred while processing the response"
        };
    } catch (error) {
        console.error("Error creating Dwolla Customer:", error);
        return {
            success: false,
            message: "An error occurred while creating the customer. Please try again later."
        };
    }
}

// TODO: Implement further API calls as necessary 
/**
 * Creates an exchange for a Customer
 * @param options - The options of type CreateExchangeOptions for creating the exchange.
 * @returns NextAPIResponse containing success status, optional message, and resource if successful.
 */
// export async function createExchange(customerId: string, plaidPublicToken: string): Promise<NextAPIResponse> {
//     const exchangePartnerHref = await getExchangePartnerHref();
//     const requestBody = {
//         _links: {
//             "exchange-partner": {
//                 href: exchangePartnerHref
//             }
//         },
//         plaid: {
//             publicToken: plaidPublicToken
//         }
//     };

//     try {
//         const response = await dwolla.post(`customers/${customerId}/exchanges`, requestBody);
//         const location = response.headers.get("location");
//         if (location) {
//             console.log("Exchange created successfully. Location:", location);
//             return {
//                 success: true,
//                 message: "Exchange  created successfully",
//                 resource: location
//             };
//         }
//         return {
//             success: false
//         };
//     } catch (error) {
//         console.error("Error creating Dwolla Exchange:", error);
//         return {
//             success: false,
//             message: "An error occurred while creating the exchange"
//         };
//     }
// }

/**
 * Creates a funding source for a Customer
 * @param options - The options of type CreateFundingSourceOptions for creating the funding source.
 * @returns NextAPIResponse containing success status, optional message, and resource if successful.
 */
// export async function createFundingSource(options: CreateFundingSourceOptions): Promise<NextAPIResponse> {
//     const { customerId, exchangeId, name, type } = options;
//     const exchangeUrl = `${getBaseUrl()}/exchanges/${exchangeId}`;

//     const requestBody = {
//         _links: {
//             exchange: {
//                 href: exchangeUrl
//             }
//         },
//         bankAccountType: type,
//         name: name
//     };

//     try {
//         const response = await dwolla.post(`customers/${customerId}/funding-sources`, requestBody);
//         const location = response.headers.get("location");
//         if (location) {
//             console.log("Funding source created successfully. Location:", location);
//             return {
//                 success: true,
//                 message: "Funding source created successfully",
//                 resource: location
//             };
//         }
//         return {
//             success: false,
//             message: "An error occurred while processing the response"
//         };
//     } catch (error) {
//         console.error("Error creating Dwolla Funding Source:", error);
//         return {
//             success: false,
//             message: "An error occurred while creating the funding source. Please try again later."
//         };
//     }
// }
