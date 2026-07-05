import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import { supportAPI, checkoutAPI } from '../services/commerceApi';

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const SUBJECT_LABELS = {
  license_email: 'License / download email issue',
  download: 'Video download problem',
  payment: 'Payment issue',
  license: 'License verification',
  other: 'Other',
};

const statusStyles = {
  open: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const formatTicketDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

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
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadTickets = async () => {
    setLoadingTickets(true);
    setTicketsError('');
    try {
      const response = await supportAPI.getMyTickets();
      setTickets(response.data?.requests || []);
    } catch (err) {
      setTicketsError(err.message || 'Could not load your tickets.');
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

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
        loadTickets();
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
          <p className="mt-2 text-sm text-gray-500">Track status anytime in the My Tickets section below.</p>
          <button
            type="button"
            onClick={() => setSubmittedTicket('')}
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            View My Tickets
          </button>
          <Link
            to="/"
            className="mt-3 inline-flex rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-900"
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Tickets</h2>
            <p className="mt-1 text-sm text-gray-600">Track your support requests and team replies.</p>
          </div>
          <button
            type="button"
            onClick={loadTickets}
            disabled={loadingTickets}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-900 disabled:opacity-60"
          >
            {loadingTickets ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {loadingTickets && tickets.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">Loading tickets…</p>
        ) : ticketsError && tickets.length === 0 ? (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {ticketsError}
          </div>
        ) : tickets.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">No tickets yet. Submit a request above to get started.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicket(ticket)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:border-gray-900"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-gray-900">#{ticket.ticketNumber}</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {SUBJECT_LABELS[ticket.subject] || ticket.subject}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Updated {formatTicketDate(ticket.lastReplyAt || ticket.updatedAt || ticket.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                    statusStyles[ticket.status] || 'bg-slate-100 text-slate-600 ring-slate-200'
                  }`}
                >
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-bold text-gray-900">#{selectedTicket.ticketNumber}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {SUBJECT_LABELS[selectedTicket.subject] || selectedTicket.subject}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                  statusStyles[selectedTicket.status] || 'bg-slate-100 text-slate-600 ring-slate-200'
                }`}
              >
                {STATUS_LABELS[selectedTicket.status] || selectedTicket.status}
              </span>
            </div>

            <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
              <div className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Submitted</p>
                  <p className="text-xs text-gray-500">{formatTicketDate(selectedTicket.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    ['in_progress', 'resolved', 'closed'].includes(selectedTicket.status)
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">In review</p>
                  <p className="text-xs text-gray-500">
                    {['in_progress', 'resolved', 'closed'].includes(selectedTicket.status)
                      ? formatTicketDate(selectedTicket.updatedAt)
                      : 'Waiting for our team'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    selectedTicket.replies?.length ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Team replied</p>
                  <p className="text-xs text-gray-500">
                    {selectedTicket.replies?.length
                      ? formatTicketDate(selectedTicket.lastReplyAt)
                      : 'No reply yet'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    ['resolved', 'closed'].includes(selectedTicket.status) ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedTicket.status === 'closed' ? 'Closed' : 'Resolved'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {['resolved', 'closed'].includes(selectedTicket.status)
                      ? formatTicketDate(selectedTicket.updatedAt)
                      : 'Pending resolution'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-gray-900">Your message</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {selectedTicket.message}
              </p>
            </div>

            {selectedTicket.replies?.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Team replies</p>
                {selectedTicket.replies.map((reply, index) => (
                  <div key={`${reply.sentAt}-${index}`} className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                    <p className="whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                    {reply.sentAt && (
                      <p className="mt-2 text-xs text-blue-700/70">{formatTicketDate(reply.sentAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
