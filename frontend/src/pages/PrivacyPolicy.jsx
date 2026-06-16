import { Link } from 'react-router-dom'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">PRIVACY POLICY</h1>
          <p className="mt-2 text-sm text-gray-600">Last Updated: [16/06/2026]</p>

          <p className="mt-6 text-sm leading-relaxed text-gray-800">
            Welcome to [AKHD MEDIA & CO ]. We respect your privacy and are committed to protecting your personal
            information.
          </p>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">1. INFORMATION WE COLLECT</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">When you use our website, we may collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Billing information</li>
              <li>Payment transaction details</li>
              <li>IP address</li>
              <li>Website usage data</li>
              <li>Customer support communications</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">2. HOW WE USE YOUR INFORMATION</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">We use your information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Process orders and payments</li>
              <li>Deliver purchased digital content</li>
              <li>Provide customer support</li>
              <li>Verify transactions and prevent fraud</li>
              <li>Improve website functionality</li>
              <li>Send order confirmations and service notifications</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">3. PAYMENT INFORMATION</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Payments are processed through third-party payment providers. We do not store complete credit card or
              debit card details on our servers.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">4. DIGITAL CONTENT DELIVERY</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              After successful payment, customers may receive access to downloadable files, streaming access,
              cloud-storage links, or other delivery methods.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">5. COOKIES AND ANALYTICS</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Our website may use cookies and similar technologies to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Remember user preferences</li>
              <li>Improve user experience</li>
              <li>Analyze website traffic</li>
              <li>Detect fraudulent activity</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              Users may disable cookies through their browser settings, although some website features may not function
              properly.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">6. SHARING OF INFORMATION</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              We do not sell personal information to third parties.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">We may share information with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Payment processors</li>
              <li>Hosting providers</li>
              <li>Cloud storage providers</li>
              <li>Legal authorities when required by law</li>
              <li>Professional advisors and service providers assisting our business</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">7. DATA SECURITY</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              We implement reasonable technical and organizational measures to protect personal information from
              unauthorized access, disclosure, alteration, or destruction.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              However, no internet transmission or electronic storage method is completely secure.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">8. DATA RETENTION</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              We retain customer information only as long as necessary for business, legal, accounting, tax, security,
              and regulatory purposes.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">9. CUSTOMER RIGHTS</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">Subject to applicable law, users may request:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Access to their personal data</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of certain personal information</li>
              <li>Withdrawal of consent where applicable</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              Requests may be submitted using the contact information below.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">10. THIRD-PARTY SERVICES</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Our website may contain links to third-party websites, cloud-storage services, payment gateways, and
              social media platforms. We are not responsible for their privacy practices.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">11. CHILDREN’S PRIVACY</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Our services are not directed toward children under the age required by applicable law. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">12. POLICY CHANGES</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              We may update this Privacy Policy from time to time. Updated versions will be posted on this page with a
              revised effective date.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">13. CONTACT US</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              If you have questions regarding this Privacy Policy, please contact:
            </p>
            <div className="mt-2 space-y-1 text-sm text-gray-800">
              <p>Business Name: [AKHD MEDIA & CO]</p>
              <p>Email: [akhdmedia@gmail.com]</p>
              <p>Only WhatsApp : [+918591443501]</p>
              <p>
                Support :{' '}
                <Link to="/support" className="font-medium text-gray-900 underline underline-offset-2">
                  click here
                </Link>
              </p>
              <p className="pt-2">Address: GR/RC/C3 NEW VIDARBHA SRA CHSL BLDG. NO.13</p>
              <p>NEHRU NAGAR GOLIBAR ROAD</p>
              <p>NR. PARAMOUNT CHS SANTACRUZ(E)</p>
              <p>MUMBAI 400055</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
