import React from 'react';

const Preloader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <img 
            src="https://imgur.com/a5YN48Z.jpg"
            alt="MIYAKY HOTEL AND SUITES"
            className="w-24 h-24 mx-auto rounded-2xl border-4 border-white shadow-lg object-cover animate-pulse"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">MIYAKY HOTEL AND SUITES</h1>
        <div className="flex justify-center space-x-1">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;