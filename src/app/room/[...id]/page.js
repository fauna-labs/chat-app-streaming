'use client'

import { useState, useEffect, useRef } from 'react'
import { Client, fql } from 'fauna'
import styles from './Room.module.css';
import { useRouter } from 'next/navigation';
import Logout from '../../components/Logout'
import DeleteRoom from '@/app/components/DeleteRoom';

const streamClient = new Client({
  secret: process.env.NEXT_PUBLIC_FAUNA_SECRET,
  endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
})

const CookieInfo = () => {
  const cookies = document.cookie.split(';');
  let cookieData;

  for (const cookie of cookies) {
    const [name, value] = cookie.split('=').map((c) => c.trim());
    if (name === 'chat-loggedin') {
      cookieData = JSON.parse(decodeURIComponent(value));
      break;
    }
  }

  if (!cookieData) {
    console.log('no valid cookie saved, please log in');
    window.location.href = '/authenticationform';
  }

  return cookieData;
};

export default function Room({ params }) {
  const id = params.id[0];
  const roomName = decodeURIComponent(params.id[1]);
  const ownerName = decodeURIComponent(params.id[2]);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState();
  const router = useRouter();
  const messagesContainerRef = useRef(null);
  const info = CookieInfo()
  console.log('------>', info.key);
  const userName = info?.username;

  const client = new Client({
    secret: info.key,
    endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
  })

  useEffect(() => {
    fetchData();
  }, [userName]);

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
      Message.create({ "username": ${userName}, "message": ${newMessage}, "roomRef": roomRef })
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
        <DeleteRoom ownerName={ownerName} userName={userName} roomId={id} cookieInfo={info}/>
        <Logout />         
      </span>
      <div className={styles.userDetails}>
        Your username: <strong>{userName}</strong>
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
          <div key={msg.id} className={`${styles.messageContainer} ${msg.username === userName ? styles.ownMessageContainer : ''}`}>
            <div className={`${styles.messageBubble} ${msg.username === userName ? styles.ownMessageBubble : ''}`}>
              <span className={styles.messageText}><strong>{msg.username}</strong>: {msg.message}</span>
            </div>
          </div>
        ))}
      </div>
  </div>
  );
}
