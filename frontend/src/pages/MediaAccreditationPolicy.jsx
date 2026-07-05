import { BRAND } from '../config/brand'
import { getPolicyLastUpdatedLabel } from '../utils/policyDate'

const MediaAccreditationPolicy = () => {
  const lastUpdated = getPolicyLastUpdatedLabel()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold capitalize text-gray-900 sm:text-3xl">
            media accreditation &amp; editorial event coverage policy
          </h1>
          <p className="mt-2 text-sm text-gray-600">{lastUpdated}</p>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">1. Editorial Event Coverage</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              AKHD MEDIA & CO is an independent editorial media organization that captures original photos and videos
              at entertainment events, award ceremonies, film promotions, press conferences, red carpet events, and
              other public media events.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">2. Media Accreditation and Event Access</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Our photographers and videographers attend events only after receiving media accreditation, official
              invitations, press access, or authorization from event organizers, public relations (PR) agencies, or
              other authorized representatives. We do not obtain unauthorized access to private events.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">3. Original Content</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              All photos, videos, and digital media distributed through our platform are created by our own
              production team using our own equipment. We do not copy, scrape, download, or redistribute
              third-party copyrighted content.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">4. Editorial Purpose</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Content captured at accredited media events is produced exclusively for editorial, journalistic, and
              news-reporting purposes. Our licensed customers may use such content in accordance with our Editorial
              Policy and License Information Policy.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">5. No Commercial Endorsement</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              The availability or licensing of editorial content through our platform does not imply that any
              individual, celebrity, public figure, organizer, or brand endorses AKHD MEDIA & CO or any purchaser of
              the content. Any commercial advertising, promotional use, or implied endorsement requires separate
              legal rights and permissions where applicable.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">6. Compliance with Event Rules</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Our media team complies with all applicable event rules, accreditation requirements, venue policies,
              and applicable laws while covering events. We respect restrictions imposed by organizers regarding
              photography, videography, or content distribution.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">7. Rights Management</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Copyright in all original content remains with AKHD MEDIA & CO unless otherwise agreed in writing.
              Customers receive only the rights expressly granted under our License Information Policy.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">8. Questions</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              For questions regarding media accreditation, editorial licensing, or event coverage, please contact:
            </p>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
              <p className="font-semibold text-gray-900">{BRAND.name}</p>
              <p className="mt-2 leading-relaxed">{BRAND.companyAddress}</p>
              <p className="mt-3">Email: {BRAND.supportEmail}</p>
              <p>WhatsApp: {BRAND.supportPhone}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default MediaAccreditationPolicy
