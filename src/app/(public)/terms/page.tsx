import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions | GK General Supply",
  description: "GK General Supply terms and conditions.",
}

export default function TermsPage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto prose prose-gray dark:prose-invert">
      <h1>Terms & Conditions</h1>
      <p>Last updated: June 2026</p>
      <h2>General</h2>
      <p>
        By placing an order with GK General Supply, you agree to these terms and conditions.
        Please read them carefully before making a purchase.
      </p>
      <h2>Orders & Pricing</h2>
      <p>
        All prices are listed in US Dollars (USD) unless otherwise stated.
        We reserve the right to modify prices at any time. Orders are subject to availability and acceptance.
      </p>
      <h2>Shipping & Delivery</h2>
      <p>
        Delivery times are estimates and may vary based on location and product availability.
        We are not responsible for delays beyond our control.
      </p>
      <h2>Returns & Refunds</h2>
      <p>
        Please refer to our Returns policy for information about returns and refunds.
      </p>
      <h2>Contact</h2>
      <p>
        For questions about these terms, please contact us through our contact page.
      </p>
    </div>
  )
}
