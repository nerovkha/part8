import { useState } from 'react'
import { useApolloClient, useQuery, useSubscription } from '@apollo/client/react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Recommendations from './components/Recommendations'
import Notify from './components/Notify'
import { ALL_BOOKS, BOOK_ADDED, ME } from './queries'

const App = () => {
  const [page, setPage] = useState('authors')
  const [message, setMessage] = useState(null)
  const [token, setToken] = useState(() =>
    localStorage.getItem('library-user-token')
  )
  const client = useApolloClient()

  const me = useQuery(ME, { skip: !token })

  const notify = (message) => {
    setMessage(message)
    setTimeout(() => setMessage(null), 5000)
  }

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) =>
      set.map((book) => book.id).includes(object.id)

    const dataInStore = client.cache.readQuery({ query: ALL_BOOKS })
    if (!dataInStore || includedIn(dataInStore.allBooks, addedBook)) {
      return
    }
    client.cache.writeQuery({
      query: ALL_BOOKS,
      data: { allBooks: dataInStore.allBooks.concat(addedBook) },
    })
  }

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const added = subscriptionData.data.bookAdded
      notify(`a new book '${added.title}' by ${added.author.name} added`)
      updateCacheWith(added)
    },
  })

  const logout = () => {
    setToken(null)
    localStorage.removeItem('library-user-token')
    client.resetStore()
  }

  const padding = { padding: 5 }

  return (
    <div>
      <div>
        <button style={padding} onClick={() => setPage('authors')}>
          authors
        </button>
        <button style={padding} onClick={() => setPage('books')}>
          books
        </button>
        {token && (
          <button style={padding} onClick={() => setPage('add')}>
            add book
          </button>
        )}
        {token && (
          <button style={padding} onClick={() => setPage('recommended')}>
            recommended
          </button>
        )}
        {token ? (
          <button style={padding} onClick={logout}>
            logout {me.data?.me ? `(${me.data.me.username})` : ''}
          </button>
        ) : (
          <button style={padding} onClick={() => setPage('login')}>
            login
          </button>
        )}
      </div>

      <Notify message={message} />

      <Authors show={page === 'authors'} token={token} setError={notify} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} setPage={setPage} setError={notify} />

      <Recommendations show={page === 'recommended'} />

      <LoginForm show={page === 'login'} setToken={setToken} setPage={setPage} />
    </div>
  )
}

export default App
