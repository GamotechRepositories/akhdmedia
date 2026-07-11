import PolicyContactBlock from '../components/PolicyContactBlock'

const DmcaCopyrightInfringementPolicy = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          DMCA / COPYRIGHT INFRINGEMENT POLICY
        </h1>
        <p className="mt-2 text-sm text-gray-600">Last Updated: 1 July 2026</p>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">1. Introduction</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO respects the intellectual property rights of others and expects all users of
            AKHDMEDIA.COM to do the same.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            This DMCA / Copyright Infringement Policy explains the procedure for reporting alleged copyright
            infringement relating to content available on our website.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">2. Reporting Copyright Infringement</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            If you believe that any content available on AKHDMEDIA.COM infringes your copyright or other intellectual
            property rights, you may submit a written Copyright Infringement Notice containing the following
            information:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
            <li>Your full legal name.</li>
            <li>Your contact information (email address, phone number, and postal address).</li>
            <li>A description of the copyrighted work claimed to have been infringed.</li>
            <li>The exact URL or location of the allegedly infringing material.</li>
            <li>
              A statement that you have a good-faith belief that the disputed use is not authorized by the
              copyright owner, its agent, or applicable law.
            </li>
            <li>
              A statement that the information provided is accurate and that you are the copyright owner or
              authorized to act on behalf of the copyright owner.
            </li>
            <li>Your physical or electronic signature.</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">3. Submission of Notices</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Please send all copyright infringement notices to:
          </p>
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
            <p className="font-semibold text-gray-900">Copyright Officer</p>
            <p className="mt-1">AKHD MEDIA & CO</p>
            <p className="mt-1">Email: support@akhdmedia.com</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Incomplete or inaccurate notices may delay our review process.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">4. Review Process</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Upon receiving a valid copyright complaint, AKHD MEDIA & CO will:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
            <li>Review the complaint in good faith.</li>
            <li>Evaluate the supporting information.</li>
            <li>Contact the reporting party if additional information is required.</li>
            <li>Remove, restrict, or disable access to the disputed content where legally appropriate.</li>
            <li>Take any additional action required under applicable law.</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">5. Counter-Notification</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            If you believe that content removed or restricted due to a copyright complaint was removed in error or
            misidentification, you may submit a written counter-notification containing appropriate supporting
            information.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO will review all valid counter-notifications and respond in accordance with applicable
            law.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">6. Repeat Infringers</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO reserves the right to suspend or permanently terminate the accounts of users who
            repeatedly violate copyright or intellectual property rights.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">7. False Claims</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Submitting false, misleading, or fraudulent copyright complaints or counter-notifications may result in
            legal liability under applicable law.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO reserves all legal rights against any person who knowingly submits false claims.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">8. No Waiver of Rights</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Nothing in this Policy limits or waives any copyright, intellectual property, contractual, or legal
            rights available to AKHD MEDIA & CO under applicable laws.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">9. Policy Updates</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO may update this DMCA / Copyright Infringement Policy at any time. Any revised version
            becomes effective immediately upon publication on AKHDMEDIA.COM.
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

export default DmcaCopyrightInfringementPolicy
