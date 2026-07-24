import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import { POLICY_LINKS } from '../constants/policyLinks';
import { supportAPI, checkoutAPI } from '../services/commerceApi';

const STATUS_LABELS = {
  open: 'Submitted',
  in_progress: 'In review',
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
  'w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10';

const ChevronIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SupportHero = ({ title, subtitle, chips = [] }) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-7 sm:px-8 sm:py-10">
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.12]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, #fff 0.6px, transparent 0.7px), radial-gradient(circle at 80% 60%, #fff 0.6px, transparent 0.7px)',
        backgroundSize: '28px 28px',
      }}
      aria-hidden
    />
    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" aria-hidden />
    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" aria-hidden />

    <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-4 ring-white/20 sm:h-24 sm:w-24">
        <svg className="h-7 w-7 sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-white sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-300">{subtitle}</p>
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex max-w-full items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-gray-200 ring-1 ring-white/15 sm:px-3 sm:text-xs"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

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
      <div className="min-h-[calc(100vh-4rem)] w-full min-w-0 overflow-x-hidden bg-[#f4f5f7] px-3 py-5 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full min-w-0 max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl">
            <SupportHero
              title="Request submitted"
              subtitle="A confirmation email is on its way. Our team will review your issue soon."
              chips={[`Ticket #${submittedTicket}`]}
            />
            <div className="flex flex-col items-center px-4 py-8 text-center sm:px-8 sm:py-10">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-gray-600">
                Track progress anytime from My Tickets. We’ll reply by email when there’s an update.
              </p>
              <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setSubmittedTicket('')}
                  className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  View My Tickets
                </button>
                <Link
                  to="/"
                  className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full min-w-0 overflow-x-hidden bg-[#f4f5f7] px-3 py-5 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl">
          <SupportHero
            title="Contact Support"
            subtitle="Help with licenses, downloads, payments, and more."
            chips={['License help', 'Download issues', 'Payments']}
          />

          <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section className="min-w-0 border-b border-gray-100 p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-gray-900">Send a request</h2>
                <p className="mt-0.5 text-sm text-gray-500">Tell us what’s wrong and we’ll get back to you</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 sm:p-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="min-w-0 md:col-span-2">
                      <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-800">
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
                        autoComplete="name"
                      />
                    </div>

                    <div className="min-w-0">
                      <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-800">
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
                        autoComplete="email"
                      />
                    </div>

                    <div className="min-w-0">
                      <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="+91 ..."
                        autoComplete="tel"
                      />
                    </div>

                    <div className="min-w-0">
                      <label htmlFor="orderNumber" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-800">
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

                    <div className="min-w-0">
                      <label htmlFor="subject" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-800">
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

                    <div className="min-w-0 md:col-span-2">
                      <label htmlFor="message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        minLength={10}
                        rows={5}
                        className={`${inputClass} resize-y min-h-[7.5rem]`}
                        placeholder="Describe your issue. Include clip ID or license number if relevant."
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Support Request'}
                </button>
              </form>
            </section>

            <aside className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">My Tickets</h2>
                    <p className="mt-0.5 text-sm text-gray-500">Track requests and replies</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadTickets}
                    disabled={loadingTickets}
                    className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-900 disabled:opacity-60"
                  >
                    {loadingTickets ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {loadingTickets && tickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                      Loading tickets…
                    </div>
                  ) : ticketsError && tickets.length === 0 ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {ticketsError}
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                      No tickets yet. Submit a request to get started.
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="group flex w-full min-w-0 items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-left transition hover:border-gray-300 hover:bg-gray-50 sm:items-center sm:px-4 sm:py-3.5"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white sm:mt-0 sm:h-10 sm:w-10">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 8h10M7 12h6m-6 4h10M5 5h14a2 2 0 012 2v12l-4-2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                            />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="min-w-0 truncate font-mono text-sm font-semibold text-gray-900">
                              #{ticket.ticketNumber}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                                statusStyles[ticket.status] || 'bg-slate-100 text-slate-600 ring-slate-200'
                              }`}
                            >
                              {STATUS_LABELS[ticket.status] || ticket.status}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {SUBJECT_LABELS[ticket.subject] || ticket.subject}
                          </span>
                          <span className="mt-1 block text-[11px] text-gray-400">
                            Updated {formatTicketDate(ticket.lastReplyAt || ticket.updatedAt || ticket.createdAt)}
                          </span>
                        </span>
                        <span className="mt-1 shrink-0 sm:mt-0">
                          <ChevronIcon />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-auto min-w-0">
                <h3 className="text-base font-semibold text-gray-900">Policies & Legal</h3>
                <p className="mt-0.5 text-sm text-gray-500">Quick links before you purchase or write in</p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {POLICY_LINKS.map((policy) => (
                    <Link
                      key={policy.to}
                      to={policy.to}
                      className="group flex min-w-0 items-start justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      <span className="min-w-0 flex-1 break-words leading-snug">{policy.label}</span>
                      <span className="mt-0.5 shrink-0">
                        <ChevronIcon />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="flex max-h-[min(92vh,100dvh)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[min(90vh,100dvh)] sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-detail-title"
          >
            <div className="shrink-0 border-b border-gray-100 px-4 pb-4 pt-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    id="ticket-detail-title"
                    className="break-all font-mono text-base font-bold tracking-tight text-gray-900 sm:truncate sm:text-lg"
                  >
                    #{selectedTicket.ticketNumber}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-gray-500">
                    {SUBJECT_LABELS[selectedTicket.subject] || selectedTicket.subject}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
                  aria-label="Close ticket details"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="scrollbar-modern min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Progress</p>
                <ol className="relative mt-4 space-y-0">
                  {[
                    {
                      key: 'submitted',
                      label: 'Submitted',
                      active: true,
                      done: true,
                      color: 'bg-emerald-500',
                      detail: formatTicketDate(selectedTicket.createdAt),
                    },
                    {
                      key: 'review',
                      label: 'In review',
                      active: ['in_progress', 'resolved', 'closed'].includes(selectedTicket.status),
                      done: ['in_progress', 'resolved', 'closed'].includes(selectedTicket.status),
                      color: 'bg-blue-500',
                      detail: ['in_progress', 'resolved', 'closed'].includes(selectedTicket.status)
                        ? formatTicketDate(selectedTicket.updatedAt)
                        : 'Waiting for our team',
                    },
                    {
                      key: 'replied',
                      label: 'Team replied',
                      active: Boolean(selectedTicket.replies?.length),
                      done: Boolean(selectedTicket.replies?.length),
                      color: 'bg-blue-500',
                      detail: selectedTicket.replies?.length
                        ? formatTicketDate(selectedTicket.lastReplyAt)
                        : 'No reply yet',
                    },
                    {
                      key: 'final',
                      label: selectedTicket.status === 'closed' ? 'Closed' : 'Resolved',
                      active: ['resolved', 'closed'].includes(selectedTicket.status),
                      done: ['resolved', 'closed'].includes(selectedTicket.status),
                      color: 'bg-emerald-500',
                      detail: ['resolved', 'closed'].includes(selectedTicket.status)
                        ? formatTicketDate(selectedTicket.updatedAt)
                        : 'Pending resolution',
                    },
                  ].map((step, index, steps) => (
                    <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < steps.length - 1 && (
                        <span
                          className={`absolute left-[7px] top-4 h-[calc(100%-8px)] w-0.5 ${
                            step.done && steps[index + 1].done ? 'bg-gray-300' : 'bg-gray-200'
                          }`}
                          aria-hidden
                        />
                      )}
                      <span
                        className={`relative z-10 mt-1 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full ring-4 ring-gray-50/80 ${
                          step.active ? step.color : 'bg-gray-300'
                        }`}
                      >
                        {step.done && (
                          <svg className="h-2 w-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className={`text-sm font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Your message</p>
                <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {selectedTicket.replies?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Team replies</p>
                  <div className="mt-2 space-y-3">
                    {selectedTicket.replies.map((reply, index) => (
                      <div
                        key={`${reply.sentAt}-${index}`}
                        className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50/60 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                            ST
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-blue-900">Support Team</p>
                            {reply.sentAt && (
                              <p className="text-[11px] text-blue-700/70">{formatTicketDate(reply.sentAt)}</p>
                            )}
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-blue-950/90">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
