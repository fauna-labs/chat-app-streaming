'use client'

import styles from './Logout.module.css';
import Cookies from 'js-cookie';

export default function Logout() {
    const logoutHandler = (e) => {
        e.preventDefault();

        Cookies.remove('key');
        Cookies.remove('username');
        Cookies.remove('id');
        window.location.href = '/authenticationform';
    }

    return (
        <button className={styles.button} onClick={logoutHandler}>Logout?</button>
    )
}