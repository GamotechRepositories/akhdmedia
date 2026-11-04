import { Link } from 'react-router-dom';

const SubscriptionPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/subscriptions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
          >
            ← Back to Subscriptions
          </Link>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            Official Usage Policy
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="border-b border-gray-100 pb-6">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Subscription Terms &amp; Editorial Content Usage Policy
            </h1>
            <p className="mt-2 text-sm font-semibold text-blue-600">
              Effective Date: November 2, 2026
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Welcome to <span className="font-bold text-gray-900">AKHD Media &amp; Co.</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              AKHD Media &amp; Co. provides premium editorial video content to media professionals, digital publishers, news organizations, and content creators. Our subscription plans are designed to provide access to a wide range of editorial footage, including celebrity appearances, red carpet events, paparazzi footage, airport sightings, fashion events, press conferences, interviews, and other entertainment-related activities.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              By purchasing a subscription through our website, you agree to the following terms and conditions.
            </p>
            <p className="mt-2 text-sm font-semibold text-amber-800 bg-amber-50 rounded-lg p-2.5 border border-amber-200">
              Please read this policy carefully before subscribing.
            </p>
          </div>

          <div className="mt-8 space-y-8 text-gray-800 text-sm leading-relaxed divide-y divide-gray-100">
            {/* 1. Subscription Overview */}
            <section className="pt-6 first:pt-0">
              <h2 className="text-base font-bold text-gray-900">1. Subscription Overview</h2>
              <p className="mt-2">
                AKHD Media &amp; Co. offers subscription plans that provide access to premium editorial video content.
              </p>
              <p className="mt-2">
                Subscribers can receive a large collection of videos on a daily basis, covering the latest celebrity appearances, entertainment news, red carpet events, public appearances, and other editorial activities.
              </p>
              <p className="mt-2">
                Our subscription service is designed to make high-quality editorial footage easily accessible to media professionals and digital publishers.
              </p>
              <p className="mt-2">
                The available subscription plans, pricing, and duration will be displayed on our website.
              </p>
            </section>

            {/* 2. Subscription Activation */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">2. Subscription Activation</h2>
              <p className="mt-2">
                Upon successful confirmation of your subscription payment, AKHD Media &amp; Co. will begin processing your subscription.
              </p>
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-950 font-medium">
                A dedicated WhatsApp group will be created for each subscriber within 6 hours of successful payment confirmation.
              </div>
              <p className="mt-3">
                The WhatsApp group will be created using the mobile number provided by the subscriber during the subscription process.
              </p>
              <p className="mt-2">
                Subscribers are responsible for providing a valid and active WhatsApp mobile number.
              </p>
              <p className="mt-2">
                Once the group has been created, subscribers will receive confirmation and can begin accessing the daily video updates.
              </p>
            </section>

            {/* 3. Daily Video Delivery */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">3. Daily Video Delivery</h2>
              <p className="mt-2">
                Subscribers will receive editorial video content directly through their dedicated WhatsApp group on a daily basis.
              </p>
              <p className="mt-2">
                Our team regularly captures and updates editorial footage from various events and celebrity activities.
              </p>
              <p className="mt-3 font-semibold text-gray-900">The content may include:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-gray-700">
                <li>Celebrity Spotting &amp; Paparazzi Videos</li>
                <li>Airport Arrival &amp; Departure Footage</li>
                <li>Red Carpet Events</li>
                <li>Fashion Shows &amp; Fashion Events</li>
                <li>Press Conferences &amp; Interviews</li>
                <li>Celebrity Public Appearances</li>
                <li>Entertainment &amp; Media Events</li>
                <li>Other Editorial Video Coverage</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                The availability and quantity of videos may vary depending on daily events, editorial coverage, and content availability. AKHD Media &amp; Co. aims to provide regular daily updates throughout the active subscription period.
              </p>
            </section>

            {/* 4. Editorial Use Only */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">4. Editorial Use Only</h2>
              <p className="mt-2 font-semibold text-blue-900">
                All videos provided under the subscription are licensed strictly for EDITORIAL USE ONLY.
              </p>
              <p className="mt-2">The content may be used for legitimate editorial purposes, including:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-gray-700">
                <li>News Reporting</li>
                <li>Digital News Publications</li>
                <li>Television News Broadcasts</li>
                <li>Entertainment News Websites</li>
                <li>Documentaries</li>
                <li>Journalism</li>
                <li>Editorial Social Media Content</li>
                <li>Informational and Educational Editorial Publications</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Subscribers must ensure that all content is used in accordance with applicable copyright laws and the terms of the editorial license. The subscription does not grant any commercial advertising or promotional rights.
              </p>
            </section>

            {/* 5. Prohibited Uses */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-red-700">5. Prohibited Uses</h2>
              <p className="mt-2">
                The following uses are strictly prohibited unless separately authorized in writing by AKHD Media &amp; Co. and the relevant rights holders:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-red-900">
                <li>Commercial Advertising</li>
                <li>Brand Promotions</li>
                <li>Product Endorsements</li>
                <li>Marketing Campaigns</li>
                <li>Sponsored Commercial Content</li>
                <li>Promotional Videos for Businesses</li>
                <li>Use in Advertisements or Commercial Branding</li>
                <li>Any Other Non-Editorial Commercial Purpose</li>
              </ul>
              <p className="mt-3 font-semibold text-gray-900">
                Subscribers must not use editorial footage in a manner that implies a celebrity’s endorsement, sponsorship, or association with a product, service, or brand.
              </p>
            </section>

            {/* 6. Copyright & Intellectual Property */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">6. Copyright &amp; Intellectual Property</h2>
              <p className="mt-2">
                All videos, footage, and related materials provided by AKHD Media &amp; Co. remain protected by applicable copyright and intellectual property laws.
              </p>
              <p className="mt-2">
                A subscription provides limited editorial usage rights and does not transfer ownership or copyright to the subscriber.
              </p>
              <p className="mt-3 font-semibold text-gray-900">Subscribers are prohibited from:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-gray-700">
                <li>Reselling or Redistributing Subscription Content</li>
                <li>Sharing Videos with Unauthorized Third Parties</li>
                <li>Uploading Content to Other Stock Footage Platforms</li>
                <li>Removing Copyright Notices or Watermarks from Preview Videos</li>
                <li>Claiming Ownership of AKHD Media &amp; Co. Footage</li>
                <li>Providing Access to Subscription Content to Non-Subscribers</li>
              </ul>
              <p className="mt-3 text-xs text-red-700">
                Any unauthorized distribution, resale, or misuse of the content may result in immediate suspension or termination of the subscription and may lead to further legal action where applicable.
              </p>
            </section>

            {/* 7. Subscription Duration & Renewal */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">7. Subscription Duration &amp; Renewal</h2>
              <p className="mt-2">
                Each subscription is valid for the duration selected by the subscriber at the time of purchase. Available plans may include monthly and yearly subscriptions.
              </p>
              <p className="mt-2">
                The subscription remains active for the selected period, subject to the applicable terms.
              </p>
              <p className="mt-2">
                Where automatic renewal is enabled, the subscription may renew according to the selected billing cycle unless canceled before the renewal date.
              </p>
              <p className="mt-2">
                Subscribers are responsible for managing their subscription renewal and ensuring that their payment information remains valid.
              </p>
            </section>

            {/* 8. Payment & Refund Policy */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">8. Payment &amp; Refund Policy</h2>
              <p className="mt-2">
                All subscription payments must be completed through the available payment methods displayed on our website. A subscription will be processed only after successful payment confirmation.
              </p>
              <p className="mt-2">
                Due to the digital nature of the service and the delivery of licensed editorial content, subscription fees are generally non-refundable once the subscription has been activated and content delivery has commenced, except where required by applicable law.
              </p>
              <p className="mt-2">
                If a payment is deducted but the subscription is not activated, subscribers may contact our support team for assistance. Any refund request will be reviewed in accordance with our applicable refund policy and legal obligations.
              </p>
            </section>

            {/* 9. Subscriber Responsibilities */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">9. Subscriber Responsibilities</h2>
              <p className="mt-2">Subscribers agree to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-gray-700">
                <li>Provide Accurate Registration Information.</li>
                <li>Enter a Valid and Active WhatsApp Mobile Number.</li>
                <li>Use All Videos Strictly for Editorial Purposes.</li>
                <li>Comply with Applicable Copyright and Licensing Laws.</li>
                <li>Avoid Unauthorized Sharing or Redistribution.</li>
                <li>Maintain the Confidentiality of Their Subscription Access.</li>
                <li>Follow the Terms and Conditions of AKHD Media &amp; Co.</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Subscribers are responsible for ensuring that their use of the content complies with the applicable laws and regulations in their jurisdiction.
              </p>
            </section>

            {/* 10. WhatsApp Group Access */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">10. WhatsApp Group Access</h2>
              <p className="mt-2">
                The dedicated WhatsApp group is created exclusively for the subscriber’s access to daily editorial video updates.
              </p>
              <p className="mt-2">
                Subscribers must ensure that the WhatsApp number provided during checkout is correct and active.
              </p>
              <p className="mt-2">
                If a subscriber changes their WhatsApp number or loses access to the provided number, they must contact AKHD Media &amp; Co. for assistance.
              </p>
              <p className="mt-2">
                AKHD Media &amp; Co. reserves the right to manage, modify, or recreate WhatsApp groups when necessary for operational or technical reasons.
              </p>
              <p className="mt-2">
                Access to the WhatsApp group is available only during the active subscription period.
              </p>
            </section>

            {/* 11. Suspension & Termination */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">11. Suspension &amp; Termination</h2>
              <p className="mt-2">
                AKHD Media &amp; Co. reserves the right to suspend or terminate a subscription without prior notice if a subscriber:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-red-900">
                <li>Violates the Editorial Usage Policy.</li>
                <li>Shares Content Without Authorization.</li>
                <li>Resells or Redistributes Licensed Videos.</li>
                <li>Uses Content for Prohibited Commercial Purposes.</li>
                <li>Engages in Any Activity That Violates These Terms.</li>
              </ul>
              <p className="mt-3 text-xs text-red-700">
                In cases of serious misuse, AKHD Media &amp; Co. may take appropriate legal action to protect its intellectual property and licensing rights.
              </p>
            </section>

            {/* 12. Content Availability & Updates */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">12. Content Availability &amp; Updates</h2>
              <p className="mt-2">
                AKHD Media &amp; Co. makes reasonable efforts to provide regular editorial video updates.
              </p>
              <p className="mt-2">
                However, the availability, quantity, and type of footage may vary depending on events, celebrity appearances, filming schedules, and other operational circumstances.
              </p>
              <p className="mt-2">
                AKHD Media &amp; Co. does not guarantee a fixed number of videos every day unless expressly specified in the selected subscription plan.
              </p>
              <p className="mt-2">
                Occasional delays may occur due to technical issues, WhatsApp service interruptions, or other circumstances beyond our reasonable control.
              </p>
            </section>

            {/* 13. Policy Amendments */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">13. Policy Amendments</h2>
              <p className="mt-2">
                AKHD Media &amp; Co. reserves the right to update, modify, or revise this Subscription Terms &amp; Editorial Content Usage Policy when necessary. Any updated policy will be published on our official website.
              </p>
              <p className="mt-2">
                Subscribers are encouraged to review the policy periodically to remain informed of any changes.
              </p>
            </section>

            {/* 14. Contact & Support */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">14. Contact &amp; Support</h2>
              <p className="mt-2">
                For subscription-related inquiries, payment assistance, WhatsApp group access, or editorial licensing questions, please contact AKHD Media &amp; Co. through our official website or customer support channels.
              </p>
              <p className="mt-2">
                Our team will make reasonable efforts to assist subscribers with their concerns.
              </p>
            </section>

            {/* 15. Acceptance of Terms */}
            <section className="pt-6">
              <h2 className="text-base font-bold text-gray-900">15. Acceptance of Terms</h2>
              <p className="mt-2">
                By purchasing a subscription from AKHD Media &amp; Co., you acknowledge that you have read, understood, and agreed to the Subscription Terms &amp; Editorial Content Usage Policy.
              </p>
              <p className="mt-2">
                You further acknowledge that all subscription content is provided strictly for editorial use only and that any unauthorized commercial use, resale, or redistribution is prohibited.
              </p>
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="font-bold text-gray-900">Thank you for choosing AKHD Media &amp; Co.</p>
                <p className="mt-1 text-xs text-gray-600">Your trusted source for premium editorial video content.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPolicy;

