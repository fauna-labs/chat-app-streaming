'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { Client, fql } from 'fauna'

const client = new Client({
  secret: process.env.NEXT_PUBLIC_FAUNA_SECRET,
  endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
})

const emojiUsernames = ['🐼', '🦄', '🐬', '🦁', '🐸', '🐙', '🦊', '🐥', '🦖', '🐝']

export default function Home() {
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('');
  const [existingRooms, setExistingRooms] = useState([]);
  const router = useRouter();

  useEffect(() => {
    setUsername(emojiUsernames[Math.floor(Math.random() * emojiUsernames.length)]);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch existing rooms initially
      const existingRoomsResponse = await client.query(fql`Room.all()`);
      setExistingRooms(existingRoomsResponse.data.data);

      // Set up the stream for real-time updates
      const response = await client.query(fql`Room.all().toStream()`);
      const streamToken = response.data;

      const stream = await client.stream(streamToken)
        .on("start", event => {
          console.log("Stream start", event);
        })
        .on("add", event => {
          console.log("Stream add --->", event?.data);
          setExistingRooms(prevRooms => {
            // Check if the room already exists to avoid duplicates
            const existingRoom = prevRooms.find(room => room.id === event?.data.id);
            return existingRoom ? prevRooms : [...prevRooms, event?.data];
          });
        })
        .on("remove", event => {
          console.log("Stream remove -->", event);
          // Handle removal if needed
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
    <div>
      <h1>Chat App</h1>
      <div>
        Your username: <strong>{username}</strong>
      </div>
      <h1>Create a Chat Room</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Chat Room Name"
          required
        />
        <button type="submit">Create Room</button>
      </form>
      <div>
        {existingRooms.map(room => (
          <div key={room?.id}>
            <button onClick={() => router.push(`/room/${room?.id}/${room?.roomName}/${room?.owner}/${username}`)}>
              Enter {room?.roomName}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// export default function Home() {
//   const [roomName, setRoomName] = useState('');
//   const [username, setUsername] = useState('');
//   const [existingRooms, setExistingRooms] = useState();
//   const router = useRouter();

//   useEffect(() => {
//     setUsername(emojiUsernames[Math.floor(Math.random() * emojiUsernames.length)]);
//     fetchData();
//   }, []);

//   const getExistingRooms = async () => {
//     try {
//       const rooms = await client.query(fql`Room.all()`);
//       setExistingRooms(rooms.data.data);
//     } catch (error) {
//       console.error("Failed to fetch existing rooms", error);
//     }
//   };

//   const fetchData = async () => {
//   try {
//     const response = await client.query(fql`
//       Room.all().toStream()
//     `);

//     const streamToken = response.data;

//     const stream = await client.stream(streamToken)
//       .on("start", event => {
//         console.log("Stream start", event);
//         getExistingRooms();
//       })
//       .on("add", event => {
//         console.log("Stream add --->", event?.data);
//         setExistingRooms(prevRooms => [...prevRooms, event?.data]);
//         console.log("---->", existingRooms);
//       })
//       .on("remove", event => {
//         console.log("Stream remove -->", event);
//       })
//       .on('error', event => {
//         console.log("Stream error:", event);
//       });

//     stream.start();

//     return () => stream.close();
//   } catch (error) {
//     console.error("Error fetching data:", error);
//   }
// };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     client.query(fql`Room.create({"owner": ${username}, "roomName": ${roomName} })`)
//     console.log('Creating room:', roomName);
//     setRoomName('');
//   };

//   return (
//     <div>
//       <h1>Chat App</h1>
//       <div>
//        Your username: <strong>{username}</strong>
//       </div>
//       <h1>Create a Chat Room</h1>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           value={roomName}
//           onChange={(e) => setRoomName(e.target.value)}
//           placeholder="Chat Room Name"
//           required
//         />
//         <button type="submit">Create Room</button>
//       </form>
//       <div>
//       {existingRooms?.map(room => (
//         <div key={room?.id}>
//           <button onClick={() => router.push(`/room/${room?.id}/${room?.roomName}/${room?.owner}/${username}`)}>
//             Enter {room?.roomName}
//           </button>          
//         </div>
//       ))}
//       </div>
//     </div>
//   );
// }
