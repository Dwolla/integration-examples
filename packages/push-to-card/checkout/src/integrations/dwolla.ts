 "use server";
 import { Client } from "dwolla-v2";
 import { getEnvironmentVariable } from "./index";
 
 export interface CreateCustomerOptions {
   firstName: string;
   lastName: string;
   email: string;
 }
 
 export interface NextAPIResponse {
   success: boolean;
   message?: string;
   resourceHref?: string;
 }
 
 const dwolla = new Client({
   environment: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "production" | "sandbox",
   key: getEnvironmentVariable("DWOLLA_KEY"),
   secret: getEnvironmentVariable("DWOLLA_SECRET")
 });
 
 /**
  * Creates a Dwolla Customer using server-side credentials.
  * Accepts a FormData payload from a client form action.
  */
 export async function createCustomer(formData: FormData): Promise<NextAPIResponse> {
   const requestBody: CreateCustomerOptions = {
     firstName: formData.get("firstName") as string,
     lastName: formData.get("lastName") as string,
     email: formData.get("email") as string
   };
 
   try {
     const response = await dwolla.post("customers", { ...requestBody });
     const location = response.headers.get("location");
 
     if (location) {
       console.log("Customer created successfully. Location:", location);
       return {
         success: true,
         message: "Customer created successfully",
         resourceHref: location
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
