import './App.css';
import Oauth2 from './component/Oauth2';
import Navbar from './component/Navbar';
import Homepage from './component/Homepage';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Homepage />
    </div>
  );
}

export default App;
