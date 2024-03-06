'use client'

import { useState, useEffect } from 'react'
import { Client, fql } from 'fauna'

const client = new Client({
  secret: process.env.NEXT_PUBLIC_FAUNA_SECRET,
  endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
})

export default function Home() {
  const [connecting, setConnecting] = useState(false)
  const [events, setEvents] = useState('')
  const [error, setError] = useState(undefined)

  const streamEvents = async () => {
    setError(undefined)
    console.log('initiating the stream')
    const stream = client.stream(fql`Note.all().toStream()`)

    setConnecting(true)

    try {
      for await (const event of stream) {
        if (event.type == 'start') {
          console.log('stream started')
          setConnecting(false)
        }

        setEvents((events) => JSON.stringify(event) + '\n' + events)
      }
    } catch (error) {
      console.error(error)
      setError(error)
      stream.close()
    }

    return function cleanup() {
      console.log('cleaning up the stream')
      stream.close()
    }
  }

  useEffect(() => {
    streamEvents()
  }, [])

  return (
    <main>
      <h1>A basic collection stream</h1>
      {connecting ? <p>Connecting to the stream...</p> : <p>Connected!</p>}
      <h2>Event Log</h2>
      {error !== undefined ? (
        <p>Stream Error: {error?.queryInfo?.summary} </p>
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          <code>{events}</code>
        </pre>
      )}
    </main>
  )
}