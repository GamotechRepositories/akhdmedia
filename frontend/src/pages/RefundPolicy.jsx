import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { getPolicyLastUpdatedLabel } from '../utils/policyDate'

const RefundPolicy = () => {
  const lastUpdated = getPolicyLastUpdatedLabel()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">REFUND POLICY</h1>
          <p className="mt-2 text-sm text-gray-600">{lastUpdated}</p>

          <p className="mt-6 text-sm leading-relaxed text-gray-800">
            Thank you for purchasing digital content from AKHD MEDIA & CO / www.akhdmedia.com.
          </p>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">1. DIGITAL PRODUCTS</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              All products sold on our website, including but not limited to celebrity videos, red carpet footage,
              paparazzi content, event videos, photographs, and other downloadable digital media, are digital products
              delivered electronically.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">2. NO REFUND POLICY</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Due to the nature of digital products, all sales are final. Once a customer has successfully received,
              downloaded, streamed, accessed, or obtained a download link for any digital content, no refund,
              cancellation, or exchange will be provided.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">3. EXCEPTIONS</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Refunds may be considered only in the following circumstances:
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              a) Duplicate payment made for the same order. If duplicate payment is made on the same day then we will
              process your refund!
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              b) Payment successfully completed but digital content was not delivered and our support team is unable to
              provide access within a reasonable time.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              c) The purchased file is corrupted or inaccessible, and a replacement file cannot be provided.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">4. CUSTOMER RESPONSIBILITY</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Customers are responsible for reviewing product descriptions, previews, licensing information, file
              formats, and compatibility requirements before making a purchase.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">Refunds will not be granted for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Change of mind.</li>
              <li>Accidental purchases.</li>
              <li>Lack of knowledge about the product.</li>
              <li>Inability to use the file due to customer software or hardware limitations.</li>
              <li>Dissatisfaction with content that matches the product description.</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">5. REFUND REQUEST PROCESS</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              To request a refund under the limited exceptions above, customers must contact us within 7 days of
              purchase and provide:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Order number.</li>
              <li>Proof of payment.</li>
              <li>Description of the issue.</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">6. PROCESSING OF APPROVED REFUNDS</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              If a refund is approved, it will be processed through the original payment method within 5-7 business
              days, subject to payment gateway and banking timelines.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">7. CONTACT INFORMATION</h2>
            <p className="mt-2 text-sm text-gray-800">For refund-related inquiries, please contact:</p>
            <div className="mt-2 space-y-2 text-sm text-gray-800">
              <p>Email: {BRAND.supportEmail}</p>
              <p>Only WhatsApp: +91 85914 43501</p>
              <p>
                Support:{' '}
                <Link to="/support" className="font-medium text-gray-900 underline underline-offset-2">
                  Click here
                </Link>
              </p>
              <div className="pt-1">
                <p>Address: GR/RC/C3 NEW VIDARBHA SRA CHSL BLDG. NO.13</p>
                <p>NEHRU NAGAR GOLIBAR ROAD</p>
                <p>NR. PARAMOUNT CHS SANTACRUZ(E) MUMBAI 400055</p>
              </div>
            </div>
          </section>

          <p className="mt-8 text-sm leading-relaxed text-gray-800">
            By purchasing content from our website, you acknowledge that you have read, understood, and agreed to this
            Refund Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RefundPolicy
