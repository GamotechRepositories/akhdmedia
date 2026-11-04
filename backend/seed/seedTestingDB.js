import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'

const SALT_ROUNDS = 10

const ADMIN_CREDENTIALS = {
  name: 'AKHD Super Admin',
  email: 'admin@akhdmedia.com',
  password: 'admin@123',
  phone: '9876543210',
}

const SAMPLE_CATEGORIES = [
  {
    slug: 'events',
    label: 'Events',
    breadcrumb: 'Events',
    navLabel: 'Events',
    showInBrowseSection: true,
    subCategories: [{ slug: 'red-carpet', name: 'Red Carpet' }],
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: 'celebrity',
    label: 'Celebrity',
    breadcrumb: 'Celebrity',
    navLabel: 'Celebrity',
    showInBrowseSection: true,
    subCategories: [{ slug: 'airport', name: 'Airport Spotting' }],
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: 'press',
    label: 'Press & Media',
    breadcrumb: 'Press',
    navLabel: 'Press',
    showInBrowseSection: true,
    subCategories: [{ slug: 'press-conference', name: 'Press Conference' }],
    sortOrder: 3,
    isActive: true,
  },
]

const SAMPLE_VIDEOS = [
  {
    clipId: 'RAW-4K-001',
    name: 'Celebrity Red Carpet Premiere 4K Raw Footage',
    categorySlug: 'events',
    subCategorySlug: 'red-carpet',
    brand: 'AKHD Editorial',
    mediaType: 'video',
    pricingMode: 'RESOLUTION_TIER',
    price: 2500,
    availableTiers: ['4K', '1080P', '720P'],
    resolutionPricing: {
      '4K': { price: 2500, resolution: '3840x2160', size: '1.8 GB' },
      '1080P': { price: 1500, resolution: '1920x1080', size: '850 MB' },
      '720P': { price: 900, resolution: '1280x720', size: '420 MB' },
    },
    videoInfo: {
      quality: '4K-UHD',
      fps: '59.94 fps',
      duration: '02:45',
      size: '1.8 GB',
      format: 'Apple ProRes 422',
      orientationNote: '16:9 Landscape',
    },
    images: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    ],
    videoPoster:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    demoVideoSource: 'file',
    rating: 5,
    description:
      'Exclusive 4K-UHD raw editorial video from star-studded celebrity gala and red carpet premiere. Suitable for television, digital news, and social media editorial broadcasting.',
    isActive: true,
    showInLatest: true,
  },
  {
    clipId: 'RAW-4K-002',
    name: 'Airport Spotting & Paparazzi 4K UHD Exclusive',
    categorySlug: 'celebrity',
    subCategorySlug: 'airport',
    brand: 'AKHD Editorial',
    mediaType: 'video',
    pricingMode: 'RESOLUTION_TIER',
    price: 3000,
    availableTiers: ['4K', '1080P', '720P'],
    resolutionPricing: {
      '4K': { price: 3000, resolution: '3840x2160', size: '1.4 GB' },
      '1080P': { price: 1800, resolution: '1920x1080', size: '650 MB' },
      '720P': { price: 1100, resolution: '1280x720', size: '320 MB' },
    },
    videoInfo: {
      quality: '4K-UHD',
      fps: '50 fps',
      duration: '01:50',
      size: '1.4 GB',
      format: 'MP4 / 4K UHD',
      orientationNote: '16:9 Landscape',
    },
    images: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&auto=format&fit=crop&q=80',
    ],
    videoPoster:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&auto=format&fit=crop&q=80',
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    demoVideoSource: 'file',
    rating: 5,
    description:
      'Direct paparazzi capture at terminal exit featuring Bollywood celebrity casual spotting and interaction. Original camera master file.',
    isActive: true,
    showInLatest: true,
  },
  {
    clipId: 'RAW-4K-003',
    name: 'Press Conference & Media Q&A 4K Editorial',
    categorySlug: 'press',
    subCategorySlug: 'press-conference',
    brand: 'AKHD Editorial',
    mediaType: 'video',
    pricingMode: 'RESOLUTION_TIER',
    price: 2000,
    availableTiers: ['4K', '1080P', '720P'],
    resolutionPricing: {
      '4K': { price: 2000, resolution: '3840x2160', size: '2.1 GB' },
      '1080P': { price: 1200, resolution: '1920x1080', size: '920 MB' },
      '720P': { price: 750, resolution: '1280x720', size: '450 MB' },
    },
    videoInfo: {
      quality: '4K-UHD',
      fps: '29.97 fps',
      duration: '03:15',
      size: '2.1 GB',
      format: 'Apple ProRes 422',
      orientationNote: '16:9 Landscape',
    },
    images: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
    ],
    videoPoster:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    demoVideoSource: 'file',
    rating: 5,
    description:
      'Official movie trailer launch press conference with media interactions and microphone audio in crystal clear 4K.',
    isActive: true,
    showInLatest: true,
  },
]

export const seedTestingDB = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://arbazwahidkhan_db_user:HRBsCY62lNI04VO4@cluster0.831ibin.mongodb.net/AKHD_TESTING?appName=Cluster0'

  console.log(`\n========================================`)
  console.log(`   Seeding Testing Database: AKHD_TESTING`)
  console.log(`========================================`)

  await mongoose.connect(mongoUri)
  console.log(`[MongoDB] Connected successfully to database: ${mongoose.connection.name}\n`)

  // 1. Seed Admin Account
  const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, SALT_ROUNDS)
  const admin = await Admin.findOneAndUpdate(
    { email: ADMIN_CREDENTIALS.email },
    {
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      password: hashedPassword,
      phone: ADMIN_CREDENTIALS.phone,
      isSuperAdmin: true,
      permissions: [],
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
  console.log(`✅ Admin Account created:`)
  console.log(`   Email:    ${ADMIN_CREDENTIALS.email}`)
  console.log(`   Password: ${ADMIN_CREDENTIALS.password}`)
  console.log(`   Role:     Super Admin (full access)\n`)

  // 2. Seed Categories
  console.log(`📁 Seeding Categories...`)
  for (const cat of SAMPLE_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    )
    console.log(`   - Category: ${cat.label} (/${cat.slug})`)
  }

  // 3. Seed 2-3 Videos
  console.log(`\n🎬 Seeding 3 Testing Videos...`)
  for (const video of SAMPLE_VIDEOS) {
    const product = await Product.findOneAndUpdate(
      { clipId: video.clipId },
      video,
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    )
    console.log(`   - Video: [${video.clipId}] ${video.name} (₹${video.price})`)
  }

  console.log(`\n🎉 Testing Database Seed Completed Successfully!`)
  console.log(`Database in use: ${mongoose.connection.name}\n`)

  await mongoose.disconnect()
}

if (process.argv[1]?.endsWith('seedTestingDB.js')) {
  seedTestingDB()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err)
      process.exit(1)
    })
}

export default seedTestingDB

