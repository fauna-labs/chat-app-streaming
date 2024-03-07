'use client'

import { Client } from "fauna";
import { CookieInfo } from "./CookieInfo";

export const FaunaClient = () => {
    let cookieData = CookieInfo();

    const faunaSecret = cookieData && cookieData.key 
        ? cookieData.key
        : null;

    if (!faunaSecret) { 
        console.log("no valid key in the cookie");
        window.location.href = '/authenticationform';
    }

    return new Client({
        secret: faunaSecret,
        endpoint: process.env.NEXT_PUBLIC_FAUNA_ENDPOINT
    });
};