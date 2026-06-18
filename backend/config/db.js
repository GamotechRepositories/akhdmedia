import mongoose from 'mongoose'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const connectDB = async () => {
  const retries = 3
  const delayMs = 3000

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      console.log(`MongoDB connected: ${conn.connection.host}`)
      return
    } catch (error) {
      console.error(
        `MongoDB connection error (attempt ${attempt}/${retries}): ${error.message}`,
      )

      if (attempt === retries) {
        process.exit(1)
      }

      await sleep(delayMs)
    }
  }
}

export default connectDB
