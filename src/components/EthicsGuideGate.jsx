import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CORE_VALUE_COLORS,
  ETHICS_GUIDES,
  ETHICS_GUIDE_STORAGE_KEY,
} from '../constants/ethicsGuide';

const CoreValueBadge = ({ value }) => {
  const colors = CORE_VALUE_COLORS[value];
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${colors.bg} ${colors.text}`}
    >
      {value}
    </span>
  );
};

const EthicsGuideGate = ({ onAccept }) => {
  const scrollRef = useRef(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 48;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    if (atBottom) setHasScrolledToBottom(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();

    el.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const handleAccept = () => {
    sessionStorage.setItem(ETHICS_GUIDE_STORAGE_KEY, 'true');
    onAccept();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-8 flex items-start justify-center">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-orange-200">
          {/* 헤더 */}
          <div className="bg-orange-500 px-6 py-5 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              윤리 핵심가이드
            </h1>
            <p className="text-orange-100 text-sm mt-1">
              생성형 AI를 활용하기 전, 아래 가이드를 빠짐없이 읽어주세요.
            </p>
          </div>

          {/* 테이블 헤더 (데스크톱) */}
          <div className="hidden md:grid grid-cols-[140px_160px_1fr] bg-orange-50 border-b-2 border-orange-300 text-sm font-bold text-gray-700">
            <div className="px-4 py-3 border-r border-orange-200 text-center">핵심 가치</div>
            <div className="px-4 py-3 border-r border-orange-200 text-center">가이드</div>
            <div className="px-4 py-3 text-center">핵심 가이드</div>
          </div>

          {/* 가이드 목록 */}
          <div
            ref={scrollRef}
            className="max-h-[calc(100vh-280px)] md:max-h-[520px] overflow-y-auto"
          >
            {ETHICS_GUIDES.map((guide, index) => (
              <div
                key={guide.id}
                className={`border-b border-orange-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-orange-50/40'
                }`}
              >
                {/* 모바일 레이아웃 */}
                <div className="md:hidden p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {guide.coreValues.map((value) => (
                      <CoreValueBadge key={value} value={value} />
                    ))}
                  </div>
                  <div>
                    <span className="text-orange-600 font-bold text-sm">가이드 {guide.id}</span>
                    <span className="text-gray-500 text-sm mx-1">·</span>
                    <span className="text-gray-700 font-semibold text-sm">{guide.theme}</span>
                  </div>
                  <p className="font-bold text-gray-900 leading-snug">{guide.title}</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{guide.description}</p>
                </div>

                {/* 데스크톱 테이블 행 */}
                <div className="hidden md:grid grid-cols-[140px_160px_1fr] min-h-[120px]">
                  <div className="px-4 py-4 border-r border-orange-200 flex flex-col items-center justify-center gap-1.5">
                    {guide.coreValues.map((value) => (
                      <CoreValueBadge key={value} value={value} />
                    ))}
                  </div>
                  <div className="px-4 py-4 border-r border-orange-200 flex flex-col items-center justify-center text-center">
                    <span className="text-orange-600 font-bold">가이드 {guide.id}</span>
                    <span className="text-gray-700 font-semibold mt-1">{guide.theme}</span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="font-bold text-gray-900 mb-2 leading-snug">{guide.title}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{guide.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 하단 버튼 영역 */}
          <div className="px-4 md:px-6 py-5 bg-gray-50 border-t-2 border-orange-200">
            {!hasScrolledToBottom && (
              <p className="text-center text-sm text-orange-600 mb-3 font-medium">
                ↓ 아래로 스크롤하여 6개 가이드를 모두 확인해 주세요
              </p>
            )}
            <button
              type="button"
              onClick={handleAccept}
              disabled={!hasScrolledToBottom}
              className={`w-full py-4 px-4 rounded-xl font-bold text-base md:text-lg transition-all ${
                hasScrolledToBottom
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              나는 윤리 핵심가이드를 빠짐없이 읽고 이를 실천하겠습니다.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EthicsGuideGate;
