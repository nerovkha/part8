import { GraphQLError } from 'graphql'
import { PubSub } from 'graphql-subscriptions'
import jwt from 'jsonwebtoken'
import Author from './models/author.js'
import Book from './models/book.js'
import User from './models/user.js'
import config from './utils/config.js'

const pubsub = new PubSub()

const typeDefs = `#graphql
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`

const getCurrentUserFromContext = async (context) => {
  const auth = context.req ? context.req.get('Authorization') : null
  if (auth && auth.startsWith('Bearer ')) {
    const decodedToken = jwt.verify(auth.replace('Bearer ', ''), config.JWT_SECRET)
    return User.findById(decodedToken.id)
  }
  return null
}

const resolvers = {
  Query: {
    bookCount: async () => Book.countDocuments(),
    authorCount: async () => Author.countDocuments(),
    allBooks: async (root, args) => {
      let filter = {}
      if (args.genre) {
        filter = { genres: { $in: [args.genre] } }
      }
      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        filter.author = author ? author._id : null
      }
      return Book.find(filter).populate('author')
    },
    allAuthors: async () => {
      const books = await Book.find({})
      const counts = new Map()
      for (const book of books) {
        const key = book.author.toString()
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      const authors = await Author.find({})
      return authors.map((author) => ({
        ...author.toJSON(),
        bookCount: counts.get(author._id.toString()) ?? 0,
      }))
    },
    me: (root, args, context) => context.currentUser,
  },
  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      let author = await Author.findOne({ name: args.author })

      try {
        if (!author) {
          author = new Author({ name: args.author })
          await author.save()
        }
        const book = new Book({ ...args, author: author._id })
        const saved = await book.save()
        await saved.populate('author')
        pubsub.publish('BOOK_ADDED', { bookAdded: saved })
        return saved
      } catch (error) {
        throw new GraphQLError('saving a book failed: ' + error.message, {
          extensions: { code: 'BAD_USER_INPUT', invalidArgs: args },
        })
      }
    },
    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }
      const author = await Author.findOne({ name: args.name })
      if (!author) {
        return null
      }
      author.born = args.setBornTo
      try {
        await author.save()
      } catch (error) {
        throw new GraphQLError('updating the author failed: ' + error.message, {
          extensions: { code: 'BAD_USER_INPUT', invalidArgs: args },
        })
      }
      return author
    },
    createUser: async (root, args) => {
      const password = 'secret'
      try {
        const user = new User({
          username: args.username,
          favoriteGenre: args.favoriteGenre,
          passwordHash: await User.hashPassword(password),
        })
        return await user.save()
      } catch (error) {
        throw new GraphQLError('creating the user failed: ' + error.message, {
          extensions: { code: 'BAD_USER_INPUT', invalidArgs: args },
        })
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      if (!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, config.JWT_SECRET) }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED'),
    },
  },
}

export { typeDefs, resolvers, getCurrentUserFromContext }
