import React from 'react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import UserProfile from './UserProfile';

const Oauth2 = () => {
    return (
        <div className="mx-auto max-w-screen-xl px-4 py-52 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg">
                <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Flowfy</h1>
                <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
                    Une solution innovante pour connecter vos applications préférées et automatiser vos tâches quotidiennes.
                </p>
                <LoginButton />
                <LogoutButton />
                <UserProfile />
            </div>
        </div>
    );
};

export default Oauth2;
