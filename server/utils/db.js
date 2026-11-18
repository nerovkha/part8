import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import config from './config.js'

const connectToDatabase = async () => {
  let uri = config.MONGODB_URI

  if (!uri) {
    const memoryServer = await MongoMemoryServer.create()
    uri = memoryServer.getUri('library')
    console.log('no MONGODB_URI configured, using an in-memory database')
  }

  await mongoose.connect(uri)
  console.log('connected to MongoDB')
}

export default connectToDatabase
