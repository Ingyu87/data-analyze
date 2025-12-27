import React from 'react';
import { Icons } from './Icons';

const Intro = ({ onFileSelect, dragActive, onDrag, onDrop }) => {
  const { Upload } = Icons;

  return (
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
      <h2 className="text-3xl font-bold mb-4 text-white">모든 데이터를 연성합니다</h2>
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

      {/* 공공데이터 다운로드 링크 */}
      <div className="mt-8 w-full max-w-lg">
        <div className="text-gray-300 text-sm mb-3 font-semibold">📊 공공데이터 다운로드</div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://kosis.kr/edu/index/index.do?sso=ok"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white font-semibold hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-lg">📈</span>
            <span>KOSIS 통계놀이터</span>
            <span className="text-xs opacity-75 group-hover:opacity-100">↗</span>
          </a>
          <a
            href="https://www.data.go.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white font-semibold hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🏛️</span>
            <span>공공데이터포털</span>
            <span className="text-xs opacity-75 group-hover:opacity-100">↗</span>
          </a>
        </div>
        <p className="text-gray-400 text-xs mt-3 text-center">
          공공데이터를 다운로드하여 분석해보세요!
        </p>
      </div>
    </div>
  );
};

export default Intro;


