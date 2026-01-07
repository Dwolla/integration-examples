"use client";

import { useEffect, useState } from "react";
import { createPaymentSession, exchangePaymentForCardToken } from "@/integrations/checkout";
import { createCardFundingSource, sendPayout } from "@/integrations/dwolla";

declare global {
  interface Window {
    CheckoutWebComponents?: any;
  }
}

export default function AddCardPage() {
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [cardFundingSource, setCardFundingSource] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<any>(null);

  /**
   * The Dwolla Customer ID that we will use when creating the Exchange and Funding source for.
   */
  const storedCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("customerId") : null;


  useEffect(() => {
    (async () => {
      setStatus("Creating payment session...");
      const session = await createPaymentSession(); 
      setPaymentSession(session);
      setStatus("Session ready.");    
      await loadFlow(session);
    })();
  }, []);

  async function loadFlow(session: any) {
    if (!window.CheckoutWebComponents) {
      await loadScript("https://checkout-web-components.checkout.com/index.js");
    }

    const checkout = await window.CheckoutWebComponents({
      // Use Next.js public env vars; these are inlined at build time.
      publicKey: process.env.NEXT_PUBLIC_CKO_PUBLIC_KEY || "",
      environment: process.env.NEXT_PUBLIC_CKO_ENV || "sandbox",
      paymentSession: session,
      onPaymentCompleted: async (_component: any, paymentResponse: any) => {
        setStatus("Fetching card token from Checkout.com...");
        const cardToken = await exchangePaymentForCardToken(paymentResponse.id);

        setStatus("Creating Dwolla card funding source...");
        const fundingSourceLocation = await createCardFundingSource(storedCustomerId ?? "3eb15702-542d-4467-a8b9-4b71c27be281", cardToken, {
          address1: "123 Main St",
          city: "Dallas",
          stateProvinceRegion: "TX",
          country: "US",
          postalCode: "76034"
        });
        setCardFundingSource(fundingSourceLocation.resource ?? null);
        setStatus("Card funding source created");

        setStatus("Sending payout...");
        const transferResponse = await sendPayout(fundingSourceLocation.resource ?? "", new FormData());
      
        if (!transferResponse.success) {
          setStatus("An error occurred while sending the payout");
          return;
        }
        setTransfer(transferResponse.resource ?? null);
        setStatus("Transfer created successfully");
      },
      onError: (_component: any, error: unknown) => {
        console.error("Flow error", error);
        setStatus("Flow error");
      }
    });

    const flowComponent = checkout.create("flow");
    flowComponent.mount(document.getElementById("card-capture-container"));
  }

  function loadScript(src: string) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.async = true;
      tag.onload = resolve;
      tag.onerror = reject;
      document.body.appendChild(tag);
    });
  }

  return (
    <main className="layout stack">
      <h1>Add debit card</h1>
      <div className="card stack">
        <p>
          Checkout.com Flow mounts below. After card capture, the app 
          <ol>
            <li>Retrieves the card token</li>
            <li>Creates a Dwolla card funding source using the card token</li>
            <li>Sends a payout to the card funding source from the settlement account</li>
          </ol>
          
        </p>
        <div id="card-capture-container" />
        {status && <p>Status: {status}</p>}
        {cardFundingSource && (
          <p>
            Funding source created: <span className="code">{cardFundingSource}</span>
          </p>
        )}
        {transfer && (
          <p>
            Transfer created: <span className="code">{transfer}</span>
          </p>
        )}
      </div>
    </main>
  );
}

