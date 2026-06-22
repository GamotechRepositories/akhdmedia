import { Link } from 'react-router-dom'
import { primaryBtnClass, secondaryBtnClass } from './ui/adminUi'

const FormStickyActions = ({
  cancelTo,
  cancelState,
  submitLabel = 'Save changes',
  savingLabel = 'Saving...',
  saving = false,
  disabled = false,
  hint = null,
}) => (
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md lg:left-72">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
      {hint ? (
        <p className="text-sm text-slate-500">{hint}</p>
      ) : (
        <span className="hidden sm:block" aria-hidden="true" />
      )}
      <div className="ml-auto flex flex-wrap gap-3">
        <Link to={cancelTo} state={cancelState} className={secondaryBtnClass}>
          Cancel
        </Link>
        <button
          type="submit"
          disabled={disabled || saving}
          className={`${primaryBtnClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {saving ? savingLabel : submitLabel}
        </button>
      </div>
    </div>
  </div>
)

export default FormStickyActions
