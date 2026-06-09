import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import Product from '../models/Product.js'
import {
  getAvailableTiers,
  getTiersUpToMaster,
  sortTierList,
} from '../constants/resolutionTiers.js'
import {
  downloadPrivateFileToPath,
  resolveLocalPrivatePath,
  uploadPrivateFileFromPath,
} from './storageService.js'
import {
  buildTranscodePlan,
  executeTranscodePlan,
  isFfmpegAvailable,
  probeVideo,
} from './transcodeService.js'

const activeJobs = new Set()

const readDeliveryMap = (deliveryFiles) => {
  if (!deliveryFiles) return new Map()
  if (deliveryFiles instanceof Map) return new Map(deliveryFiles)
  return new Map(Object.entries(deliveryFiles))
}

const assignMasterToTiers = (product, tiers, deliveryFiles) => {
  tiers.forEach((tier) => {
    deliveryFiles.set(tier, {
      videoKey: product.masterVideoKey,
      videoFilename: product.masterVideoFilename,
      imageKeys: [],
      imageFilenames: [],
    })
  })
  return deliveryFiles
}

const assignMasterToDeliverableTiers = (product) => {
  const deliveryFiles = readDeliveryMap(product.deliveryFiles)
  return assignMasterToTiers(product, getDeliverableTiers(product), deliveryFiles)
}

const getDeliverableTiers = (product) =>
  getTiersUpToMaster(product.masterVideoTier, getAvailableTiers(product))

export const runProductTranscode = async (productId) => {
  if (activeJobs.has(productId)) return

  activeJobs.add(productId)

  try {
    const product = await Product.findById(productId)
    if (!product || !product.masterVideoKey) return

    await Product.findByIdAndUpdate(productId, {
      transcodeStatus: 'processing',
      transcodeError: '',
    })

    const tiers = getDeliverableTiers(product)
    if (!tiers.length) {
      throw new Error(
        `No deliverable tiers at or below master quality (${product.masterVideoTier || 'unknown'})`,
      )
    }
    const workDir = path.join(os.tmpdir(), 'framevault-transcode', randomUUID())
    await fs.mkdir(workDir, { recursive: true })

    try {
      const localMasterPath = resolveLocalPrivatePath(product.masterVideoKey)
      let masterPath = localMasterPath

      try {
        await fs.access(localMasterPath)
      } catch {
        masterPath = path.join(workDir, product.masterVideoFilename || 'master.mp4')
        await downloadPrivateFileToPath(product.masterVideoKey, masterPath)
      }

      const ffmpegReady = await isFfmpegAvailable()
      if (!ffmpegReady) {
        const deliveryFiles = assignMasterToDeliverableTiers(product)
        await Product.findByIdAndUpdate(productId, {
          deliveryFiles,
          transcodeStatus: 'ready',
          transcodeError:
            'FFmpeg not installed — deliverable tiers currently use the master file. Install FFmpeg for automatic downscaling.',
        })
        return
      }

      const source = await probeVideo(masterPath)
      const deliveryFiles = readDeliveryMap(product.deliveryFiles)

      const plan = buildTranscodePlan({
        tiers,
        sourceWidth: source.width,
        sourceHeight: source.height,
        resolutionPricing: product.resolutionPricing,
        masterFilename: product.masterVideoFilename || 'master.mp4',
      })

      const outputs = await executeTranscodePlan({
        inputPath: masterPath,
        workDir,
        plan,
      })

      for (const output of outputs) {
        const uploaded = await uploadPrivateFileFromPath(
          output.outputPath,
          `delivery/transcoded-videos/${output.tier.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`,
          output.outputFilename,
        )

        deliveryFiles.set(output.tier, {
          videoKey: uploaded.key,
          videoFilename: uploaded.filename,
          imageKeys: [],
          imageFilenames: [],
        })
      }

      await Product.findByIdAndUpdate(productId, {
        deliveryFiles,
        transcodeStatus: 'ready',
        transcodeError: '',
      })
    } finally {
      await fs.rm(workDir, { recursive: true, force: true })
    }
  } catch (error) {
    console.error(`Transcode failed for product ${productId}:`, error)
    await Product.findByIdAndUpdate(productId, {
      transcodeStatus: 'failed',
      transcodeError: error.message || 'Transcoding failed',
    })
  } finally {
    activeJobs.delete(productId)
  }
}

export const queueProductTranscode = (productId) => {
  if (!productId) return

  setImmediate(() => {
    runProductTranscode(String(productId)).catch((error) => {
      console.error(`Unhandled transcode error for ${productId}:`, error)
    })
  })
}

export const shouldTranscodeProduct = (
  product,
  previousMasterKey = '',
  previousTiers = [],
  previousMasterTier = '',
) => {
  if (!product?.masterVideoKey) return false
  if (product.mediaType !== 'video') return false
  if (product.masterVideoKey !== previousMasterKey) return true
  if ((product.masterVideoTier || '') !== (previousMasterTier || '')) return true

  const currentTiers = sortTierList(getAvailableTiers(product))
  const priorTiers = sortTierList(previousTiers)
  return JSON.stringify(currentTiers) !== JSON.stringify(priorTiers)
}
