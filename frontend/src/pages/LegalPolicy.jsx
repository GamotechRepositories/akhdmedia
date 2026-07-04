import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { getPolicyEffectiveDateLabel } from '../utils/policyDate'

const LegalPolicy = () => {
  const effectiveDate = getPolicyEffectiveDateLabel()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">LEGAL POLICY</h1>
          <p className="mt-2 text-sm text-gray-600">{effectiveDate}</p>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">1. Introduction</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              This Legal Policy governs the use of the AKHD MEDIA & CO website, mobile applications, digital
              platforms, and services. By accessing or using our services, you agree to comply with this Legal
              Policy and all applicable laws.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">2. Ownership</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              All content published by AKHD MEDIA & CO, including but not limited to articles, videos,
              photographs, graphics, logos, trademarks, designs, source code, and other intellectual property,
              is owned by or licensed to AKHD MEDIA & CO and is protected under applicable copyright, trademark,
              and intellectual property laws.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">3. Editorial Content</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              AKHD MEDIA & CO publishes news, media reports, interviews, and editorial content in good faith.
              While reasonable efforts are made to ensure accuracy, we do not guarantee that all information is
              complete, current, or error-free.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">4. Media Coverage</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Photographs and videos published by AKHD MEDIA & CO may be captured at officially organized media
              events, press conferences, public appearances, and other events where accredited media organizations
              are invited for editorial reporting. Such content is used solely for legitimate journalistic and
              editorial purposes.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">5. User Responsibilities</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">Users agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Violate any applicable law.</li>
              <li>
                Copy, reproduce, distribute, or commercially exploit our content without prior written permission.
              </li>
              <li>Upload malicious software or interfere with our services.</li>
              <li>Impersonate another person or provide false information.</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">6. Third-Party Links</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Our website may contain links to third-party websites. AKHD MEDIA & CO is not responsible for the
              content, policies, or practices of external websites.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">7. Limitation of Liability</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              AKHD MEDIA & CO shall not be liable for any direct, indirect, incidental, consequential, or special
              damages arising from the use of our website, applications, services, or published content.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">8. Intellectual Property Infringement</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              If you believe your copyright or intellectual property has been infringed, please contact us with
              sufficient details. Valid complaints will be reviewed promptly, and appropriate action will be taken
              where required.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">9. Governing Law</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              This Legal Policy shall be governed by and interpreted in accordance with the laws of India. Any
              disputes shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra,
              India.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">10. Changes to This Policy</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              AKHD MEDIA & CO reserves the right to modify or update this Legal Policy at any time. Changes
              become effective immediately upon publication on our website.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">11. Contact</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              For legal inquiries, copyright matters, or compliance-related questions, please contact AKHD MEDIA &
              CO using the official contact details published on our website.
            </p>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
              <p className="font-semibold text-gray-900">{BRAND.name}</p>
              <p className="mt-2 leading-relaxed">{BRAND.companyAddress}</p>
              <p className="mt-3">
                <Link to="/support" className="font-medium text-gray-900 underline">
                  Contact Support
                </Link>
              </p>
              <p className="mt-2">Email: {BRAND.supportEmail}</p>
              <p>Only WhatsApp: {BRAND.supportPhone}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default LegalPolicy
