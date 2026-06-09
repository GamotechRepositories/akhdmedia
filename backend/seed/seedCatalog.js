import Category from '../models/Category.js'
import Product from '../models/Product.js'

const categorySeed = [
  {
    slug: 'nature',
    label: 'Nature Footage',
    breadcrumb: 'Nature',
    navLabel: 'Nature',
    sortOrder: 1,
    description: 'Landscapes, wildlife, and atmospheric shots.',
    coverImage:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=720&auto=format&fit=crop&q=80',
    heroBadge: 'Nature Vault',
    heroHeadline: 'Nature Footage in True 4K',
    heroSubheadline: 'Golden hour, wildlife, and landscapes graded for documentary work.',
    heroCta: 'Shop Nature',
    heroAccent: 'from-emerald-900/80 via-black/50 to-transparent',
    featuredTitle: 'Nature Essentials',
    featuredSubtitle: 'Wildlife & landscape masters',
    featuredGradient: 'from-emerald-900/70 to-transparent',
    subCategories: [
      { slug: 'mountains', name: 'Mountains & Peaks' },
      { slug: 'forests', name: 'Forests & Wildlife' },
      { slug: 'oceans', name: 'Oceans & Coastlines' },
    ],
  },
  {
    slug: 'urban',
    label: 'Urban & Cityscape',
    breadcrumb: 'Urban',
    navLabel: 'Urban',
    sortOrder: 2,
    description: 'Timelapse skylines and street-level motion.',
    coverImage:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&h=720&auto=format&fit=crop&q=80',
    heroBadge: 'Urban Collection',
    heroHeadline: 'City Motion & Timelapse',
    heroSubheadline: 'Skylines, streets, and architecture graded for commercial edits.',
    heroCta: 'Browse Urban',
    heroAccent: 'from-rose-900/80 via-black/60 to-transparent',
    featuredTitle: 'Urban Motion Pack',
    featuredSubtitle: 'City timelapse clips',
    featuredGradient: 'from-gray-900/70 to-transparent',
    subCategories: [
      { slug: 'city-timelapse', name: 'City Timelapse' },
      { slug: 'street-cinematics', name: 'Street Cinematics' },
      { slug: 'architecture', name: 'Architecture' },
    ],
  },
  {
    slug: 'drone',
    label: 'Drone & Aerial',
    breadcrumb: 'Drone',
    navLabel: 'Drone',
    sortOrder: 3,
    description: 'Cinematic aerial perspectives at 4K 60fps.',
    coverImage:
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&h=720&auto=format&fit=crop&q=80',
    heroBadge: 'Aerial Footage',
    heroHeadline: 'Drone Shots That Elevate Every Edit',
    heroSubheadline: 'Sweeping aerials at 60fps — mountains, coastlines, and cityscapes.',
    heroCta: 'Browse Drone',
    heroAccent: 'from-sky-900/80 via-black/50 to-transparent',
    featuredTitle: 'Aerial Essentials',
    featuredSubtitle: 'Drone footage for every edit',
    featuredGradient: 'from-sky-900/70 to-transparent',
    subCategories: [
      { slug: 'aerial-landscapes', name: 'Aerial Landscapes' },
      { slug: 'orbital-shots', name: 'Orbital Shots' },
    ],
  },
  {
    slug: 'business',
    label: 'Business & Corporate',
    breadcrumb: 'Business',
    navLabel: 'Business',
    sortOrder: 4,
    description: 'Corporate B-roll, teams, and modern workplaces.',
    coverImage:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=1200&auto=format&fit=crop&q=80',
    subCategories: [
      { slug: 'corporate', name: 'Corporate B-Roll' },
      { slug: 'office', name: 'Team & Office' },
    ],
  },
  {
    slug: 'cinematic',
    label: 'Cinematic Masters',
    breadcrumb: 'Cinematic',
    navLabel: 'Cinematic',
    sortOrder: 5,
    description: 'Film-grade color, anamorphic, and slow-mo.',
    coverImage:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=720&auto=format&fit=crop&q=80',
    heroBadge: '4K Collection',
    heroHeadline: 'Cinema-Grade Stock Footage',
    heroSubheadline: 'Broadcast-ready clips shot on RED & ARRI. License once, use forever.',
    heroCta: 'Explore Cinematic',
    heroAccent: 'from-violet-900/80 via-black/50 to-transparent',
    subCategories: [
      { slug: 'film-grade', name: 'Film-Grade LUTs' },
      { slug: 'slow-motion', name: 'Slow Motion' },
      { slug: 'anamorphic', name: 'Anamorphic' },
    ],
  },
  {
    slug: 'sports',
    label: 'Sports & Action',
    breadcrumb: 'Sports',
    navLabel: 'Sports',
    sortOrder: 6,
    description: 'High-speed action and slow-motion athletic footage.',
    coverImage:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&auto=format&fit=crop',
    subCategories: [{ slug: 'slow-motion', name: 'Slow Motion' }],
  },
  {
    slug: 'commercial',
    label: 'Commercial & Product',
    breadcrumb: 'Commercial',
    navLabel: 'Commercial',
    sortOrder: 7,
    description: 'Product showcases and brand-ready commercial clips.',
    coverImage:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&h=500&auto=format&fit=crop&q=80',
    subCategories: [{ slug: 'corporate', name: 'Corporate B-Roll' }],
  },
]

