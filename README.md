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

3. Configure Fauna database
    - Login to your Fauna CLI using `fauna cloud-login`. If you don't have the CLI installed, you can install it using `npm install -g fauna-shell`
    - Create a new database using `fauna create-database chat-app`
    - Migrate the schema using `fauna schema push`
    - Create a new key for your UnAuthenticatedRole by running the following FQL code in the Fauna shell
    
    ```
        Key.create({
            role: 'UnAuthenticatedRole'
        })
    ```


4. Save the key to a `.env` file in the root of the project.

```bash
# UnAuthenticatedRole
NEXT_PUBLIC_FAUNA_UNAUTHENTICATED_SECRET=<Unauth-user-key-for-your-database>
```

5. Run the app

```bash

npm run dev

```

6. Open the app in your browser at `http://localhost:3000`
