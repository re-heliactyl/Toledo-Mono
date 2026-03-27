import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState('loading');
  const { settings } = useSettings();

  // External trigger to complete the loading
  useEffect(() => {
    if (onComplete) {
      const handler = () => {
        // Start transition out
        setPhase('transitioning');
      };

      // Listen for the completion signal
      window.addEventListener('loadingComplete', handler);

      return () => {
        window.removeEventListener('loadingComplete', handler);
      };
    }
  }, [onComplete]);

  // Handle phase transition completion
  useEffect(() => {
    if (phase === 'transitioning') {
      const timer = setTimeout(() => {
        setPhase('complete');
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Return null when complete
  if (phase === 'complete') return null;

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          className="fixed inset-0 bg-[#101218] z-50 flex flex-col items-center justify-center"
          animate={{
            opacity: phase === 'transitioning' ? 0 : 1,
            y: phase === 'transitioning' ? -10 : 0
          }}
          transition={{
            duration: 0.4,
            ease: "easeInOut"
          }}
        >
          {/* Center Content */}
          <div className="flex flex-col items-center">
            {/* Spinner */}
            <div className="relative">
              <motion.div
                className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full"
                animate={{
                  rotate: 360
                }}
                transition={{
                  duration: 1.2,
                  ease: "linear",
                  repeat: Infinity
                }}
              />
            </div>

            <div className="relative text-center mt-6">
              <p className="text-white/70 text-center font-medium text-xs mb-1">
                {settings ? `Heliactyl Next v10.0.0 (Toledo)` : "Loading..."}
              </p>
              <p className="text-white/50 text-center text-xs">
                &copy; {new Date().getFullYear()} {settings?.name || "Heliactyl"}.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}