import Link from "next/link";

export default function Home() {
  return (
    <main className="layout stack page-stack">
      

      <section className="stack">
        <div className="section-heading">
          <div className="pill">3-step flow</div>
          <h2>Integration steps</h2>
          <p className="muted">High-level milestones for this example integration.</p>
        </div>
        <div className="grid step-grid">
          <div className="card stack step-card">
            <p className="eyebrow">Step 1</p>
            <h3>Create Customer</h3>
            <p className="muted">Create a Dwolla Customer to own the card funding source.</p>
          </div>
          <div className="card stack step-card">
            <p className="eyebrow">Step 2</p>
            <h3>Add Debit Card</h3>
            <p className="muted">
              Mount Checkout.com Flow, capture the card, and create a Dwolla card funding source.
            </p>
          </div>
          <div className="card stack step-card">
            <p className="eyebrow">Step 3</p>
            <h3>Send Payout</h3>
            <p className="muted">
              Use the settlement account as source and the card funding source as destination.
            </p>
          </div>
        </div>
      </section>

      <div className="cta-row">
          <Link href="/create-customer">
            <button className="button primary" type="button">
              Start
            </button>
          </Link>
        </div>

      <section className="section-plain stack">
        <p className="eyebrow">Prerequisites</p>
        <p className="muted">
          This demo assumes you’ve already added a settlement account in the Dwolla Dashboard and
          pre-funded it using the API or the Dwolla Dashboard.
        </p>
      </section>

      <section >
        <h3>Docs</h3>
        <div className="doc-links">
          <Link className="doc-link" href="https://developers.dwolla.com/docs/adding-a-debit-card" target="_blank">
            Adding a Debit Card
          </Link>
          <Link className="doc-link" href="https://developers.dwolla.com/docs/push-to-card" target="_blank">
            Push to Card Concepts
          </Link>
        </div>
      </section>
    </main>
  );
}

