'use client'

import { useState, useEffect } from 'react'
import { Client, fql } from 'fauna'
import { useRouter } from 'next/navigation';
import styles from './DeleteRoom.module.css';
import Cookies from 'js-cookie';

export default function DeleteRoom({ ownerName, userName, roomId }) {
    const [isOwner, setIsOwner] = useState(false);
    const router = useRouter();
    const [client, setClient] = useState(null);
    const userKey = Cookies.get('key');

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
        if(ownerName === userName) {
            setIsOwner(true);
        }
    }, [])

    const deleteRoomHandler = async (e) => {
        e.preventDefault();
        const result = await client.query(fql`
            let roomToDelete = Room.byId(${roomId})
            let messagesToDelete = Message.byRoomRef(roomToDelete)
            messagesToDelete.forEach(message => {message.delete()})
            roomToDelete?.delete()

        `);
        router.push('/');
    }

    return (
        <>
        {isOwner ? (
            <button onClick={deleteRoomHandler} className={styles.button}>Delete Room</button>
        ) : null}
        </>
    )
}