import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(__dirname, '..', '.env') })

if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
  console.warn('[env] GOOGLE_CLIENT_ID is not set — Google sign-in will be disabled')
}
