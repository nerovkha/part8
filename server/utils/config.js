import 'dotenv/config'

const config = {
  PORT: process.env.PORT || 4000,
  MONGODB_URI:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_MONGODB_URI
      : process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'devsecret',
}

export default config
