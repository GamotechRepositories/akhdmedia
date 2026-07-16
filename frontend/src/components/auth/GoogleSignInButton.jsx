import { useEffect, useRef, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

const GoogleSignInButton = ({
  onSuccess,
  onError,
  disabled = false,
  blocked = false,
  onBlocked,
}) => {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(320)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined

    const updateWidth = () => {
      setWidth(Math.max(240, Math.floor(node.offsetWidth)))
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      aria-disabled={disabled}
    >
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width={width}
      />
      {blocked && !disabled && (
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer rounded-md bg-transparent"
          aria-label="Agree to terms before continuing with Google"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onBlocked?.()
          }}
        />
      )}
    </div>
  )
}

export default GoogleSignInButton
