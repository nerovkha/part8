import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'

const BirthYearForm = ({ setError }) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => setError(error.graphQLErrors[0]?.message),
  })

  const submit = async (event) => {
    event.preventDefault()
    editAuthor({ variables: { name, setBornTo: Number(born) } })
    setName('')
    setBorn('')
  }

  return (
    <div>
      <h3>set birthyear</h3>
      <form onSubmit={submit}>
        <div>
          name
          <input value={name} onChange={({ target }) => setName(target.value)} />
        </div>
        <div>
          born
          <input
            type="number"
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button>update author</button>
      </form>
    </div>
  )
}

const Authors = ({ show, token, setError }) => {
  const result = useQuery(ALL_AUTHORS)

  if (!show) {
    return null
  }

  if (result.loading) {
    return <div>loading...</div>
  }

  const authors = result.data.allAuthors

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {token && <BirthYearForm setError={setError} />}
    </div>
  )
}

export default Authors
