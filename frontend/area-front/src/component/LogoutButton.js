import React from 'react';

const LogoutButton = () => {
    const handleLogout = () => {
        const email = localStorage.getItem('email'); // Get the email from localStorage

        if (!email) {
            console.error('No email found in localStorage');
            return;
        }

        // Step 1: Call the logout route
        fetch('https://flowfy.duckdns.org:3000/api/auth/logout', {
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message === 'Logged out successfully') {
                    // Step 2: Update the user's logged status
                    fetch(`https://flowfy.duckdns.org:3000/setUserLoggedStatus?email=${encodeURIComponent(email)}&status=false`, {
                        method: 'GET',
                    })
                        .then((res) => {
                            if (res.ok) {
                                console.log('User logged status updated');
                            } else {
                                console.error('Failed to update user logged status');
                            }
                        })
                        .catch((err) => console.error('Error updating user logged status:', err));

                    // Step 3: Clear localStorage and redirect
                    localStorage.removeItem('email'); // Clear the email from localStorage
                    window.location.href = '/'; // Redirect to login page
                }
            })
            .catch((err) => console.error('Logout error:', err));
    };

    return <button onClick={handleLogout} className="btn btn-error btn-outline">Logout</button>;
};

export default LogoutButton;
