import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SwapPage from './pages/SwapPage';
import SmoothScroll from './components/SmoothScroll';
import Preloader from './components/Preloader';
import './App.css';

// Placeholder for SwapPage (will be created next)
// const SwapPage = () => <div style={{ color: 'white', padding: '100px' }}>Swap Page Loading...</div>; 

function App() {
  return (
    <Router>
      <SmoothScroll>
        <Preloader />
        <div className="app-container">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/swap" element={<SwapPage />} />
            </Routes>
        </div>
      </SmoothScroll>
    </Router>
  );
}

export default App;
