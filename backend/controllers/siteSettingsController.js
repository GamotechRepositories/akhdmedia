import asyncHandler from '../utils/asyncHandler.js'
import Product from '../models/Product.js'
import {
  formatSiteSettings,
  getSiteSettings,
  updateHomeLatestProductIds,
  updateSiteSettings,
} from '../services/siteSettingsService.js'

export const getPublicSiteContent = asyncHandler(async (req, res) => {
  const settings = await getSiteSettings()
  res.json(formatSiteSettings(settings))
})

export const getAdminSiteContent = asyncHandler(async (req, res) => {
  const settings = await getSiteSettings()
  res.json(formatSiteSettings(settings))
})

export const updateAdminSiteContent = asyncHandler(async (req, res) => {
  const settings = await updateSiteSettings(req.body)
  res.json(formatSiteSettings(settings))
})

export const updateHomeLatestPins = asyncHandler(async (req, res) => {
  const [{ pinnedProducts }, latestEligibleCount] = await Promise.all([
    updateHomeLatestProductIds(req.body.productIds),
    Product.countDocuments(),
  ])

  res.json({
    data: {
      title: 'Latest Uploads',
      productCount: latestEligibleCount,
      pinnedProducts,
    },
  })
})
