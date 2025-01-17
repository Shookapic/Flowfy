import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Oauth2 from './component/Oauth2';
import AuthCallback from './component/OAuthCallback';
import { Services } from './component/services.jsx';
import Homepage from './component/Homepage.js';
import Profilepage from './component/Profilepage.js';
import { ServiceTemplate } from './component/Service_page/ServiceTemplate.jsx';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isLogged, setIsLogged] = React.useState(null);

  React.useEffect(() => {
    const email = localStorage.getItem('email');
    if (email) {
      fetch(`https://flowfy.duckdns.org/api/isUserLogged?email=${encodeURIComponent(email)}`, {
        method: 'GET',
      })
        .then((response) => response.json()) // Assumes the API returns plain `true` or `false`
        .then((data) => setIsLogged(data))
        .catch((error) => {
          console.error('Error checking login status:', error);
          setIsLogged(false);
        });
    } else {
      setIsLogged(false);
    }
  }, []);

  if (isLogged === null) {
    // Show a loading indicator while waiting for the API response
    return <div>Loading...</div>;
  }

  return isLogged ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Oauth2 />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<Homepage />} />
          <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/:serviceName" element={<ProtectedRoute><ServiceTemplate /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profilepage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
