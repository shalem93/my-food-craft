import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";

const LAST_UPDATED = "March 2026";
const OWNER = "BuilderLabs LLC";
const CONTACT = "support@homemade.cooking";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Homemade</title>
        <meta name="description" content="Terms of Service for Homemade — the marketplace connecting customers with local home chefs." />
        <link rel="canonical" href={`${window.location.origin}/terms`} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-muted-foreground">
            This page is maintained by {OWNER} ("we", "us") to describe the terms under
            which you may use Homemade (the "Service").
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Acceptance</h2>
          <p>By creating an account or using Homemade you agree to these Terms. If you do not agree, do not use the Service.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. The Service</h2>
          <p>
            Homemade is an online marketplace that connects customers with independent
            home chefs. Chefs list menu items, set prices, and prepare food. Customers
            browse, order, and pay through the Service. Homemade is not the preparer,
            seller, or owner of any food listed by chefs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. Accounts</h2>
          <p>
            You must provide accurate account information and keep your credentials
            secure. You are responsible for activity under your account. You must be at
            least 18 years old to use Homemade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Chefs</h2>
          <p>
            Chefs are independent operators, not employees of {OWNER}. Chefs are
            solely responsible for the quality, safety, labeling, allergen disclosure,
            preparation, and legal compliance (including any required food-handling
            licenses and permits) of the food they list. Chefs authorize Homemade to
            collect payment on their behalf and remit payouts through Stripe Connect,
            less applicable platform and service fees.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Orders, payments, and fees</h2>
          <p>
            Orders are contracts between you and the chef. Homemade facilitates
            payment through Stripe. Homemade may charge a platform commission on food
            subtotals and a per-order service fee, disclosed at checkout. Delivery
            fees, when applicable, are set by our delivery provider (currently
            DoorDash).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Cancellations and refunds</h2>
          <p>
            Refunds are handled case-by-case. Once a chef begins preparing an order it
            may not be cancellable. Contact {CONTACT} for refund requests.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">7. Food safety and allergens</h2>
          <p>
            Food is prepared in private home kitchens that are not inspected by
            Homemade. If you have allergies or medical dietary restrictions, do not
            rely solely on menu descriptions — confirm with the chef before ordering.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">8. Acceptable use</h2>
          <p>
            Do not use the Service to violate any law, infringe others' rights, list
            unsafe or misrepresented food, harass other users, or interfere with the
            operation of the Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">9. Disclaimers</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. To the
            fullest extent permitted by law, {OWNER} disclaims all implied warranties
            including merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">10. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, {OWNER}'s total liability arising
            out of or relating to the Service will not exceed the greater of $100 or
            the fees you paid to Homemade in the 3 months preceding the claim.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">11. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service
            after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">12. Contact</h2>
          <p>Questions? Email us at <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
        </section>
      </main>
    </>
  );
}
