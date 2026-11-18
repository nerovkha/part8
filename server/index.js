import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/use/ws'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import jwt from 'jsonwebtoken'
import { typeDefs, resolvers, getCurrentUserFromContext } from './schema.js'
import connectToDatabase from './utils/db.js'
import config from './utils/config.js'
import Author from './models/author.js'
import Book from './models/book.js'
import User from './models/user.js'

const seedDatabase = async () => {
  if ((await Book.countDocuments()) !== 0) {
    return
  }

  const authors = await Author.insertMany([
    { name: 'Robert Martin', born: 1952 },
    { name: 'Martin Fowler', born: 1963 },
    { name: 'Sandi Metz', born: 1960 },
  ])

  await Book.insertMany([
    {
      title: 'Clean Code',
      published: 2008,
      author: authors[0]._id,
      genres: ['refactoring'],
    },
    {
      title: 'Agile software development',
      published: 2002,
      author: authors[0]._id,
      genres: ['agile', 'patterns'],
    },
    {
      title: 'Refactoring, 2nd edition',
      published: 2018,
      author: authors[1]._id,
      genres: ['refactoring'],
    },
    {
      title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
      published: 2012,
      author: authors[2]._id,
      genres: ['refactoring', 'design'],
    },
  ])

  console.log('database seeded with example books')
}

const start = async () => {
  await connectToDatabase()
  await seedDatabase()

  const app = express()
  const httpServer = createServer(app)

  const schema = makeExecutableSchema({ typeDefs, resolvers })

  const wsServer = new WebSocketServer({ server: httpServer, path: '/' })
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const token = ctx.connectionParams?.authToken
        if (token) {
          try {
            const decodedToken = jwt.verify(token, config.JWT_SECRET)
            const currentUser = await User.findById(decodedToken.id)
            return { currentUser }
          } catch {
            return {}
          }
        }
        return {}
      },
    },
    wsServer
  )

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  await server.start()

  app.use(
    '/',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        currentUser: await getCurrentUserFromContext({ req }),
      }),
    })
  )

  httpServer.listen(config.PORT, () => {
    console.log(`GraphQL server ready at http://localhost:${config.PORT}/`)
  })
}

start()
