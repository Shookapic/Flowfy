import React from 'react';

const LoginButton = () => {
    const handleLogin = () => {
        const popup = window.open(
            'http://localhost:3000/api/auth/google?prompt=select_account', // Add prompt parameter
            '_blank',
            'width=500,height=600'
        );

        // Listen for the message from the popup
        const messageListener = (event) => {
            if (event.origin !== 'http://localhost:3000') {
                console.error('Invalid origin:', event.origin);
                return; // Verify origin
            }
            const { success, token, user } = event.data;

            if (success) {
                console.log('Authentication successful:', user);
                localStorage.setItem('token', token); // Store the token
                // Do something with the user data (e.g., update state or redirect)
                console.log('User data:', user);
            } else {
                console.error('Authentication failed');
            }

            // Clean up the event listener
            window.removeEventListener('message', messageListener);
        };

        window.addEventListener('message', messageListener);
    };

    return <button onClick={handleLogin}>Login with Google</button>;
};

export default LoginButton;
