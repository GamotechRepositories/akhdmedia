import { BRAND } from '../config/brand'

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">ABOUT US</h1>

          <p className="mt-6 text-sm leading-relaxed text-gray-800">Welcome to AKHD MEDIA & CO.</p>

          <p className="mt-4 text-sm leading-relaxed text-gray-800">
            AKHD MEDIA & CO is an independent digital media agency specializing in high-quality celebrity,
            entertainment, red-carpet, fashion, event, and editorial content. We provide professionally captured
            photos and videos for media organizations, news publishers, entertainment platforms, digital publishers,
            content creators, and editorial outlets worldwide.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-gray-800">
            Our mission is to deliver timely, authentic, and high-quality visual content covering celebrity
            appearances, film promotions, public events, entertainment industry activities, and red-carpet moments.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-gray-800">
            We are committed to maintaining professional standards in content creation, licensing, and digital
            distribution. Our platform enables authorized users to access and license editorial content quickly and
            efficiently for news reporting, entertainment coverage, and informational purposes.
          </p>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">WHAT WE OFFER</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>Celebrity photographs</li>
              <li>Red-carpet event coverage</li>
              <li>Entertainment news footage</li>
              <li>Editorial videos and photography</li>
              <li>Event and public appearance coverage</li>
              <li>Digital media licensing</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">OUR COMMITMENT</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">We strive to provide:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
              <li>High-quality media content</li>
              <li>Reliable digital delivery</li>
              <li>Professional licensing solutions</li>
              <li>Fast customer support</li>
              <li>Transparent business practices</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">IMPORTANT NOTICE</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              AKHD MEDIA & CO licenses content primarily for editorial, news-reporting, and informational purposes.
              Unless expressly stated in writing, purchases do not include celebrity endorsement, advertising,
              sponsorship, publicity, or commercial promotional rights.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold text-gray-900">CONTACT US</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-800">
              <p>AKHD MEDIA & CO</p>
              <p>Email: {BRAND.supportEmail}</p>
              <p>WhatsApp: +91 8591443501</p>
            </div>
          </section>

          <p className="mt-8 text-sm leading-relaxed text-gray-800">
            Thank you for choosing AKHD MEDIA & CO as your trusted source for entertainment and celebrity media
            content.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-gray-800">
            This version is suitable for a professional marketplace similar to entertainment photo/video agencies that
            license celebrity and red-carpet content to media outlets and publishers.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutUs
