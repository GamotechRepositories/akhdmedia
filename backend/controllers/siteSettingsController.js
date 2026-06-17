import asyncHandler from '../utils/asyncHandler.js'
import {
  formatSiteSettings,
  getSiteSettings,
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
