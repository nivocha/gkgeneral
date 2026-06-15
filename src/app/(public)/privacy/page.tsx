import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | GK General Supply",
  description: "GK General Supply privacy policy.",
}

export default function PrivacyPage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto prose prose-gray dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: June 2026</p>
      <h2>Information We Collect</h2>
      <p>
        We collect information you provide directly to us, including your name, email address, phone number,
        shipping address, and payment information when you place an order or create an account.
      </p>
      <h2>How We Use Your Information</h2>
      <p>
        We use your information to process orders, communicate with you about your purchases,
        improve our services, and send marketing communications if you have opted in.
      </p>
      <h2>Data Security</h2>
      <p>
        We implement appropriate security measures to protect your personal information.
        Payment transactions are encrypted and processed through secure payment gateways.
      </p>
      <h2>Contact Us</h2>
      <p>
        If you have questions about this privacy policy, please contact us through our contact page.
      </p>
    </div>
  )
}
