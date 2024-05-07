// / App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Login from './Components/Login.js';
import Login from './Components/Login.js'; // Import your other components as needed
// import Test from './Components/Test.js';
// import Audience from './Components/Audience.js';
class App extends React.Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route path="/app" element={<Login />} />
        </Routes>
      </Router>
    );
  }
}

export default App;