import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import FormStickyActions from '../components/FormStickyActions'
import FormStep from '../components/FormStep'
import PageLoader from '../components/ui/PageLoader'
import {
  cardClass,
  inputClass,
} from '../components/ui/adminUi'
import {
  createAdminAccount,
  fetchAdminAccount,
  fetchAdminPermissionGroups,
  updateAdminAccount,
} from '../api/client'

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  permissions: [],
})

const AccessPreview = ({ groups, selectedKeys, name, email }) => {
  const activeGroups = groups.filter((group) =>
    group.permissions.some((entry) => selectedKeys.includes(entry.key)),
  )

  return (
    <div className={`${cardClass} p-5`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Access preview</p>
      <p className="mt-1 text-sm text-slate-500">Sidebar items this admin will see after login.</p>

      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {(name || email || 'A').trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{name.trim() || 'New admin'}</p>
            <p className="truncate text-xs text-slate-500">{email.trim() || 'email@example.com'}</p>
          </div>
        </div>

        {activeGroups.length === 0 ? (
          <p className="mt-4 text-xs text-amber-700">
            No pages selected yet — this admin will see an empty sidebar.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeGroups.map((group) => (
              <span
                key={group.id}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                {group.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const AdminForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [groups, setGroups] = useState([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await fetchAdminPermissionGroups()
        setGroups(response.data?.data?.groups || [])
      } catch (metaError) {
        setError(metaError.message || 'Could not load permissions')
      }
    }

    loadMeta()
  }, [])

  useEffect(() => {
    if (!isEdit) return undefined

    const loadAdmin = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchAdminAccount(id)
        const admin = response.data?.data?.admin
        setForm({
          name: admin.name || '',
          email: admin.email || '',
          phone: admin.phone || '',
          password: '',
          permissions: admin.permissions || [],
        })
        setIsSuperAdmin(Boolean(admin.isSuperAdmin))
      } catch (loadError) {
        setError(loadError.message || 'Could not load admin account')
      } finally {
        setLoading(false)
      }
    }

    loadAdmin()
  }, [id, isEdit])

  const allPermissionKeys = useMemo(
    () => groups.flatMap((group) => group.permissions.map((entry) => entry.key)),
    [groups],
  )

  const selectedCount = form.permissions.length
  const totalCount = allPermissionKeys.length
  const progressPercent = totalCount ? Math.round((selectedCount / totalCount) * 100) : 0

  const filteredGroups = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase()
    if (!term) return groups

    return groups
      .map((group) => {
        const permissions = group.permissions.filter(
          (entry) =>
            entry.label.toLowerCase().includes(term) || group.label.toLowerCase().includes(term),
        )
        return permissions.length ? { ...group, permissions } : null
      })
      .filter(Boolean)
  }, [groups, permissionSearch])

  const togglePermission = (key) => {
    setForm((current) => {
      const hasKey = current.permissions.includes(key)
      return {
        ...current,
        permissions: hasKey
          ? current.permissions.filter((entry) => entry !== key)
          : [...current.permissions, key],
      }
    })
  }

  const toggleGroup = (group) => {
    const keys = group.permissions.map((entry) => entry.key)
    const allSelected = keys.every((key) => form.permissions.includes(key))

    setForm((current) => {
      if (allSelected) {
        return {
          ...current,
          permissions: current.permissions.filter((key) => !keys.includes(key)),
        }
      }

      const merged = new Set([...current.permissions, ...keys])
      return { ...current, permissions: [...merged] }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        permissions: form.permissions,
      }

      if (!isEdit) {
        payload.email = form.email.trim().toLowerCase()
        payload.password = form.password
        await createAdminAccount(payload)
      } else {
        if (form.password) payload.password = form.password
        if (!isSuperAdmin) payload.permissions = form.permissions
        await updateAdminAccount(id, payload)
      }

      navigate('/admins')
    } catch (submitError) {
      setError(submitError.message || 'Could not save admin account')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading admin account..." />
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admins"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Admin team
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {isEdit ? 'Edit admin access' : 'Add admin account'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            {isSuperAdmin
              ? 'Super admin always has full access to every section of the panel.'
              : 'Create a separate login and choose exactly which admin pages appear in the sidebar.'}
          </p>
        </div>

        {!isSuperAdmin && totalCount > 0 ? (
          <div className={`${cardClass} min-w-[220px] px-4 py-3`}>
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
              <span>Permissions selected</span>
              <span className="text-slate-900">
                {selectedCount}/{totalCount}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <AdminAlertModal open={Boolean(error)} message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className={`${cardClass} overflow-hidden`}>
            <FormStep
              step="1"
              title="Account details"
              hint="Login credentials for this admin user."
              tone="sky"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Full name
                  </span>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="e.g. Product Manager"
                    required
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email (login ID)
                  </span>
                  <input
                    className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="admin@akhdmedia.com"
                    required
                    disabled={isEdit}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </span>
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="Optional"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {isEdit ? 'New password' : 'Password'}
                  </span>
                  <input
                    className={inputClass}
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 8 characters'}
                    required={!isEdit}
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
              </div>
            </FormStep>

            {!isSuperAdmin ? (
              <AccessPreview
                groups={groups}
                selectedKeys={form.permissions}
                name={form.name}
                email={form.email}
              />
            ) : (
              <div className="border-t border-slate-200/70 bg-violet-50/70 px-5 py-5">
                <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-white p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-violet-900">Super admin account</p>
                    <p className="mt-1 text-sm text-violet-800/80">
                      This account has unrestricted access. Permissions cannot be limited.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`${cardClass} flex flex-col overflow-hidden`}>
            <FormStep
              step="2"
              title="Page access"
              hint="Choose what appears in the left sidebar for this admin."
              tone="violet"
            >
              {!isSuperAdmin ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="search"
                      value={permissionSearch}
                      onChange={(event) => setPermissionSearch(event.target.value)}
                      placeholder="Search pages or permissions..."
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          permissions:
                            current.permissions.length === allPermissionKeys.length
                              ? []
                              : [...allPermissionKeys],
                        }))
                      }
                      className="shrink-0 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                    >
                      {form.permissions.length === allPermissionKeys.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredGroups.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                        No permissions match your search.
                      </p>
                    ) : (
                      filteredGroups.map((group) => {
                        const keys = group.permissions.map((entry) => entry.key)
                        const groupSelected = keys.filter((key) =>
                          form.permissions.includes(key),
                        ).length
                        const allSelected = groupSelected === keys.length && keys.length > 0
                        const partiallySelected = groupSelected > 0 && !allSelected

                        return (
                          <div
                            key={group.id}
                            className={`rounded-xl border p-4 transition ${
                              allSelected
                                ? 'border-slate-900 bg-slate-900/[0.03] shadow-sm'
                                : partiallySelected
                                  ? 'border-slate-400 bg-white'
                                  : 'border-slate-200 bg-white'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleGroup(group)}
                              className="flex w-full items-center justify-between gap-3 text-left"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {allSelected
                                    ? 'Full access to this section'
                                    : `${groupSelected} of ${keys.length} selected`}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                  allSelected
                                    ? 'bg-slate-900 text-white'
                                    : partiallySelected
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {allSelected ? 'All' : `${groupSelected}/${keys.length}`}
                              </span>
                            </button>

                            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                              {group.permissions.map((permission) => {
                                const checked = form.permissions.includes(permission.key)
                                return (
                                  <label
                                    key={permission.key}
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition ${
                                      checked ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                                      checked={checked}
                                      onChange={() => togglePermission(permission.key)}
                                    />
                                    <span>
                                      <span className="block text-sm font-medium text-slate-800">
                                        {permission.label}
                                      </span>
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </FormStep>
          </div>
        </div>

        <FormStickyActions
          cancelTo="/admins"
          saving={saving}
          disabled={!isSuperAdmin && !isEdit && selectedCount === 0}
          submitLabel={isEdit ? 'Save changes' : 'Create admin'}
          hint={
            isSuperAdmin
              ? 'Super admin settings apply immediately after save.'
              : selectedCount === 0
                ? 'Select at least one page access permission.'
                : `${selectedCount} permission${selectedCount === 1 ? '' : 's'} selected`
          }
        />
      </form>
    </div>
  )
}

export default AdminForm
