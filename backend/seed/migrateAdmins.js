import User from '../models/User.js'
import Admin from '../models/Admin.js'

export const migrateLegacyAdminsToCollection = async () => {
  const legacyAdmins = await User.find({ role: 'admin' }).select('+password').lean()

  if (!legacyAdmins.length) {
    return 0
  }

  let migrated = 0

  for (const legacy of legacyAdmins) {
    await Admin.findOneAndUpdate(
      { email: legacy.email },
      {
        email: legacy.email,
        password: legacy.password,
        name: legacy.name,
        phone: legacy.phone || '',
        isSuperAdmin: Boolean(legacy.isSuperAdmin),
        permissions: legacy.permissions || [],
      },
      { upsert: true, setDefaultsOnInsert: true },
    )

    await User.deleteOne({ _id: legacy._id })
    migrated += 1
  }

  return migrated
}
