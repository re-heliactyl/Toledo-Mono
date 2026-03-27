import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function PageTransition({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress < 100 ? prevProgress + 10 : 100
      );
    }, 60);

    const timer = setTimeout(() => {
      setIsLoading(false);
      clearInterval(progressTimer);
    }, 600);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, []);

  // Updated page variants from the uploaded file
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: [0.16, 1, 0.3, 1], // Custom ease curve for subtle, professional feel
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.1,
        ease: [0.16, 1, 0.3, 1],
      }
    },
  };

  return (
    <div className="relative w-full min-h-[200px]">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="fixed inset-0 bg-transparent z-50 ml-72 flex flex-col items-center justify-center">
            {/* Top Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-0.5 bg-transparent">
              <div
                className="h-full bg-[#06b6ca] transition-all duration-1000 ease-out shadow-[0_0_8px_0.5px_#06b6ca]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Spinner from first component */}
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
            </div>
          </div>
        ) : (
          <motion.div
            key="content"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className="w-full"
            style={{
              transformOrigin: 'center',
              willChange: 'transform, opacity'
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}