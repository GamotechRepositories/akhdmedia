import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'
import { migrateLegacyAdminsToCollection } from './migrateAdmins.js'

const SALT_ROUNDS = 10
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@akhdmedia.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123'

const seedAdmin = async () => {
  const migrated = await migrateLegacyAdminsToCollection()
  if (migrated > 0) {
    console.log(`Migrated ${migrated} admin account(s) from users → admins collection`)
  }

  const existing = await Admin.findOne({ email: ADMIN_EMAIL })
  if (existing) {
    // Admin already exists, NEVER overwrite their password!
    return
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)

  await Admin.create({
    email: ADMIN_EMAIL,
    password: hashedPassword,
    name: 'AKHD MEDIA & CO',
    phone: '0000000000',
    isSuperAdmin: true,
    permissions: [],
  })

  console.log(`Initial admin created: ${ADMIN_EMAIL}`)
}

export default seedAdmin
