import mongoose from 'mongoose'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  buildProductShareDescription,
  buildProductShareHtml,
  getFrontendBaseUrl,
  getProductPosterUrl,
} from '../utils/productShareMeta.js'

export const getProductSharePage = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).send('Product not found')
    return
  }

  const product = await Product.findOne({ _id: id, isActive: true }).lean()
  if (!product) {
    res.status(404).send('Product not found')
    return
  }

  const productPageUrl = `${getFrontendBaseUrl()}/product/${product._id.toString()}`
  const imageUrl = getProductPosterUrl(product)
  const html = buildProductShareHtml({
    title: product.name,
    description: buildProductShareDescription(product),
    imageUrl,
    productPageUrl,
  })

  res.set('Content-Type', 'text/html; charset=utf-8')
  res.set('Cache-Control', 'public, max-age=300')
  res.send(html)
})
