import React from 'react';
import { motion } from 'framer-motion';

const MATH_SYMBOLS = ['∑', '∫', 'π', '∞', '√', 'Δ', 'Ω', 'θ', 'α', 'β', 'μ', 'λ', '±', '≠', '≈', '∇', '∂</', '∈', '∉'];

export default function BackgroundGraphics() {
  const [elements, setElements] = React.useState([]);

  React.useEffect(() => {
    // Generate random positions only on client side to avoid hydration mismatch
    const newElements = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      symbol: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      fontSize: `${Math.random() * 30 + 20}px`,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.05 + 0.03, // Very subtle opacity
    }));
    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute text-slate-500 dark:text-slate-400 font-serif select-none"
          style={{
            left: el.left,
            top: el.top,
            fontSize: el.fontSize,
            opacity: el.opacity,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, 50, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: "linear",
            delay: el.delay,
          }}
        >
          {el.symbol}
        </motion.div>
      ))}
      
      {/* Gradients to blend the background smoothly */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 dark:to-slate-950/50" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-lighten" />
    </div>
  );
}
