'use client'

import styles from './Logout.module.css';

export default function Logout() {

    const logoutHandler = (e) => {
        e.preventDefault();

        const deleteCookie = (name) => {
            document.cookie = `${name}`;
        };

        deleteCookie('chat-loggedin');
        window.location.href = '/authenticationform';
    }

    return (
        <button className={styles.button} onClick={logoutHandler}>Logout?</button>
    )
}