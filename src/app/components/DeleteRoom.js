'use client'

import { useState, useEffect } from 'react'
import { fql } from 'fauna'
import { useRouter } from 'next/navigation';
import { FaunaClient } from './FaunaClient';
import styles from './DeleteRoom.module.css'


const client = FaunaClient();

export default function DeleteRoom({ ownerName, userName, roomId }) {
    const [isOwner, setIsOwner] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if(ownerName === userName) {
            setIsOwner(true);
        }
    }, [])

    const deleteRoomHandler = async (e) => {
        e.preventDefault();
        // console.log(roomId);
        const result = await client.query(fql`
            let roomToDelete = Room.byId('${roomId}')
            roomToDelete
        `);
        console.log(result);
        // router.push('/');
    }

    return (
        <>
        {isOwner ? (
            <button onClick={deleteRoomHandler} className={styles.button}>Delete Room</button>
        ) : null}
        </>
    )
}