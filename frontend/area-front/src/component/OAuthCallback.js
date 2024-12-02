import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3000/api/auth/google/callback', {
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    navigate('/dashboard'); // Redirect to dashboard
                } else {
                    navigate('/login'); // Redirect to login if failed
                }
            })
            .catch((err) => console.error('Auth error:', err));
    }, []);

    return <div>Authenticating...</div>;
};

export default AuthCallback;
