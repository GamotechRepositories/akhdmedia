import PolicyContactBlock from '../components/PolicyContactBlock'

const Disclaimer = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">DISCLAIMER</h1>
        <p className="mt-2 text-sm text-gray-600">Last Updated: 1 July 2026</p>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">1. Introduction</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">Welcome to AKHD MEDIA & CO.</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            This Disclaimer governs your access to and use of AKHDMEDIA.COM and all content, products, and services
            provided through our website.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            By accessing or using our website, you acknowledge that you have read, understood, and agreed to this
            Disclaimer.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">2. Informational Purpose</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            The information, descriptions, metadata, captions, and other materials available on AKHDMEDIA.COM are
            provided for general informational purposes only.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            While we make reasonable efforts to ensure accuracy, we do not guarantee that all information is
            complete, accurate, current, or free from errors.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">3. No Warranties</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            All content, services, and licensed materials are provided &ldquo;AS IS&rdquo; and &ldquo;AS
            AVAILABLE&rdquo;, without any express or implied warranties, including but not limited to warranties of
            merchantability, fitness for a particular purpose, title, or non-infringement, to the fullest extent
            permitted by applicable law.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">4. Editorial Content</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO provides licensed editorial video content captured at officially organized public events,
            media events, red carpet appearances, press conferences, entertainment events, and other newsworthy
            occasions where accredited media are permitted to record public appearances.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            The availability of editorial content on our website does not imply any endorsement, sponsorship,
            affiliation, approval, or partnership by any individual, celebrity, brand, organization, or event
            organizer.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">5. Customer Responsibility</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Customers are solely responsible for ensuring that their use of licensed content complies with:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
            <li>The purchased license.</li>
            <li>Applicable laws and regulations.</li>
            <li>Any required third-party rights or permissions, where applicable.</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO is not responsible for any misuse of licensed content by customers or third parties.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">6. Limitation of Liability</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            To the fullest extent permitted by law, AKHD MEDIA & CO shall not be liable for any direct, indirect,
            incidental, consequential, special, exemplary, or punitive damages arising from or related to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
            <li>The use or inability to use our website.</li>
            <li>Licensed content or digital downloads.</li>
            <li>Website interruptions, errors, or technical issues.</li>
            <li>Loss of data, profits, revenue, business opportunities, or goodwill.</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">7. Third-Party Services</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Our website may integrate or link to third-party services, including payment providers or other external
            platforms.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO is not responsible for the content, policies, security, availability, or practices of
            any third-party websites or services.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">8. Policy Updates</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO reserves the right to modify this Disclaimer at any time. Any changes become effective
            immediately upon publication on AKHDMEDIA.COM.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">Contact</h2>
          <PolicyContactBlock />
        </section>
      </div>
    </div>
  </div>
)

export default Disclaimer
