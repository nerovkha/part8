# Part 8 — GraphQL

Exercises for [Full Stack Open](https://fullstackopen.com) part 8
(CSM14113): a GraphQL library — Apollo Server with queries, mutations,
subscriptions and authentication, plus an Apollo Client frontend.

## Apps

| App | Topic |
| --- | --- |
| `server/` | Apollo Server 4 on Express with JWT auth, Mongoose models and graphql-ws subscriptions |
| `client/` | Vite + React + Apollo Client with login, cache updates and subscription views |

## Run

```bash
cd server && npm install && npm run dev    # http://localhost:4000
cd client && npm install && npm run dev    # http://localhost:5173
```

The server needs no external database — it falls back to an in-memory
MongoDB when `MONGODB_URI` is not set.

## Test in CI

`.github/workflows/ci.yml` lints and builds the client and
syntax-checks the server on every push and pull request. This directory
is self-contained — copy its contents into a new repository and CI
works without any extra setup.
