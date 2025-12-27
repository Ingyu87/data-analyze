import React, { useState } from 'react';
import { Icons } from './Icons';
import { searchKosisStatistics, getKosisStatisticsData, convertKosisDataToAppFormat } from '../utils/kosisService';

const KosisSearch = ({ onDataSelect }) => {
  const { Search, Loader } = Icons;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const results = await searchKosisStatistics(searchQuery);
      console.log('검색 결과:', results);
      setSearchResults(results);
      if (results.length === 0) {
        setError('검색 결과가 없습니다. 다른 검색어를 시도해보세요.\n\n예: "출생아", "인구", "경제", "교육", "고용"');
      }
    } catch (err) {
      console.error('검색 오류:', err);
      let errorMessage = '검색 중 오류가 발생했습니다.';
      if (err.message) {
        errorMessage += '\n\n' + err.message;
      }
      if (err.message && err.message.includes('KOSIS_API_KEY')) {
        errorMessage += '\n\nVercel 환경변수에 KOSIS_API_KEY를 설정해주세요.';
      } else if (err.message && err.message.includes('API')) {
        errorMessage += '\n\nKOSIS API가 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
      }
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStatistics = async (statItem) => {
    setIsLoadingData(true);
    setError(null);

    try {
      // 통계표 ID 추출 (KOSIS API 응답 구조에 따라 여러 필드명 확인)
      const statId = statItem.TBL_ID || statItem.STATBL_ID || statItem.statId || statItem.id || statItem.STAT_ID;
      if (!statId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/components/KosisSearch.jsx:55',message:'Stat ID not found',data:{statItem,allKeys:Object.keys(statItem)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        throw new Error('통계표 ID를 찾을 수 없습니다');
      }

      // 통계 데이터 조회
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/components/KosisSearch.jsx:63',message:'Before getKosisStatisticsData',data:{statId,statItemKeys:Object.keys(statItem),orgId:statItem.ORG_ID,statId_field:statItem.STAT_ID},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      // 통계표 데이터 조회 시 추가 정보 전달
      const data = await getKosisStatisticsData(statId, {
        orgId: statItem.ORG_ID,
        statId: statItem.STAT_ID,
        tblId: statItem.TBL_ID
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/components/KosisSearch.jsx:65',message:'After getKosisStatisticsData',data:{hasData:!!data,dataType:typeof data,dataIsArray:Array.isArray(data),dataKeys:data&&!Array.isArray(data)?Object.keys(data):[],dataPreview:JSON.stringify(data)?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      if (!data) {
        throw new Error('데이터를 가져올 수 없습니다');
      }

      // 앱 형식으로 변환
      const converted = convertKosisDataToAppFormat(
        data,
        statItem.TBL_NM || statItem.STATBL_NM || statItem.statName || statItem.name || 'KOSIS 통계'
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/components/KosisSearch.jsx:75',message:'After convertKosisDataToAppFormat',data:{convertedSuccess:converted.success,convertedMsg:converted.msg,convertedData:converted.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
      // #endregion

      if (converted.success) {
        // 부모 컴포넌트에 데이터 전달
        onDataSelect(converted.data);
      } else {
        throw new Error(converted.msg || '데이터 변환 실패');
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-12 animate-fade-in text-center">
      <div className="mb-8">
        <div className="mb-6 animate-float">
          <img
            src="https://cdn-icons-png.flaticon.com/512/867/867902.png"
            alt="Data Analysis"
            className="w-32 h-32 drop-shadow-2xl mx-auto"
          />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
          <span className="text-blue-400 text-4xl">📊</span>
          KOSIS 국가통계포털 검색
        </h2>
        <p className="text-purple-200 text-lg mb-2">
          국가통계포털에서 통계 데이터를 검색하고 분석해보세요!
        </p>
        <p className="text-purple-300 text-sm">
          출생아, 인구, 경제, 교육 등 다양한 통계를 검색할 수 있습니다
        </p>
      </div>

      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="통계표 이름 또는 키워드를 입력하세요 (예: 출생아, 인구, 경제)"
              className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-purple-400"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>검색 중...</span>
              </>
            ) : (
              <>
                <Search size={20} />
                <span>검색</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          <h3 className="text-lg font-bold text-white">
            검색 결과 ({searchResults.length}개)
          </h3>
          {searchResults.map((item, idx) => {
            const statName = item.TBL_NM || item.STATBL_NM || item.statName || item.name || `통계표 ${idx + 1}`;
            const statId = item.TBL_ID || item.STATBL_ID || item.statId || item.id || item.STAT_ID;
            const orgName = item.ORG_NM || item.orgName || '';

            // KOSIS 다운로드 링크 생성
            const kosisUrl = item.TBL_VIEW_URL || item.LINK_URL || 
              (item.TBL_ID ? `https://kosis.kr/statHtml/statHtml.do?orgId=${item.ORG_ID}&tblId=${item.TBL_ID}` : null);

            return (
              <div
                key={statId || idx}
                className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg hover:border-purple-400 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-1">{statName}</h4>
                    {orgName && (
                      <p className="text-purple-300 text-sm mb-2">📌 {orgName}</p>
                    )}
                    {(item.STATBL_ENG_NM || item.TBL_ENG_NM) && (
                      <p className="text-purple-400 text-xs">{item.STATBL_ENG_NM || item.TBL_ENG_NM}</p>
                    )}
                    {item.STAT_NM && (
                      <p className="text-purple-400 text-xs">📊 {item.STAT_NM}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {kosisUrl ? (
                      <a
                        href={kosisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded border border-blue-400 transition"
                        title="KOSIS에서 파일 다운로드"
                      >
                        📥 다운로드
                      </a>
                    ) : (
                      <button
                        onClick={() => handleSelectStatistics(item)}
                        disabled={isLoadingData}
                        className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded border border-green-400 transition disabled:opacity-50"
                        title="데이터 직접 로드"
                      >
                        {isLoadingData ? '로딩...' : '📊 데이터 로드'}
                      </button>
                    )}
                    {isLoadingData && (
                      <Loader className="animate-spin text-blue-400" size={20} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 로딩 중 */}
      {isLoadingData && (
        <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg text-center">
          <Loader className="animate-spin text-blue-400 mx-auto mb-2" size={32} />
          <p className="text-blue-300">통계 데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 안내 */}
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            💡 <strong>사용 방법:</strong>
          </p>
          <ul className="text-yellow-100 text-xs mt-2 space-y-1 list-disc list-inside">
            <li>검색어를 입력하고 검색 버튼을 클릭하세요</li>
            <li>원하는 통계표를 클릭하면 자동으로 데이터가 로드됩니다</li>
            <li>로드된 데이터는 그래프로 시각화되어 분석됩니다</li>
            <li>📥 다운로드 버튼을 클릭하면 KOSIS에서 CSV/Excel 파일을 다운로드할 수 있습니다</li>
          </ul>
        </div>
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-200 text-sm mb-2">
            📁 <strong>파일 업로드도 가능합니다:</strong>
          </p>
          <p className="text-blue-100 text-xs">
            KOSIS에서 다운로드한 CSV나 Excel 파일을 직접 업로드하여 분석할 수 있습니다. 
            상단의 "파일 업로드" 탭을 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KosisSearch;

