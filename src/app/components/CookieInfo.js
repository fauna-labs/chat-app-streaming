'use client'

export const CookieInfo = () => {
    let cookieData;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=').map(c => c.trim());
        if (name === "chat-loggedin") {
            cookieData = JSON.parse(decodeURIComponent(value));
            break;
        }
    }

    if (!cookieData) { 
        console.log("no valid cookie saved, please log in");
        window.location.href = '/authenticationform';
    }

    let info = {
        username: cookieData.username,
        id: cookieData.id,
        key: cookieData.key
    }

    return info;
};