import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Oauth2 from './component/Oauth2';
import AuthCallback from './component/OAuthCallback';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Oauth2 />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
        </Router>
    );
};

export default App;
