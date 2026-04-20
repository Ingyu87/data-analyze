/** Legacy screen — not used by main.jsx; production flow is App.jsx. */
import React from 'react';

const Lockdown = ({ detectedBadWord, onReset }) => {
  return (
    <div className="flex items-center justify-center min-h-screen scolding-bg text-white font-sans">
      <div className="bg-red-950 border-4 border-red-600 p-10 rounded-2xl shadow-2xl max-w-2xl text-center">
        <div className="text-6xl mb-4 animate-bounce">🚨</div>
        <h1 className="text-4xl font-extrabold mb-6 text-red-200">멈추세요!</h1>
        <p className="text-xl mb-4">
          나쁜 말 감지: <span className="bg-red-600 px-2 rounded">"{detectedBadWord}"</span>
        </p>
        <button
          onClick={onReset}
          className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full"
        >
          반성하고 다시하기
        </button>
      </div>
    </div>
  );
};

export default Lockdown;




