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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4f5f7] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-lg">
        <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center border-b border-gray-100 pb-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-900 text-2xl font-bold text-white">
              {getInitials(displayName)}
            </div>
          </div>

          {success && !editingField && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <dl className="mt-6 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Full Name</dt>
                {editingField !== 'name' && (
                  <button
                    type="button"
                    onClick={() => startEditing('name')}
                    className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Edit name"
                  >
                    <EditIcon />
                  </button>
                )}
              </div>

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
                  <div className="flex gap-2">
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
                <dd className="mt-1 text-sm font-medium text-gray-900">{user?.name}</dd>
              )}
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{user?.email}</dd>
            </div>

            <div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</dt>
                {editingField !== 'phone' && (
                  <button
                    type="button"
                    onClick={() => startEditing('phone')}
                    className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Edit phone number"
                  >
                    <EditIcon />
                  </button>
                )}
              </div>

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
                  <div className="flex gap-2">
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
                <dd className="mt-1 text-sm font-medium text-gray-900">{user?.phone}</dd>
              )}
            </div>
          </dl>

          {!editingField && (
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Log out
              </button>
              <Link
                to="/orders"
                className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                My Orders
              </Link>
              <Link
                to="/support"
                className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Support
              </Link>
              <button
                type="button"
                onClick={openDeleteAccount}
                className="w-full rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Delete Account
              </button>
            </div>
          )}
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
