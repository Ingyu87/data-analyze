import React from 'react';
import { Icons } from './Icons';

const Extraction = ({
  activeFile,
  extractedPoints,
  imgScaleY,
  onImgScaleYChange,
  onCanvasClick,
  onResetPoints,
  onFinishExtraction,
  canvasRef
}) => {
  const { Crosshair } = Icons;

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
          <Crosshair /> 그래프 채굴 모드
        </h2>
        <div className="text-sm text-purple-200">
          최대값 설정:{' '}
          <input
            type="number"
            value={imgScaleY}
            onChange={(e) => onImgScaleYChange(Number(e.target.value))}
            className="w-16 bg-black border border-purple-500 rounded px-1 ml-1 text-white"
          />
        </div>
      </div>
      <div className="flex-grow bg-gray-900 rounded border border-purple-500/30 relative overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onClick={onCanvasClick}
          className="max-w-full shadow-2xl"
        />
        {extractedPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/50 bg-black/50">
            그래프의 점을 순서대로(왼쪽부터) 콕! 콕! 찍어주세요
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="text-white text-sm">
          찍은 점: <span className="text-yellow-400 font-bold">{extractedPoints.length}</span>개
        </div>
        <div className="flex gap-2">
          <button
            onClick={onResetPoints}
            className="px-4 py-2 text-red-300 hover:bg-red-900/30 rounded"
          >
            다시 찍기
          </button>
          <button
            onClick={onFinishExtraction}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg"
          >
            완료!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Extraction;


