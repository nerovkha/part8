import { useQuery } from '@apollo/client/react'
import { ALL_BOOKS, ME } from '../queries'

const Recommendations = ({ show }) => {
  const me = useQuery(ME, { skip: !show })
  const books = useQuery(ALL_BOOKS, {
    variables: { genre: me.data?.me?.favoriteGenre },
    skip: !me.data?.me?.favoriteGenre,
  })

  if (!show) {
    return null
  }

  if (me.loading || books.loading) {
    return <div>loading...</div>
  }

  const favoriteGenre = me.data.me.favoriteGenre

  return (
    <div>
      <h2>recommendations</h2>
      <p>
        books in your favorite genre <strong>{favoriteGenre}</strong>
      </p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.data.allBooks.map((b) => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommendations
