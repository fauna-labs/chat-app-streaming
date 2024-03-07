'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client, fql } from 'fauna';
import styles from './authepage.module.css';

const client = new Client({
  secret: process.env.NEXT_PUBLIC_FAUNA_UNAUTHENTICATED_SECRET,
  endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT,
});

export default function AuthenticationForm() {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleAuth = async (e) => {
        e.preventDefault();

        if (isLoginView) {
            try {
                const result = await client.query(fql`
                    Login(${username}, ${password})
                `)

                const userInfo = {
                    username: result?.data.user.username,
                    id: result?.data.user.id,
                    key: result?.data.cred.secret,
                };

                setCookieWithTTL("chat-loggedin", JSON.stringify(userInfo), 1440 * 60 * 1000);
                router.push('/');
                // window.location.href = '/';
            } catch (error) {
                console.log(error)
            }
        } else {
            try {
                const result = await client.query(fql`
                    let user = User.byUsername(${username}).isEmpty()
                    if(user == true) {
                    Signup(${username}, ${password})
                    } else {
                    let message = "This username is already taken, select another"
                    message
                    }
                `)
        
                if (result.data == "This username is already taken, select another") {
                    alert("This username is already taken, select another");
                    setUsername('')
                } else {
                    setIsLoginView(true);
                    setUsername('');
                    setPassword('');
                    alert('Account created, please login now')
                }
            } catch (error) {
                console.log(error)
            }
        }
    };

    function setCookieWithTTL(name, value, ttl) {
        let now = new Date();
        now.setTime(now.getTime() + ttl);
        const expires = "expires=" + now.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }   

    return (
        <div className={styles.container}>
            <h1>{isLoginView ? 'Login' : 'Sign Up'}</h1>
            <form onSubmit={handleAuth} className={styles.form}>
                <input
                    className={styles.input}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                />
                <input
                    className={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit" className={`${styles.button} ${styles.submitButton}`}>{isLoginView ? 'Login' : 'Sign Up'}</button>
            </form>
            <button onClick={() => {
                setIsLoginView(!isLoginView)
                setUsername('')
                setPassword('')
                }} 
                className={`${styles.button} ${styles.switchButton}`}
            >
                Switch to {isLoginView ? 'Sign Up' : 'Login'}
            </button>
            <button onClick={() => router.push('/')} className={`${styles.button} ${styles.homeButton}`}>Go Back Home</button>
        </div>
    );
    }









// import { useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { Client, fql } from 'fauna'
// import Login from '../components/Login';
// import Signup from '../components/Signup';

// export default function AuthenticationForm() {
//     const [currentView, setCurrentView] = useState('login');

//     const toggleView = () => {
//       setCurrentView(currentView === 'login' ? 'signup' : 'login');
//     };
 
//     return (
//         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
//             {currentView === 'login' ? <Login /> : <Signup />}
//             <button onClick={toggleView}>
//                 Switch to {currentView === 'login' ? 'Sign Up' : 'Login'}
//             </button>
//             <button onClick={() => {router.push('/')}}>Go Back Home</button>
//         </div>
//     );
// };