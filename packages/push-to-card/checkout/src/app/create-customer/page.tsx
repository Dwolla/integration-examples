"use client";

import { useState } from "react";
import { createCustomer } from "@/integrations/dwolla";

export default function CreateCustomerPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [status, setStatus] = useState<string | null>(null);


    /**
     * Calls the integration to create a Customer in Dwolla.
     * @param formData The form data containing the customer information.
     * @returns The created customer's ID if successful, otherwise undefined.
     */
      async function createCustomerHandler(formData: FormData): Promise<string | undefined> {
        const response = await createCustomer(formData);
        return response.resourceHref ? response.resourceHref.split("/").pop() : undefined;
    }


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("Creating...");
    
    const dwollaCustomerId = await createCustomerHandler(formData);

    if (!dwollaCustomerId) {
        return setStatus("No Customer ID was returned from createCustomerHandler()");
    }

    // Store customerId in session storage for use in creating an Exchange and a Funding Source
    sessionStorage.setItem("customerId", dwollaCustomerId);

    setStatus("Done");
  }

  return (
    <main className="layout stack page-stack">
      <div className="stack">
        <h1>Create Dwolla Customer</h1>
        <p className="muted">Collect minimal info to create an Unverified Customer.</p>
      </div>

      <form className="card stack form-card" onSubmit={handleSubmit}>
        <label className="stack">
          First name
          <input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </label>
        <label className="stack">
          Last name
          <input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </label>
        <label className="stack">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <button type="submit">Create customer</button>
        {status && <p className="muted">{status}</p>}
      </form>
    </main>
  );
}

