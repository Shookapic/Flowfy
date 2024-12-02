import React from 'react';

const LogoutButton = () => {
    const handleLogout = () => {
        fetch('http://localhost:3000/api/auth/logout', {
            credentials: 'include',
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.message === 'Logged out successfully') {
                localStorage.removeItem('token'); // Clear the token from localStorage
                window.location.href = '/'; // Redirect to login page
            }
        })
        .catch((err) => console.error('Logout error:', err));
    };

    return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;