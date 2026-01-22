import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate load time or wait for assets
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds minimum display

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          className="preloader-container"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)', // Simple 10x10 grid for effect
            gridTemplateRows: 'repeat(10, 1fr)',
            pointerEvents: 'none'
          }}
        >
          {/* Generate 100 blocks for the pixel grid effect */}
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, background: '#050505' }}
              exit={{ 
                opacity: 0,
                transition: { 
                  duration: 0.1, 
                  delay: Math.random() * 0.5 // Random shuffle reveal effect like source
                } 
              }}
              style={{ width: '100%', height: '100%', background: '#050505' }}
            />
          ))}
          
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#FF7120',
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 'bold',
              zIndex: 10000
            }}
          >
            NEBULA LABS
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
