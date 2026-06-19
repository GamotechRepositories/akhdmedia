import { useEffect, useRef, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

const GoogleSignInButton = ({ onSuccess, onError, disabled = false }) => {
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
      className={`w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}
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
    </div>
  )
}

export default GoogleSignInButton
