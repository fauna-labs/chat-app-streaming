'use client'

import { useState, useEffect, useRef } from 'react'
import { Client, fql } from 'fauna'
import styles from './Room.module.css';
import { useRouter } from 'next/navigation';
import Logout from '../../components/Logout'
import DeleteRoom from '@/app/components/DeleteRoom';
import Cookies from 'js-cookie';

export default function Room({ params }) {
  const id = params.id[0];
  const roomName = decodeURIComponent(params.id[1]);
  const ownerName = decodeURIComponent(params.id[2]);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const router = useRouter();
  const messagesContainerRef = useRef(null);
  const streamRef = useRef(null);
  const [client, setClient] = useState(null);
  const userKey = Cookies.get('key');

  const userName = Cookies.get('username');

  useEffect(() => {
    if (!userKey) {
      router.push('/authenticationform');
      return;
    }
    
    const initClient = async () => {
      const newClient = new Client({
        secret: userKey,
        endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
      });

      setClient(newClient);
    };

    initClient();
  }, [userKey]);

  useEffect(() => {
    if (!client) return;
    startMessageStream();
  }, [client]);

  useEffect(() => {
    if(!client) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages]);

  const startMessageStream = async () => {
    getExistingMessages();
    const response = await client.query(fql`
      let roomRef = Room.byId(${id})
      Message.byRoomRef(roomRef).toStream()
    `);
    const streamToken = response.data;

    if (!streamRef.current) {
      streamRef.current = await client.stream(streamToken)
      for await (const event of streamRef.current) {
        switch (event.type) {
          case "start":
            console.log("Stream start", event);
            break;
            
          case "update":
          case "add":
            console.log('Stream add', event);
            setMessages(prevMessages => {
              const existingMessage = prevMessages.find(msg => msg.id === event?.data.id);
              return existingMessage ? prevMessages : [...prevMessages, event?.data];
            });
            break;
  
          case "remove":
            console.log("Stream update:", event);
            break;
  
          case "error":
            console.log("Stream error:", event)
        }
      }
  
      return () => {
        streamRef.current.close();
      }
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

  if (!client) return null;

  return (
    <div className={styles.container}>
      <span>
        <button 
            className={styles.button}
            onClick={() => {
              router.push('/')
            }}
        >
            Go back home?
        </button>
        <DeleteRoom ownerName={ownerName} userName={userName} roomId={id} />
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
