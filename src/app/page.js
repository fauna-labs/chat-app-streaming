'use client'

import { useRouter } from 'next/navigation';
import { Client, fql } from 'fauna';
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import styles from './Home.module.css';
import Logout from './components/Logout';

export default function Home() {
  const [roomName, setRoomName] = useState('');
  const [existingRooms, setExistingRooms] = useState([]);
  const [client, setClient] = useState(null);
  const router = useRouter();
  const username = Cookies.get('username');
  const userKey = Cookies.get('key');
  const streamRef = useRef(null);

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
    fetchData();
  }, [client]);

  const fetchData = async () => {
    const response = await client.query(fql`Room.all().toStream()`);
    const streamToken = response.data;

    const existingRoomsResponse = await client.query(fql`Room.all()`);
    setExistingRooms(existingRoomsResponse.data.data);

    if (!streamRef.current) {
      streamRef.current = await client.stream(streamToken);
      for await (const event of streamRef.current) {
        switch (event.type) {
          case "start":
            console.log("Stream start", event);
            break;
            
          case "update":
          case "add":
            console.log('Stream add', event);
            setExistingRooms(prevRooms => {
              const existingRoom = prevRooms.find(room => room.id === event?.data.id);
              return existingRoom ? prevRooms : [...prevRooms, event?.data];
            });
            break;

          case "remove":
            console.log("Stream remove:", event);
            break;

          case "error":
            console.log("Stream error:", event);
            break;
        }
      }

      return () => {
        streamRef.current.close();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await client.query(fql`Room.create({"owner": ${username}, "roomName": ${roomName} })`);
      console.log('Creating room:', roomName);
      setRoomName('');
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  if (!client) return (
    <div>
      <h1>Loading...</h1>
    </div>
  );

  return (
    <div className={styles.container}>
        <h1 className={styles.title}>Chat App</h1>
        <span>  
          <strong>{username}</strong>
          <Logout /> 
        </span>

      <form onSubmit={handleSubmit} className={styles.createChatForm}>
        <input
          className={styles.input}
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Chat Room Name"
          required
        />
        <button type="submit" className={styles.button}>Create Room</button>
      </form>
      <div className={styles.roomList}>
        {existingRooms.map(room => (
          <div key={room?.id} className={styles.roomEntry}>
            <button
              className={styles.roomButton}
              onClick={() => router.push(`/room/${room?.id}/${room?.roomName}/${room?.owner}/${username}`)}>
              Enter {room?.roomName}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}









