import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const Cursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', mouseMove);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
    };
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-[9999] h-12 w-12 rounded-full bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.4)_0%,_rgba(168,85,247,0)_60%)]"
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    />
  );
};