const categorySlugByName = {
  Nature: 'nature',
  Urban: 'urban',
  Drone: 'drone',
  Business: 'business',
  Cinematic: 'cinematic',
  Sports: 'sports',
  Commercial: 'commercial',
}

const productSeed = [
  {
    name: 'Golden Hour Mountain Vista',
    category: 'Nature',
    subCategory: 'mountains',
    brand: 'CineStock',
    price: 499,
    rating: 4.8,
    description:
      'Breathtaking 4K footage of golden hour light cascading over snow-capped mountain peaks. Perfect for travel documentaries, nature films, and cinematic backgrounds.',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '60 fps',
      size: '245 MB',
      duration: '0:15',
      format: 'MP4 / H.264',
    },
  },
  {
    name: 'Urban Night Cityscape',
    category: 'Urban',
    subCategory: 'city-timelapse',
    brand: 'MetroLens',
    price: 399,
    rating: 4.6,
    description:
      'Stunning timelapse of a bustling metropolitan skyline at night with vibrant neon lights and flowing traffic.',
    images: [
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1477959858607-67ae85b6b424?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '30 fps',
      size: '198 MB',
      duration: '0:12',
      format: 'MP4 / H.264',
    },
  },
  {
    name: 'Ocean Waves Aerial Drone',
    category: 'Drone',
    subCategory: 'aerial-landscapes',
    brand: 'SkyFrame',
    price: 599,
    rating: 4.9,
    description:
      'Cinematic aerial drone footage of turquoise ocean waves crashing against rocky coastline.',
    images: [
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1439402093374-1e47b84d7844?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '60 fps',
      size: '312 MB',
      duration: '0:18',
      format: 'MP4 / H.265',
    },
  },
  {
    name: 'Corporate Office Meeting',
    category: 'Business',
    subCategory: 'office',
    brand: 'ProBiz Media',
    price: 349,
    rating: 4.5,
    description:
      'Professional footage of a diverse team collaborating in a modern office environment.',
    images: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '2K (2560×1440)',
      fps: '24 fps',
      size: '156 MB',
      duration: '0:10',
      format: 'MP4 / H.264',
    },
  },
  {
    name: 'Tropical Rainforest Canopy',
    category: 'Nature',
    subCategory: 'forests',
    brand: 'WildFrame',
    price: 449,
    rating: 4.7,
    description:
      'Lush green rainforest canopy with morning mist and exotic birds.',
    images: [
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1426604966848-d7ad8d13e620?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '30 fps',
      size: '278 MB',
      duration: '0:20',
      format: 'MP4 / H.264',
    },
  },
  {
    name: 'Sports Action Slow Motion',
    category: 'Sports',
    subCategory: 'slow-motion',
    brand: 'ActionReel',
    price: 549,
    rating: 4.8,
    description:
      'High-speed slow motion capture of athletic performance at 120fps.',
    images: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '120 fps',
      size: '420 MB',
      duration: '0:08',
      format: 'MP4 / H.265',
    },
  },
  {
    name: 'Luxury Product Showcase',
    category: 'Commercial',
    subCategory: 'corporate',
    brand: 'LuxeVisual',
    price: 399,
    rating: 4.4,
    description:
      'Elegant product showcase with studio lighting and smooth camera movements.',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572635196233-159f2e29d4a?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '24 fps',
      size: '185 MB',
      duration: '0:14',
      format: 'MP4 / H.264',
    },
  },
  {
    name: 'Cinematic Desert Dunes',
    category: 'Cinematic',
    subCategory: 'film-grade',
    brand: 'EpicFrame',
    price: 649,
    rating: 4.9,
    description:
      'Sweeping cinematic shots of vast desert sand dunes at sunset.',
    images: [
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1451337516015-6b65e1922a08?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473587188847-7cf23f6e6b76?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '24 fps',
      size: '356 MB',
      duration: '0:22',
      format: 'MP4 / H.265',
    },
  },
  {
    name: 'Neon Street Rush Hour',
    category: 'Urban',
    subCategory: 'street-cinematics',
    brand: 'MetroLens',
    price: 449,
    rating: 4.7,
    description:
      'Handheld street-level footage through neon-lit downtown alleys during rush hour.',
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1477959858607-67ae85b6b424?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '24 fps',
      size: '210 MB',
      duration: '0:16',
      format: 'MP4 / H.264',
    },
  },
  {
    name: 'Modern Glass Tower Facade',
    category: 'Urban',
    subCategory: 'architecture',
    brand: 'ArchFrame',
    price: 379,
    rating: 4.5,
    description:
      'Clean architectural study of a contemporary glass skyscraper.',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1477959858607-67ae85b6b424?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '30 fps',
      size: '175 MB',
      duration: '0:11',
      format: 'MP4 / H.264',
    },
  },
  {
    name: 'Downtown Timelapse Clouds',
    category: 'Urban',
    subCategory: 'city-timelapse',
    brand: 'MetroLens',
    price: 429,
    rating: 4.6,
    description:
      'Day-to-night timelapse over a dense downtown core with rolling clouds.',
    images: [
      'https://images.unsplash.com/photo-1477959858607-67ae85b6b424?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&auto=format&fit=crop',
    ],
    demoVideo:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    videoPoster:
      'https://images.unsplash.com/photo-1477959858607-67ae85b6b424?w=800&auto=format&fit=crop',
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      fps: '30 fps',
      size: '190 MB',
      duration: '0:14',
      format: 'MP4 / H.264',
    },
  },
  {
    mediaType: 'image',
    name: 'Alpine Peak Still Frame',
    category: 'Nature',
    subCategory: 'mountains',
    brand: 'CineStock',
    price: 299,
    rating: 4.7,
    description:
      'High-resolution still frame of snow-capped alpine peaks at golden hour. Ideal for print, web, and presentation backgrounds.',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
    ],
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      size: '18 MB',
      format: 'JPEG / PNG',
    },
  },
  {
    mediaType: 'image',
    name: 'Neon City Street Photo',
    category: 'Urban',
    subCategory: 'street-cinematics',
    brand: 'MetroLens',
    price: 249,
    rating: 4.5,
    description:
      'Editorial-grade urban street photograph with neon reflections and cinematic contrast.',
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1477959858607-67ae85b6b424?w=800&auto=format&fit=crop',
    ],
    videoInfo: {
      quality: '4K UHD (3840×2160)',
      size: '14 MB',
      format: 'JPEG / PNG',
    },
  },
]

