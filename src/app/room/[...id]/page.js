'use client'

import { useState, useEffect, useRef } from 'react'
import { Client, fql } from 'fauna'
import styles from './Chatroom.module.css';
import { useRouter } from 'next/navigation';
import { FaunaClient } from '../../components/FaunaClient';
import { CookieInfo } from '@/app/components/CookieInfo';
import Logout from '../../components/Logout'

const client = FaunaClient();

const streamClient = new Client({
  secret: process.env.NEXT_PUBLIC_FAUNA_SECRET,
  endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
})

export default function Room({ params }) {
  const id = params.id[0];
  const roomName = decodeURIComponent(params.id[1]);
  const ownerName = decodeURIComponent(params.id[2]);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState();
  const router = useRouter();
  const messagesContainerRef = useRef(null);
  const info = CookieInfo()
  const username = info?.username;

  useEffect(() => {
    fetchData();
  }, [username]);

  useEffect(() => {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages]);

  const fetchData = async () => {
    try {
      const response = await streamClient.query(fql`
        let roomRef = Room.byId(${id})
        Message.byRoomRef(roomRef).toStream()
      `);
  
      const streamToken = response.data;
  
      const stream = await streamClient.stream(streamToken)
        .on("start", event => {
          console.log("Stream start", event);
          getExistingMessages();
        })
        .on("add", event => {
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
    <div className={styles.container}>
      <span>
        <button 
            className={styles.button}
            onClick={() => {router.push('/')}}
        >
            Go back home?
        </button>
        <Logout />        
      </span>
      <div className={styles.userDetails}>
        Your username: <strong>{username}</strong>
      </div>
      <form onSubmit={sendMessage} className={styles.chatForm}>
        <input
          className={styles.input}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className={styles.sendButton}>Send</button>
      </form>
      <div className={styles.chatMessages} ref={messagesContainerRef}>
        {messages?.map((msg) => (
          <div key={msg.id} className={`${styles.messageContainer} ${msg.username === username ? styles.ownMessageContainer : ''}`}>
            <div className={`${styles.messageBubble} ${msg.username === username ? styles.ownMessageBubble : ''}`}>
              <span className={styles.messageText}><strong>{msg.username}</strong>: {msg.message}</span>
            </div>
          </div>
        ))}
      </div>
  </div>
  );
}
