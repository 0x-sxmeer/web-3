import React from 'react';
import './FloatingBubbles.css';

const FloatingBubbles = () => {
    // Generate 20 bubbles (Optimized from 50 for performance)
    const bubbles = Array.from({ length: 20 });

    return (
        <div className="floating-bubbles-container" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0
        }}>
            {bubbles.map((_, i) => (
                <div key={i} className="bubble" />
            ))}
        </div>
    );
};

export default FloatingBubbles;
