import { useEffect } from 'react'
import { useCloseAuthModal } from '../../utils/authModalNavigation'

const AuthModalShell = ({
  title,
  subtitle,
  children,
  onClose,
  closeLabel = 'Close',
}) => {
  const defaultClose = useCloseAuthModal()
  const closeModal = onClose || defaultClose

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [closeModal])

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      closeModal()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-md sm:py-10"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="flex min-h-full items-start justify-center sm:min-h-[100dvh] sm:items-center">
        <div
          className="relative w-full max-w-md"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'auth-modal-title' : undefined}
        >
          <div className="relative mb-4 sm:mb-6">
            {title ? (
              <div className="px-12 text-center">
                <h1 id="auth-modal-title" className="text-2xl font-bold text-white">
                  {title}
                </h1>
                {subtitle ? <p className="mt-2 text-sm text-white/80">{subtitle}</p> : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={closeModal}
              aria-label={closeLabel}
              className="absolute right-0 top-0 z-30 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white text-gray-700 shadow-lg transition hover:bg-gray-50 hover:text-gray-900 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthModalShell
