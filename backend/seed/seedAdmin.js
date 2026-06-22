import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const SALT_ROUNDS = 10
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@akhdmedia.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@2026'

const seedAdmin = async () => {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)

  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: 'AKHD MEDIA & CO',
      phone: '0000000000',
      role: 'admin',
      isSuperAdmin: true,
      permissions: [],
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )

  console.log(`Admin user seeded: ${ADMIN_EMAIL}`)
}

export default seedAdmin
