import React from 'react';
import {jwtDecode} from 'jwt-decode';

const UserProfile = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <div>You need to login first</div>;
    }

    const decodedToken = jwtDecode(token);
    const email = decodedToken.email;
    const name = decodedToken.name;
    const surname = decodedToken.surname;

    return (
        <div>
            <h1>{email}</h1>
            <h1>{name}</h1>
            <h1>{surname}</h1>
        </div>
    );
}

export default UserProfile;