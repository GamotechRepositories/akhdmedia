import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'
import { buildSharePageHtml } from '../utils/buildSharePageHtml.js'
import {
  buildProductPageUrl,
  getFrontendPublicBaseUrl,
  resolveShareImageUrl,
} from '../utils/shareUrls.js'

export const getProductSharePage = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isActive: true,
  }).lean()

  if (!product) {
    res.status(404).type('html').send(
      buildSharePageHtml({
        title: 'Clip not found',
        description: 'This clip may have been removed from the library.',
        pageUrl: buildProductPageUrl(req.params.id),
        redirectUrl: `${getFrontendPublicBaseUrl()}/videos`,
      }),
    )
    return
  }

  const productId = product._id.toString()
  const pageUrl = buildProductPageUrl(productId)
  const imageUrl = resolveShareImageUrl(product)

  res
    .status(200)
    .type('html')
    .set('Cache-Control', 'public, max-age=300')
    .send(
      buildSharePageHtml({
        title: product.name,
        description: product.name,
        pageUrl,
        imageUrl,
        redirectUrl: pageUrl,
      }),
    )
})
