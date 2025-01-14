import React, { useEffect, useState } from 'react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import UserProfile from './UserProfile';
import lightImage from '../assets/homepage/tile_background_light.png';
import darkImage from '../assets/homepage/tile_background.png';
import { motion } from 'framer-motion';

const Oauth2 = () => {
    const [headerImage, setHeaderImage] = useState(darkImage);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const updateTheme = () => {
            const prefersLightTheme = window.matchMedia('(prefers-color-scheme: light)').matches;
            setHeaderImage(prefersLightTheme ? lightImage : darkImage);
        };

        updateTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        mediaQuery.addEventListener('change', updateTheme);

        return () => mediaQuery.removeEventListener('change', updateTheme);
    }, []);

    useEffect(() => {
        const email = localStorage.getItem('email');
        setIsLoggedIn(!!email);
    }, []);

    return (
        <div style={{ backgroundImage: `url(${headerImage})`, backgroundSize: 'cover', height: '100vh' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
                <div className="flex w-full justify-center">
                    <div className="px-4 py-52 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-lg dark:bg-white rounded-lg shadow-lg p-6 bg-gray-800">
                            <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Flowfy</h1>
                            <p className="mx-auto mt-4 max-w-md text-center dark:text-gray-500 text-white">
                                Une solution innovante pour connecter vos applications préférées et automatiser vos tâches quotidiennes.
                            </p>
                            <LoginButton />
                            {isLoggedIn && <LogoutButton />}
                            <UserProfile />
                        </div>
                    </div>  
                </div>
            </motion.div>
        </div>
    );
};

export default Oauth2;