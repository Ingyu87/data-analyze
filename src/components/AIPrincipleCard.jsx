import React from 'react';

const AIPrincipleCard = ({ step, explanation }) => {
  if (!explanation) return null;
  
  return (
    <div className="glass-panel rounded-xl p-6 mb-4 border-l-4 border-blue-500">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{explanation.icon}</span>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-blue-300 mb-2">{explanation.title}</h4>
          <div className="bg-blue-900/30 px-3 py-1 rounded-full inline-block mb-3">
            <span className="text-blue-200 text-sm font-semibold">{explanation.principle}</span>
          </div>
        </div>
      </div>
      
      <div className="text-purple-100 leading-relaxed mb-3 whitespace-pre-line">
        {explanation.explanation}
      </div>
      
      <div className="bg-purple-900/40 p-3 rounded-lg border border-purple-500/30">
        <p className="text-sm text-purple-200">
          <strong className="text-yellow-300">💡 예시:</strong> {explanation.example}
        </p>
      </div>
    </div>
  );
};

export default AIPrincipleCard;



