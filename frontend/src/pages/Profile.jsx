import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import OtpDigitInputs from '../components/auth/OtpDigitInputs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { confirmDeleteAccount, requestDeleteAccount } from '../services/authApi';

const inputClass =
  'w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const MailIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const OrdersIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
    />
  </svg>
);

const SupportIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const { clearOnLogout } = useCart();
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deleteStep, setDeleteStep] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user]);

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await clearOnLogout();
    await logout();
  };

  const startEditing = (field) => {
    setSuccess('');
    setError('');
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditingField(field);
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setError('');
    setEditingField(null);
  };

  const handleSaveField = async (field) => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (field === 'name') {
        await updateProfile(name, user?.phone || phone);
        setSuccess('Name updated successfully');
      } else {
        await updateProfile(user?.name || name, phone);
        setSuccess('Phone number updated successfully');
      }
      setEditingField(null);
    } catch (submitError) {
      setError(submitError.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteAccount = () => {
    setDeleteStep('reason');
    setDeleteReason('');
    setDeleteCode('');
    setDeleteError('');
  };

  const closeDeleteAccount = () => {
    if (deleteSubmitting) return;
    setDeleteStep(null);
    setDeleteReason('');
    setDeleteCode('');
    setDeleteError('');
  };

  const handleRequestDeleteCode = async (event) => {
    event.preventDefault();
    setDeleteError('');
    setDeleteSubmitting(true);

    try {
      await requestDeleteAccount(deleteReason);
      setDeleteStep('code');
    } catch (requestError) {
      setDeleteError(requestError.message || 'Could not send confirmation code');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleConfirmDelete = async (event) => {
    event.preventDefault();
    setDeleteError('');
    setDeleteSubmitting(true);

    try {
      await confirmDeleteAccount(deleteCode.trim());
      setDeleteStep(null);
      navigate('/', { replace: true });
      await clearOnLogout();
      await logout();
    } catch (confirmError) {
      setDeleteError(confirmError.message || 'Could not delete account');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const displayName = editingField === 'name' ? name : user?.name;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4f5f7] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-5 py-8 sm:px-8 sm:py-10">
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

            <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
              <div className="relative shrink-0">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-bold tracking-wide text-gray-900 shadow-lg ring-4 ring-white/20 sm:h-28 sm:w-28 sm:text-4xl">
                  {getInitials(displayName)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-white sm:text-2xl">
                  {user?.name || 'Your account'}
                </h2>
                <p className="mt-1 truncate text-sm text-gray-300">{user?.email}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-200 ring-1 ring-white/15">
                    Member account
                  </span>
                  {user?.phone ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/20">
                      Phone verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100 ring-1 ring-amber-400/20">
                      Add phone number
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {success && !editingField && (
            <div className="border-b border-green-100 bg-green-50 px-5 py-3 text-sm text-green-700 sm:px-8">
              {success}
            </div>
          )}

          <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
            <section className="border-b border-gray-100 p-5 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Personal information</h3>
                  <p className="mt-0.5 text-sm text-gray-500">Update how you appear on AKHD Media</p>
                </div>
              </div>

              <dl className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 transition hover:border-gray-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200">
                        <UserIcon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Full name</dt>
                        {editingField === 'name' ? (
                          <div className="mt-2 space-y-3">
                            <input
                              id="name"
                              type="text"
                              value={name}
                              onChange={(event) => setName(event.target.value)}
                              required
                              autoFocus
                              className={inputClass}
                              placeholder="Your full name"
                            />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={handleCancel}
                                disabled={submitting}
                                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveField('name')}
                                disabled={submitting}
                                className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                              >
                                {submitting ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <dd className="mt-1 truncate text-sm font-medium text-gray-900">{user?.name || '—'}</dd>
                        )}
                      </div>
                    </div>
                    {editingField !== 'name' && (
                      <button
                        type="button"
                        onClick={() => startEditing('name')}
                        className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-gray-900"
                        aria-label="Edit name"
                      >
                        <EditIcon />
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200">
                      <MailIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</dt>
                      <dd className="mt-1 break-all text-sm font-medium text-gray-900">{user?.email || '—'}</dd>
                      <p className="mt-1 text-xs text-gray-400">Email cannot be changed here</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 transition hover:border-gray-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200">
                        <PhoneIcon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</dt>
                        {editingField === 'phone' ? (
                          <div className="mt-2 space-y-3">
                            <input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={(event) => setPhone(event.target.value)}
                              required
                              autoFocus
                              className={inputClass}
                              placeholder="10-digit mobile number"
                            />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={handleCancel}
                                disabled={submitting}
                                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveField('phone')}
                                disabled={submitting}
                                className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                              >
                                {submitting ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {user?.phone || <span className="text-gray-400">Not added yet</span>}
                          </dd>
                        )}
                      </div>
                    </div>
                    {editingField !== 'phone' && (
                      <button
                        type="button"
                        onClick={() => startEditing('phone')}
                        className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-gray-900"
                        aria-label="Edit phone number"
                      >
                        <EditIcon />
                      </button>
                    )}
                  </div>
                </div>
              </dl>
            </section>

            <aside className="flex flex-col gap-6 p-5 sm:p-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Quick actions</h3>
                <p className="mt-0.5 text-sm text-gray-500">Jump to orders or get help</p>

                <div className="mt-4 space-y-2.5">
                  <Link
                    to="/orders"
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                      <OrdersIcon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">My Orders</span>
                      <span className="block text-xs text-gray-500">View purchases & downloads</span>
                    </span>
                    <ChevronIcon />
                  </Link>

                  <Link
                    to="/support"
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <SupportIcon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">Support</span>
                      <span className="block text-xs text-gray-500">Contact help & tickets</span>
                    </span>
                    <ChevronIcon />
                  </Link>

                  {!editingField && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <LogoutIcon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">Log out</span>
                        <span className="block text-xs text-gray-500">Sign out of this device</span>
                      </span>
                      <ChevronIcon />
                    </button>
                  )}
                </div>
              </div>

              {!editingField && (
                <button
                  type="button"
                  onClick={openDeleteAccount}
                  className="mt-auto w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Delete Account
                </button>
              )}
            </aside>
          </div>
        </div>
      </div>

      {deleteStep && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onClick={closeDeleteAccount}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <h2 id="delete-account-title" className="text-lg font-bold text-gray-900">
              Delete account
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              This permanently removes your account and your login will be deleted.
            </p>

            {deleteStep === 'reason' ? (
              <form onSubmit={handleRequestDeleteCode} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="delete-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Why are you deleting your account?
                  </label>
                  <textarea
                    id="delete-reason"
                    value={deleteReason}
                    onChange={(event) => setDeleteReason(event.target.value)}
                    required
                    minLength={5}
                    maxLength={500}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Tell us the reason (at least 5 characters)"
                  />
                </div>

                {deleteError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {deleteError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeDeleteAccount}
                    disabled={deleteSubmitting}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteSubmitting || deleteReason.trim().length < 5}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteSubmitting ? 'Sending...' : 'Send code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmDelete} className="mt-5 space-y-4">
                <div>
                  <p className="mb-3 text-sm text-gray-600">
                    Enter the 6-digit code we sent to{' '}
                    <span className="font-semibold text-gray-900">{user?.email}</span>
                  </p>
                  <OtpDigitInputs
                    value={deleteCode}
                    onChange={setDeleteCode}
                    disabled={deleteSubmitting}
                    autoFocus
                  />
                </div>

                {deleteError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {deleteError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep('reason');
                      setDeleteCode('');
                      setDeleteError('');
                    }}
                    disabled={deleteSubmitting}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={deleteSubmitting || deleteCode.trim().length !== 6}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteSubmitting ? 'Deleting...' : 'Delete account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <AlertModal
        open={Boolean(error)}
        title="Could not update profile"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  );
};

export default Profile;
