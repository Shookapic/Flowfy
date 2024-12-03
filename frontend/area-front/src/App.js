import './App.css';
import Oauth2 from './component/Oauth2';
import { Services } from './component/services.jsx';
import { ServiceTemplate } from './component/Service_page/ServiceTemplate.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Oauth2 />} />
          <Route path="/services" element={<Services />} />
          <Route path="/:serviceName" element={<ServiceTemplate />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;