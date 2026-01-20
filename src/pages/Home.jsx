import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';
import FloatingBubbles from '../components/FloatingBubbles';

const Home = () => {
    return (
        <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
            <FloatingBubbles />
            {/* Content Layer */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <Navbar />
                <Hero />
                <Features />
                <Footer />
            </div>
        </div>
    );
};

export default Home;
