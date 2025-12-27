import React from 'react';
import { Icons } from './Icons';
import AIPrincipleAccordion from './AIPrincipleAccordion';
import { getAIPrincipleExplanation } from '../utils/aiPrincipleExplainer';

const Staging = ({
  stagedFiles,
  onFileSelect,
  onRemoveFile,
  onStartExtraction,
  onPerformAlchemy,
  readyToStart,
  dragActive,
  onDrag,
  onDrop,
  onReset
}) => {
  const { CheckCircle, AlertTriangle, Play, Lock, Image, FileText, Crosshair, Trash, Plus } = Icons;

  return (
    <div
      className="glass-panel rounded-2xl p-8"
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CheckCircle className="text-green-400" /> 데이터 목록 ({stagedFiles.length}개)
        </h2>
        <label className="cursor-pointer bg-purple-900/50 hover:bg-purple-800 text-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 border border-purple-500/50 transition">
          <Plus size={16} /> <span>파일 추가하기</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.pdf,image/*,.txt"
            multiple
            onChange={onFileSelect}
            className="hidden"
          />
        </label>
      </div>

      <div
        className={`space-y-4 mb-8 min-h-[200px] ${
          dragActive ? 'border-2 border-dashed border-yellow-400 bg-yellow-400/10 rounded-lg p-4' : ''
        }`}
      >
        {stagedFiles.map((f) => (
          <div
            key={f.id}
            className="bg-black/40 rounded-lg p-4 flex justify-between items-center border border-purple-500/20 hover:border-purple-500/50 transition"
          >
            <div className="flex items-center gap-4 text-white">
              {f.type === 'image' ? (
                <Image className="text-yellow-400" />
              ) : (
                <FileText className="text-blue-400" />
              )}
              <div>
                <div className="font-bold">{f.name}</div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="uppercase bg-gray-700 px-1 rounded text-[10px]">{f.type}</span>
                  {f.status === 'ready' ? '분석 준비 완료' : '확인 필요'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {f.status === 'ready' ? (
                <div className="flex gap-2">
                  {(f.type === 'pdf' || f.type === 'image') && (
                    <button
                      onClick={() => onStartExtraction(f)}
                      className="text-xs bg-purple-900/50 hover:bg-purple-800 px-3 py-1 rounded text-purple-200 border border-purple-500"
                    >
                      다시 보기
                    </button>
                  )}
                  <span className="text-green-400 flex items-center gap-1 text-sm">
                    <CheckCircle size={16} /> 완료
                  </span>
                </div>
              ) : f.status === 'needs_extraction' ? (
                <button
                  onClick={() => onStartExtraction(f)}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-full animate-pulse shadow-lg"
                >
                  <Crosshair size={16} /> <span>그래프 찍기</span>
                </button>
              ) : (
                <span className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={16} /> {f.error}
                </span>
              )}
              <button
                onClick={() => onRemoveFile(f.id)}
                className="text-gray-500 hover:text-red-400 p-2"
              >
                <Trash size={18} />
              </button>
            </div>
          </div>
        ))}
        {stagedFiles.length === 0 && (
          <div className="text-center text-gray-500 py-10">파일이 없습니다. 추가해주세요.</div>
        )}
      </div>
      <div className="flex justify-between border-t border-purple-500/30 pt-4">
        <button onClick={onReset} className="text-red-300 hover:text-red-100 text-sm px-4">
          전체 비우기
        </button>
        {readyToStart ? (
          <button
            onClick={onPerformAlchemy}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105"
          >
            <Play size={20} /> 데이터 분석하기
          </button>
        ) : (
          <div className="text-gray-500 flex items-center gap-2">
            <Lock size={16} /> 데이터 부족
          </div>
        )}
      </div>
      
      {/* AI 원리 설명 */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-yellow-300 mb-4">🤖 이 단계에서 사용된 AI 원리</h3>
        <div className="space-y-2">
          <AIPrincipleAccordion step="file-upload" explanation={getAIPrincipleExplanation('file-upload')} />
          <AIPrincipleAccordion step="data-parsing" explanation={getAIPrincipleExplanation('data-parsing')} />
        </div>
      </div>
    </div>
  );
};

export default Staging;


