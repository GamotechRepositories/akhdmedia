import { Navigate } from 'react-router-dom'

/** Password reset now uses email OTP on /forgot-password. Old link URLs redirect there. */
const ResetPassword = () => <Navigate to="/forgot-password" replace />

export default ResetPassword
