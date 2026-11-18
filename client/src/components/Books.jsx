import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { ALL_BOOKS } from '../queries'

const Books = ({ show }) => {
  const [genre, setGenre] = useState(null)

  const allResult = useQuery(ALL_BOOKS)
  const filteredResult = useQuery(ALL_BOOKS, {
    variables: { genre },
    skip: !genre,
  })

  if (!show) {
    return null
  }

  if (allResult.loading || (genre && filteredResult.loading)) {
    return <div>loading...</div>
  }

  const books = genre ? filteredResult.data.allBooks : allResult.data.allBooks

  const genres = [
    ...new Set(allResult.data.allBooks.flatMap((book) => book.genres)),
  ]

  return (
    <div>
      <h2>books</h2>

      <div>
        {genres.map((g) => (
          <button key={g} onClick={() => setGenre(g)}>
            {g}
          </button>
        ))}
        <button onClick={() => setGenre(null)}>all genres</button>
      </div>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => (
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

export default Books
