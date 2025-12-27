import React, { useState } from 'react';
import { Icons } from './Icons';
import KosisSearch from './KosisSearch';

const Intro = ({ onFileSelect, dragActive, onDrag, onDrop, onKosisDataSelect }) => {
  const { Upload } = Icons;
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'kosis'

  return (
    <div className="w-full max-w-4xl">
      {/* 탭 선택 */}
      <div className="flex gap-4 mb-6 justify-center">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
          }`}
        >
          📁 파일 업로드
        </button>
        <button
          onClick={() => setActiveTab('kosis')}
          className={`px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'kosis'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'bg-blue-900/50 text-blue-200 hover:bg-blue-800'
          }`}
        >
          📊 KOSIS 통계 검색
        </button>
      </div>

      {/* 파일 업로드 탭 */}
      {activeTab === 'upload' && (
        <div
          className="glass-panel rounded-2xl p-12 text-center animate-fade-in flex flex-col items-center"
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <div className="mb-8 animate-float">
            <img
              src="https://cdn-icons-png.flaticon.com/512/867/867902.png"
              alt="Alchemy"
              className="w-32 h-32 drop-shadow-2xl"
            />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white">데이터를 분석합니다</h2>
          <p className="text-purple-200 mb-8">
            PDF, 엑셀, CSV, 이미지까지.<br />
            깨진 글자도 자동으로 복구하여 분석합니다.
          </p>

          <label className={`cursor-pointer group relative w-full max-w-lg ${dragActive ? 'drag-active' : ''}`}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative px-12 py-10 bg-black rounded-lg flex flex-col items-center justify-center gap-4 hover:bg-gray-900 transition border-2 border-dashed border-gray-700 hover:border-purple-500">
              <Upload className="w-12 h-12 text-pink-500 animate-bounce" />
              <div className="text-center">
                <div className="text-gray-100 font-bold text-xl mb-2">파일을 끌어다 놓으세요</div>
                <div className="text-gray-400 text-sm">또는 클릭해서 선택 (여러 개 가능)</div>
                <div className="text-gray-500 text-xs mt-2">지원: 엑셀(XLSX, XLS), CSV, PDF, 이미지</div>
              </div>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,image/*,.txt"
              multiple
              onChange={onFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* KOSIS 검색 탭 */}
      {activeTab === 'kosis' && (
        <KosisSearch onDataSelect={onKosisDataSelect} />
      )}
    </div>
  );
};

export default Intro;


