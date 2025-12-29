"use client";

import { useEffect, useState } from "react";
import { createPaymentSession, exchangePaymentForCardToken, createCardFundingSource } from "@/integrations/checkout";
import { ensureDwollaCustomerId } from "@/integrations/dwolla";

declare global {
  interface Window {
    CheckoutWebComponents?: any;
  }
}

export default function AddCardPage() {
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [cardFundingSource, setCardFundingSource] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setStatus("Creating payment session...");
      const session = await createPaymentSession();
      setPaymentSession(session);
      setStatus("Session ready. Loading Flow...");
      await loadFlow(session);
    })();
  }, []);

  async function loadFlow(session: any) {
    if (!window.CheckoutWebComponents) {
      await loadScript("https://checkout-web-components.checkout.com/index.js");
    }

    const checkout = await window.CheckoutWebComponents({
      publicKey: process.env.NEXT_PUBLIC_CKO_PUBLIC_KEY!,
      environment: process.env.NEXT_PUBLIC_CKO_ENV || "sandbox",
      paymentSession: session,
      onPaymentCompleted: async (_component: any, paymentResponse: any) => {
        setStatus("Fetching card token from Checkout.com...");
        const cardToken = await exchangePaymentForCardToken(paymentResponse.id);

        setStatus("Creating Dwolla card funding source...");
        const customerId = await ensureDwollaCustomerId();
        const fundingSourceLocation = await createCardFundingSource(customerId, cardToken, {
          address1: "123 Main St",
          city: "Dallas",
          stateProvinceRegion: "TX",
          country: "US",
          postalCode: "76034"
        });
        setCardFundingSource(fundingSourceLocation ?? null);
        setStatus("Card funding source created");
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
          Checkout.com Flow mounts below. After card capture, the app retrieves the card token
          server-side and creates a Dwolla card funding source.
        </p>
        <div id="card-capture-container" />
        {status && <p>Status: {status}</p>}
        {cardFundingSource && (
          <p>
            Funding source created: <span className="code">{cardFundingSource}</span>
          </p>
        )}
      </div>
    </main>
  );
}

