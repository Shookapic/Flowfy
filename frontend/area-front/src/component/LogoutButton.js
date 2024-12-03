import React from 'react';

const LogoutButton = () => {
    const handleLogout = () => {
        fetch('http://flowfy.duckdns.org:3000/api/auth/logout', {
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

    return <button onClick={handleLogout} className="btn btn-error btn-outline">Logout</button>;
};

export default LogoutButton;