## Fauna Stream Chat App

This sample app demostrates how to use Fuana stream to build a real-time chat app. It's built with Next.js and Fauna database.

### Prerequisites

- Basic knowledge of React and Next.js
- Fauna account


### Getting Started

1. Clone the repository

```bash

git clone https://github.com/fauna-labs/chat-app-streaming

```

2. Install dependencies

```bash

cd chat-app-streaming
npm install

```

TODO: Add instructions for setting up Fauna database. Include schema and indexes and seed script to populate the database and setup basic ABAC roles.

3. Create a Fauna database and create the following collections:
`User`, `Message`, `Room`. 

4. Create a Fauna key and add it to a `.env` file in the root of the project.

```bash
NEXT_PUBLIC_FAUNA_SECRET=<Fauna-Secret>
# UnAuthenticatedRole
NEXT_PUBLIC_FAUNA_UNAUTHENTICATED_SECRET=<Unauth-user-key-for-your-database>
```

5. Run the app

```bash

npm run dev

```

6. Open the app in your browser at `http://localhost:3000`
