import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";

const LAST_UPDATED = "March 2026";
const OWNER = "BuilderLabs LLC";
const CONTACT = "support@homemade.cooking";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Homemade</title>
        <meta name="description" content="Privacy Policy for Homemade — how we collect, use, and share your information." />
        <link rel="canonical" href={`${window.location.origin}/privacy`} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-muted-foreground">
            This page is maintained by {OWNER} to describe how Homemade handles your
            information. It is not a certification.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Information we collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account:</strong> email, password (hashed by our auth provider), role (customer or chef).</li>
            <li><strong>Chef profile:</strong> display name, business name, pickup address, phone, photos, availability.</li>
            <li><strong>Orders:</strong> items ordered, delivery address, order status and history.</li>
            <li><strong>Payments:</strong> handled by Stripe. We store card brand, last 4 digits, and Stripe identifiers — not full card numbers.</li>
            <li><strong>Location:</strong> if you use "Use my location", we use your device coordinates to find nearby chefs.</li>
            <li><strong>Reviews and ratings</strong> you submit.</li>
            <li><strong>Usage and device data</strong> such as IP address, browser, and log data.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. How we use information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Operate the marketplace — accounts, listings, orders, payouts, and support.</li>
            <li>Process payments and prevent fraud.</li>
            <li>Coordinate delivery with our delivery provider.</li>
            <li>Send transactional messages (order status, receipts, account notices).</li>
            <li>Improve the Service.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. Sharing</h2>
          <p>We share information only as needed to run the Service, including with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Chefs and customers</strong> — order details necessary to fulfill orders.</li>
            <li><strong>Service providers (subprocessors):</strong> Supabase (database, auth, storage), Stripe (payments and payouts), DoorDash Drive (delivery), Twilio (SMS notifications), OpenStreetMap Nominatim (address geocoding).</li>
            <li><strong>Legal:</strong> when required by law or to protect rights and safety.</li>
          </ul>
          <p>We do not sell your personal information.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Agent integrations (MCP)</h2>
          <p>
            If you connect Homemade to a third-party AI assistant using our MCP
            integration, that assistant acts on your behalf using an OAuth token you
            approve. It can only access data your account can already access, subject
            to the same access rules that apply in the app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Retention</h2>
          <p>
            We retain account, order, and payment records for as long as your account
            is active and as needed to meet legal, tax, and accounting obligations.
            You may request deletion of your account by emailing {CONTACT}.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Your choices</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Update your profile from your account settings.</li>
            <li>Turn off browser location to stop "Use my location" from working.</li>
            <li>Request access, correction, or deletion of your data by emailing {CONTACT}.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">7. Security</h2>
          <p>
            We use industry-standard measures including TLS in transit, hashed
            passwords, and row-level access controls in our database. No system is
            perfectly secure — please use a strong, unique password.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">8. Children</h2>
          <p>Homemade is not directed to children under 13, and we do not knowingly collect their information.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">9. Changes</h2>
          <p>We may update this policy from time to time. Material changes will be reflected by the "Last updated" date above.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p>Privacy questions? Email <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
        </section>
      </main>
    </>
  );
}
