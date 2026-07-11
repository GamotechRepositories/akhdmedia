import { Link } from 'react-router-dom'
import PolicyContactBlock from '../components/PolicyContactBlock'

const CopyrightPolicy = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">COPYRIGHT POLICY</h1>
        <p className="mt-2 text-sm text-gray-600">Last Updated: 1 July 2026</p>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">1. Introduction</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            This Copyright Policy explains how AKHD MEDIA & CO protects, manages, and licenses the intellectual
            property available on AKHDMEDIA.COM.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            By accessing, purchasing, or using any content from our platform, you agree to respect the copyright
            rights described in this Policy and in our other applicable policies.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">2. Copyright Ownership</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Unless otherwise stated, all videos, photographs, footage, preview clips, thumbnails, metadata, graphics,
            logos, text, and other digital materials published on AKHDMEDIA.COM are protected by copyright and remain
            the exclusive property of AKHD MEDIA & CO or its licensors.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Purchasing a license does not transfer copyright ownership to the buyer.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">3. Limited License Granted</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Upon successful purchase, customers receive only a limited, non-exclusive, non-transferable license to
            use the content in accordance with the applicable{' '}
            <Link to="/license-information-policy" className="font-medium text-gray-900 underline">
              License Information Policy
            </Link>
            ,{' '}
            <Link to="/editorial-policy" className="font-medium text-gray-900 underline">
              Editorial Policy
            </Link>
            , and purchased license tier.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">4. Prohibited Uses</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">Without prior written permission, users may not:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
            <li>Copy, reproduce, distribute, or publicly display our content outside the licensed scope.</li>
            <li>Resell, sublicense, rent, lease, or transfer licensed files.</li>
            <li>Upload our content to stock agencies, marketplaces, or file-sharing platforms.</li>
            <li>Remove, alter, or bypass watermarks, copyright notices, or metadata.</li>
            <li>Claim ownership, authorship, or exclusive rights in our content.</li>
            <li>Use our content for AI training, dataset creation, or synthetic media generation.</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">5. Watermarks and Preview Content</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Preview files, thumbnails, and watermarked media are provided for evaluation purposes only. They remain
            protected by copyright and may not be used, published, or distributed without a valid license.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">6. Enforcement</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            Unauthorized use of our copyrighted content may result in license revocation, account suspension,
            termination of access, and legal action for copyright infringement, breach of contract, or other
            applicable claims.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">7. Reporting Infringement</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            If you believe your copyright has been infringed by content on our website, please follow the procedure
            described in our{' '}
            <Link to="/dmca-copyright-infringement-policy" className="font-medium text-gray-900 underline">
              DMCA / Copyright Infringement Policy
            </Link>
            .
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">8. Policy Updates</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO reserves the right to modify this Copyright Policy at any time. Updated versions become
            effective immediately upon publication on AKHDMEDIA.COM.
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

export default CopyrightPolicy
