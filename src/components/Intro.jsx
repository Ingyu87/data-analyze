import React, { useState } from 'react';
import KosisSearch from './KosisSearch';
import { Icons } from './Icons';

const Intro = ({ onKosisDataSelect, onFileSelect, onDrag, onDrop, dragActive }) => {
  const { FileText, Upload } = Icons;
  const [activeTab, setActiveTab] = useState('kosis'); // 'kosis' or 'upload'

  return (
    <div className="w-full max-w-4xl">
      {/* 탭 선택 */}
      <div className="mb-6 flex gap-4 justify-center">
        <button
          onClick={() => setActiveTab('kosis')}
          className={`px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'kosis'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-purple-900/50 text-purple-200 border border-purple-500/50 hover:bg-purple-800'
          }`}
        >
          📊 KOSIS 검색
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-purple-900/50 text-purple-200 border border-purple-500/50 hover:bg-purple-800'
          }`}
        >
          📁 파일 업로드
        </button>
      </div>

      {/* KOSIS 검색 탭 */}
      {activeTab === 'kosis' && (
        <KosisSearch onDataSelect={onKosisDataSelect} />
      )}

      {/* 파일 업로드 탭 */}
      {activeTab === 'upload' && (
        <div className="glass-panel rounded-2xl p-12 animate-fade-in text-center">
          <div className="mb-8">
            <div className="mb-6 animate-float">
              <Upload className="w-32 h-32 text-blue-400 mx-auto drop-shadow-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <span className="text-blue-400 text-4xl">📁</span>
              파일 업로드
            </h2>
            <p className="text-purple-200 text-lg mb-2">
              CSV, Excel 파일을 업로드하여 분석하세요!
            </p>
            <p className="text-purple-300 text-sm mb-4">
              지원 형식: CSV, Excel (.xlsx, .xls), PDF, 이미지, 텍스트 파일
            </p>
          </div>

          {/* 파일 업로드 영역 */}
          <div
            className={`mb-6 p-12 border-2 border-dashed rounded-2xl transition ${
              dragActive
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-purple-500/50 bg-purple-900/20 hover:border-purple-400'
            }`}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
          >
            <FileText className="w-20 h-20 text-purple-400 mx-auto mb-4" />
            <p className="text-white text-lg mb-2 font-bold">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-purple-300 text-sm mb-4">
              또는 아래 버튼을 클릭하여 파일 선택
            </p>
            <label className="inline-block cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-8 py-4 rounded-lg hover:shadow-lg transition">
              <Upload className="inline-block mr-2" size={20} />
              파일 선택
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf,image/*,.txt"
                multiple
                onChange={onFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* KOSIS 다운로드 안내 */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-200 text-sm mb-2">
              💡 <strong>KOSIS에서 파일 다운로드:</strong>
            </p>
            <p className="text-blue-100 text-xs mb-3">
              통계 데이터를 CSV나 Excel 형식으로 다운로드하려면 KOSIS 국가통계포털을 이용하세요.
            </p>
            <a
              href="https://kosis.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition text-sm"
            >
              🌐 KOSIS 국가통계포털 열기
            </a>
          </div>

          {/* 사용 방법 */}
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-sm">
              💡 <strong>사용 방법:</strong>
            </p>
            <ul className="text-yellow-100 text-xs mt-2 space-y-1 list-disc list-inside text-left">
              <li>CSV나 Excel 파일을 준비하세요 (KOSIS에서 다운로드 가능)</li>
              <li>파일을 드래그하거나 "파일 선택" 버튼을 클릭하세요</li>
              <li>업로드된 파일은 자동으로 분석 준비가 됩니다</li>
              <li>여러 파일을 업로드하면 상관관계 분석이 가능합니다</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Intro;
