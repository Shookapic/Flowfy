import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Oauth2 from './component/Oauth2';
import AuthCallback from './component/OAuthCallback';
import { Services } from './component/services.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Oauth2 />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/services" element={<Services />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;