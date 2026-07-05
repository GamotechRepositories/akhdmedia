import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import { supportAPI, checkoutAPI } from '../services/commerceApi';

const SUBJECT_OPTIONS = [
  { id: 'license_email', label: 'License / download email issue' },
  { id: 'download', label: 'Video download problem' },
  { id: 'payment', label: 'Payment issue' },
  { id: 'license', label: 'License verification' },
  { id: 'other', label: 'Other' },
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  orderNumber: '',
  subject: 'license_email',
  message: '',
};

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10';

const Support = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const prefill = async () => {
      const nextForm = {
        ...emptyForm,
        email: searchParams.get('email') || '',
        orderNumber: searchParams.get('order') || '',
        subject: searchParams.get('subject') || 'license_email',
        message: searchParams.get('message') || '',
      };

      try {
        const response = await checkoutAPI.getProfile();
        const profile = response.data?.billingAddress;
        if (profile) {
          nextForm.name = profile.name || nextForm.name;
          nextForm.email = nextForm.email || profile.email || '';
          nextForm.phone = profile.phone || '';
        }
      } catch {
        // Profile is optional for support form prefill.
      }

      setForm(nextForm);
    };

    prefill();
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await supportAPI.submitRequest(form);
      if (response.success) {
        setSubmittedTicket(response.data.request.ticketNumber);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err.message || 'Could not submit support request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTicket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Request Submitted</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Your request has been received. A confirmation email has been sent to your inbox.
            Our team will review your issue and respond as quickly as possible.
          </p>
          <p className="mt-4 font-mono text-sm font-semibold text-gray-900">Ticket #{submittedTicket}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Help Center</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Contact Support</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Need help with your license, download email, or payment? Send us a message and our team will get back to you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="+91 ..."
              />
            </div>

            <div>
              <label htmlFor="orderNumber" className="mb-1.5 block text-sm font-medium text-gray-700">
                Order number
              </label>
              <input
                id="orderNumber"
                name="orderNumber"
                value={form.orderNumber}
                onChange={handleChange}
                className={inputClass}
                placeholder="Last 8 digits or full order no."
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700">
                Issue type <span className="text-red-500">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className={inputClass}
              >
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                minLength={10}
                rows={6}
                className={inputClass}
                placeholder="Describe your issue. Include clip ID or license number if relevant."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Support Request'}
          </button>
      </form>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-gray-900">Policies & Legal</h2>
        <p className="mt-2 text-sm text-gray-600">Review our policies before purchasing or requesting support.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link to="/privacy-policy" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-900">
            Privacy Policy
          </Link>
          <Link to="/refund-policy" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-900">
            Refund Policy
          </Link>
          <Link to="/terms-and-conditions" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-900">
            Terms & Conditions
          </Link>
          <Link to="/license-information-policy" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-900">
            License Information Policy
          </Link>
          <Link to="/editorial-policy" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-900">
            Editorial Policy
          </Link>
          <Link to="/legal-policy" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-900">
            Legal Policy
          </Link>
          <Link to="/media-accreditation-policy" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold capitalize text-gray-900 transition hover:border-gray-900 sm:col-span-2">
            media accreditation &amp; editorial event coverage policy
          </Link>
        </div>
      </div>

      <AlertModal
        open={Boolean(error)}
        title="Could not submit request"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  );
};

export default Support;
