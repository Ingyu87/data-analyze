import React, { useState } from 'react';

const AIPrincipleAccordion = ({ step, explanation, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedExplanation, setEditedExplanation] = useState(explanation?.explanation || '');
  const [editedExample, setEditedExample] = useState(explanation?.example || '');
  
  if (!explanation) return null;

  const handleSave = () => {
    if (onEdit) {
      onEdit({
        ...explanation,
        explanation: editedExplanation,
        example: editedExample
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedExplanation(explanation.explanation);
    setEditedExample(explanation.example);
    setIsEditing(false);
  };
  
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
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs bg-blue-800/50 px-2 py-1 rounded text-blue-200">
              {explanation.principle}
            </span>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition"
              >
                ✏️ 수정
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-purple-200 mb-1 block">설명:</label>
                <textarea
                  value={editedExplanation}
                  onChange={(e) => setEditedExplanation(e.target.value)}
                  className="w-full p-2 bg-purple-900/50 border border-purple-500/50 rounded text-sm text-purple-100"
                  rows={6}
                />
              </div>
              <div>
                <label className="text-xs text-purple-200 mb-1 block">💡 예시:</label>
                <textarea
                  value={editedExample}
                  onChange={(e) => setEditedExample(e.target.value)}
                  className="w-full p-2 bg-purple-900/50 border border-purple-500/50 rounded text-sm text-purple-100"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition"
                >
                  저장
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-purple-100 leading-relaxed whitespace-pre-line mb-3">
                {explanation.explanation}
              </div>
              <div className="bg-purple-900/30 p-2 rounded text-xs text-purple-200">
                <strong className="text-yellow-300">💡 예시:</strong> {explanation.example}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIPrincipleAccordion;



