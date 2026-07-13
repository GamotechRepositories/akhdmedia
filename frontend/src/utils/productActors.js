export const getProductActorIds = (product) => {
  if (product?.actorIds?.length) {
    return product.actorIds.map((actorId) => String(actorId))
  }

  if (product?.actorId) {
    return [String(product.actorId)]
  }

  return []
}

export const getProductActorNames = (product) => {
  if (product?.actorNames?.length) {
    return product.actorNames.map((name) => String(name).trim()).filter(Boolean)
  }

  if (product?.actorName?.trim()) {
    return product.actorName
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  }

  return []
}

export const productHasActor = (product, actorId) => {
  if (!actorId) return false
  return getProductActorIds(product).includes(String(actorId))
}

export const productsShareActor = (left, right) => {
  const leftIds = new Set(getProductActorIds(left))
  return getProductActorIds(right).some((actorId) => leftIds.has(actorId))
}

export const buildArtistSpecs = (product) => {
  const actorIds = getProductActorIds(product)
  const actorNames = getProductActorNames(product)

  return actorNames.map((name, index) => ({
    key: `artist-${actorIds[index] || index}`,
    label: index === 0 ? 'Artist' : 'Artist',
    value: name,
    href: actorIds[index]
      ? `/videos?actor=${encodeURIComponent(actorIds[index])}`
      : `/videos?search=${encodeURIComponent(name)}`,
    isArtist: true,
  }))
}
