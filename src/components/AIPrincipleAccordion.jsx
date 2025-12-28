import React, { useState } from 'react';

const AIPrincipleAccordion = ({ step, explanation }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!explanation) return null;
  
  return (
    <div className="border border-blue-500/30 rounded-lg mb-2 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-blue-900/20 hover:bg-blue-900/30 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{explanation.icon}</span>
          <span className="text-sm font-semibold text-blue-200">{explanation.title}</span>
        </div>
        <span className="text-blue-300 text-sm">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-blue-900/10 border-t border-blue-500/20">
          <div className="mb-2">
            <span className="text-xs bg-blue-800/50 px-2 py-1 rounded text-blue-200">
              {explanation.principle}
            </span>
          </div>
          <div className="text-sm text-purple-100 leading-relaxed whitespace-pre-line mb-3">
            {explanation.explanation}
          </div>
          <div className="bg-purple-900/30 p-2 rounded text-xs text-purple-200">
            <strong className="text-yellow-300">💡 예시:</strong> {explanation.example}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPrincipleAccordion;



