"use client";

import { useState } from "react";
import { sendPushToCard } from "@/integrations/dwolla";

export default function SendPayoutPage() {
  const [form, setForm] = useState({ settlementSource: "", cardDestination: "", amount: "25.00" });
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Creating transfer...");
    const transfer = await sendPushToCard(form);
    setStatus(transfer ?? "Transfer created");
  }

  return (
    <main className="layout stack">
      <h1>Send Push to Card payout</h1>
      <form className="card stack" onSubmit={handleSubmit}>
        <label className="stack">
          Settlement account funding source URL
          <input
            required
            value={form.settlementSource}
            onChange={(e) => setForm({ ...form, settlementSource: e.target.value })}
            placeholder="https://api-sandbox.dwolla.com/funding-sources/{settlement-id}"
          />
        </label>
        <label className="stack">
          Card funding source URL
          <input
            required
            value={form.cardDestination}
            onChange={(e) => setForm({ ...form, cardDestination: e.target.value })}
            placeholder="https://api-sandbox.dwolla.com/funding-sources/{card-id}"
          />
        </label>
        <label className="stack">
          Amount (USD)
          <input
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            type="number"
            min="0"
            step="0.01"
          />
        </label>
        <button type="submit">Send payout</button>
        {status && <p>{status}</p>}
      </form>
    </main>
  );
}

