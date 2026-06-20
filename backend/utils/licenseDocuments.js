import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const LICENSE_AGREEMENT_FILENAME = 'AKHD-Media-License-Agreement.pdf'

export const LICENSE_AGREEMENT_PATH = path.join(__dirname, '../assets', LICENSE_AGREEMENT_FILENAME)

export const readLicenseAgreementBuffer = () => fs.readFile(LICENSE_AGREEMENT_PATH)
