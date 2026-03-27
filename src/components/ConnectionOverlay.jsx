import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const ConnectionOverlay = ({ message = "Connecting to WebSocket..." }) => {
  return (
    <div className="fixed inset-0 bg-[#08090c] z-50 flex flex-col items-center justify-center">
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
      <h3 className="text-white text-lg mt-6 font-medium mb-2">{message}</h3>
      <p className="text-neutral-400 text-sm text-center">
        We're establishing a secure connection to your server. This should only take a moment.
      </p>
    </div>
  );
};

export default ConnectionOverlay;