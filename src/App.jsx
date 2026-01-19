import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import SmoothScroll from './components/SmoothScroll';
import Preloader from './components/Preloader';
import FloatingBubbles from './components/FloatingBubbles';
import './App.css';

function App() {
  return (
    <SmoothScroll>
      <Preloader />
      <div className="app-container">
        <FloatingBubbles />
        {/* Content Layer */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />
          <Hero />
          <Features />
          <Footer />
        </div>
      </div>
    </SmoothScroll>
  );
}

export default App;
