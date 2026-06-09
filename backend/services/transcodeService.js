import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import {
  getTierDimensions,
  getTierPixelCount,
  sortTierList,
} from '../constants/resolutionTiers.js'

const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg'
const FFPROBE_BIN = process.env.FFPROBE_PATH || 'ffprobe'

const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => reject(error))
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }
      reject(new Error(stderr.trim() || `${command} exited with code ${code}`))
    })
  })

export const isFfmpegAvailable = async () => {
  try {
    await runCommand(FFMPEG_BIN, ['-version'])
    return true
  } catch {
    return false
  }
}

export const probeVideo = async (inputPath) => {
  const { stdout } = await runCommand(FFPROBE_BIN, [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,duration',
    '-of',
    'json',
    inputPath,
  ])

  const parsed = JSON.parse(stdout)
  const stream = parsed.streams?.[0]
  if (!stream?.width || !stream?.height) {
    throw new Error('Could not read video dimensions from master file')
  }

  return {
    width: Number(stream.width),
    height: Number(stream.height),
    duration: stream.duration ? Number(stream.duration) : null,
  }
}

const buildOutputFilename = (masterFilename, tier) => {
  const base = path.basename(masterFilename, path.extname(masterFilename))
  const safeTier = tier.replace(/[^a-zA-Z0-9]+/g, '-')
  return `${base}-${safeTier}.mp4`
}

export const transcodeVideoToTier = async ({
  inputPath,
  outputPath,
  width,
  height,
}) => {
  const scaleFilter = [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
  ].join(',')

  await runCommand(FFMPEG_BIN, [
    '-y',
    '-i',
    inputPath,
    '-vf',
    scaleFilter,
    '-c:v',
    'libx264',
    '-preset',
    process.env.FFMPEG_PRESET || 'medium',
    '-crf',
    process.env.FFMPEG_CRF || '18',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    outputPath,
  ])
}

export const copyVideoFile = async (inputPath, outputPath) => {
  await fs.copyFile(inputPath, outputPath)
}

export const buildTranscodePlan = ({
  tiers,
  sourceWidth,
  sourceHeight,
  resolutionPricing = {},
  masterFilename,
}) => {
  const sourcePixels = sourceWidth * sourceHeight
  const sortedTiers = sortTierList(tiers)

  return sortedTiers.map((tier) => {
    const target = getTierDimensions(tier, resolutionPricing)
    const targetPixels = getTierPixelCount(tier, resolutionPricing)
    const outputFilename = buildOutputFilename(masterFilename, tier)

    if (!target || !targetPixels) {
      return {
        tier,
        action: 'copy',
        width: sourceWidth,
        height: sourceHeight,
        outputFilename,
        reason: 'custom-tier-fallback',
      }
    }

    if (targetPixels >= sourcePixels) {
      return {
        tier,
        action: 'copy',
        width: sourceWidth,
        height: sourceHeight,
        outputFilename,
        reason: 'no-upscale',
      }
    }

    return {
      tier,
      action: 'transcode',
      width: target.width,
      height: target.height,
      outputFilename,
      reason: 'downscale',
    }
  })
}

export const executeTranscodePlan = async ({ inputPath, workDir, plan }) => {
  const outputs = []

  for (const step of plan) {
    const outputPath = path.join(workDir, step.outputFilename)

    if (step.action === 'copy') {
      await copyVideoFile(inputPath, outputPath)
    } else {
      await transcodeVideoToTier({
        inputPath,
        outputPath,
        width: step.width,
        height: step.height,
      })
    }

    outputs.push({
      tier: step.tier,
      outputPath,
      outputFilename: step.outputFilename,
      action: step.action,
    })
  }

  return outputs
}
