import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'
import { migrateLegacyAdminsToCollection } from './migrateAdmins.js'

const SALT_ROUNDS = 10
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@akhdmedia.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@2026'

const seedAdmin = async () => {
  const migrated = await migrateLegacyAdminsToCollection()
  if (migrated > 0) {
    console.log(`Migrated ${migrated} admin account(s) from users → admins collection`)
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)

  await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: 'AKHD MEDIA & CO',
      phone: '0000000000',
      isSuperAdmin: true,
      permissions: [],
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )

  console.log(`Admin seeded in admins collection: ${ADMIN_EMAIL}`)
}

export default seedAdmin
