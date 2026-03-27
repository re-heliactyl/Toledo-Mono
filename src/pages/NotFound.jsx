import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#101218] min-h-screen flex items-center justify-center p-4">
      <div className="text-sm text-gray-300 font-medium">
        404 | This page could not be found.
      </div>
    </div>
  );
};

export default NotFound;