'use client'

import { useState, useEffect } from 'react'
import { Client, fql } from 'fauna'

const client = new Client({
  secret: process.env.NEXT_PUBLIC_FAUNA_SECRET,
  endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
})

export default function Room({ params }) {
  const id = params.id[0];
  const roomName = decodeURIComponent(params.id[1]);
  const ownerName = decodeURIComponent(params.id[2]);
  const username = decodeURIComponent(params.id[3]);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await client.query(fql`
        let roomRef = Room.byId(${id})
        Message.byRoomRef(roomRef).toStream()
      `);
  
      const streamToken = response.data;
  
      const stream = await client.stream(streamToken)
        .on("start", event => {
          console.log("Stream start", event);
          getExistingMessages();
        })
        .on("add", event => {
          // console.log("Stream add --->", event?.data.message);
          setMessages(prevMessages => {
            const existingMessage = prevMessages.find(msg => msg.id === event?.data.id);
            return existingMessage ? prevMessages : [...prevMessages, event?.data];
          });
        })
        .on('error', event => {
          console.log("Stream error:", event);
        });
  
      stream.start();
  
      return () => stream.close();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getExistingMessages = async () => {
    const existingMessages = await client.query(fql`
      let roomRef = Room.byId(${id})
      Message.byRoomRef(roomRef)
    `);
    // console.log(existingMessages.data.data[2].id);
    setMessages(existingMessages.data.data)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage) return
    await client.query(fql`
      let roomRef = Room.byId(${id})
      Message.create({ "username": ${username}, "message": ${newMessage}, "roomRef": roomRef })
    `)
    setNewMessage('')
  }

  return (
    <div>
      <h1>Chat App</h1>
      <div>
        Your username: <strong>{username}</strong>
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
      <div>
        {messages?.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.username}</strong>: {msg.message}
          </div>
        ))}
      </div>
    </div>
  )
}
