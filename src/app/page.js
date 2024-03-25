'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { Client, fql } from 'fauna'
import styles from './Home.module.css';
import Logout from './components/Logout';
import Cookies from 'js-cookie';

export default function Home() {
  const [roomName, setRoomName] = useState('');
  const [existingRooms, setExistingRooms] = useState([]);
  const router = useRouter();
  const username = Cookies.get('username');
  const userKey = Cookies.get('key');

  let client;

  if (!userKey) {
    console.log('User not logged in');
    // This means the user is not logged in
    router.push('/authenticationform');
  } else {
    // userKey
    client = new Client({
      secret: userKey,
      endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
    })
  }

  useEffect(() => {
    if (client) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    const response = await client.query(fql`Room.all().toStream()`);
    const streamToken = response.data;

    const stream = await client.stream(streamToken)

    const existingRoomsResponse = await client.query(fql`Room.all()`);
    setExistingRooms(existingRoomsResponse.data.data);

    for await (const event of stream) {
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
          })
          break;

        case "remove":
          console.log("Stream update:", event);
          break;

        case "error":
          console.log("Stream error:", event)
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