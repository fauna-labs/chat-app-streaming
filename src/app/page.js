'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { Client, fql } from 'fauna'
import styles from './Home.module.css';
import Logout from './components/Logout';

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


export default function Home() {
  const [roomName, setRoomName] = useState('');
  const [existingRooms, setExistingRooms] = useState([]);
  const router = useRouter();
  const info = CookieInfo()
  const username = info?.username;

  const client = new Client({
    secret: info.key,
    endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
  })

  useEffect(() => {
    fetchData();
  }, [username]);

  const fetchData = async () => {
    try {
      const existingRoomsResponse = await client.query(fql`Room.all()`);
      setExistingRooms(existingRoomsResponse.data.data);

      const response = await streamClient.query(fql`Room.all().toStream()`);
      const streamToken = response.data;

      const stream = await streamClient.stream(streamToken)
        .on("start", event => {
          console.log("Stream start", event);
        })
        .on("add", event => {
          setExistingRooms(prevRooms => {
            const existingRoom = prevRooms.find(room => room.id === event?.data.id);
            return existingRoom ? prevRooms : [...prevRooms, event?.data];
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