const mapSeedProduct = (product) => ({
  name: product.name,
  mediaType: product.mediaType || 'video',
  pricingMode: 'uniform',
  categorySlug: categorySlugByName[product.category],
  subCategorySlug: product.subCategory,
  brand: product.brand,
  price: product.price,
  rating: product.rating,
  description: product.description,
  images: product.images,
  demoVideo: product.mediaType === 'image' ? '' : product.demoVideo,
  videoPoster:
    product.mediaType === 'image'
      ? product.images?.[0] || ''
      : product.videoPoster,
  videoInfo: product.videoInfo || {},
  isActive: true,
})

const seedCatalogIfEmpty = async () => {
  const categoryCount = await Category.countDocuments()
  if (categoryCount === 0) {
    await Category.insertMany(categorySeed)
    console.log('Seeded default categories')
  }

  const productCount = await Product.countDocuments()
  if (productCount === 0) {
    await Product.insertMany(productSeed.map(mapSeedProduct))
    console.log('Seeded default products')
  }
}

export const reseedCatalog = async () => {
  await Product.deleteMany({})
  await Category.deleteMany({})
  await Category.insertMany(categorySeed)
  await Product.insertMany(productSeed.map(mapSeedProduct))
  console.log(`Seeded ${categorySeed.length} categories and ${productSeed.length} products`)
}

export default seedCatalogIfEmpty
