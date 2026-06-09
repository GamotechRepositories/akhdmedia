const errorHandler = (error, req, res, next) => {
  console.error(error)

  if (error.name === 'AppError' || error.statusCode) {
    res.status(error.statusCode).json({ message: error.message })
    return
  }

  if (error.name === 'ValidationError') {
    res.status(400).json({ message: error.message })
    return
  }

  if (error.code === 11000) {
    res.status(409).json({ message: 'Duplicate entry found' })
    return
  }

  if (error.name === 'CastError') {
    res.status(400).json({ message: 'Invalid ID format' })
    return
  }

  res.status(500).json({
    message: error.message || 'Internal server error',
  })
}

export default errorHandler
