import React, { useState, useMemo } from 'react';
import { extractTextFromExcel, readTextFile } from './utils/fileReaders';
import { parseTextToData } from './utils/dataParser';
import { analyzeSingleDataset } from './utils/analysis';
import ChartRender from './components/ChartRender';
import { generateAIExplanation } from './utils/aiService';
import { getAIPrincipleExplanation } from './utils/aiPrincipleExplainer';
import AIPrincipleAccordion from './components/AIPrincipleAccordion';
import Quiz from './components/Quiz';
import ReportWriter from './components/ReportWriter';
import { generateQuestions } from './utils/questionGenerator';

const App = () => {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [showReportWriter, setShowReportWriter] = useState(false);
  const [dynamicExamples, setDynamicExamples] = useState({});
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState(null);
  const [originalAnalysis, setOriginalAnalysis] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('bar'); // 'bar' or 'line'

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // 파일 읽기
      let text = '';
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        text = await extractTextFromExcel(file);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        text = await readTextFile(file);
      } else {
        alert('지원하지 않는 파일 형식입니다. CSV, Excel, TXT 파일을 업로드해주세요.');
        setLoading(false);
        return;
      }

      // 데이터 파싱
      const parseResult = parseTextToData(text, file.name);
      if (!parseResult.success) {
        alert('데이터 파싱 실패: ' + parseResult.msg);
        setLoading(false);
        return;
      }

      const parsedData = parseResult.data;
      setData(parsedData);

      // 데이터 분석
      let dataset = [];
      if (parsedData.type === 'multi-series') {
        // 멀티 시리즈는 첫 번째 시리즈로 분석
        dataset = parsedData.series[0].data.map(p => ({ label: p.year, value: p.value }));
      } else {
        dataset = parsedData.data || [];
      }

      if (dataset.length > 0) {
        const analysisResult = analyzeSingleDataset(dataset);
        setAnalysis(analysisResult);
        setOriginalAnalysis(JSON.parse(JSON.stringify(analysisResult))); // 원본 저장
        setEditedAnalysis(null);
        setIsEditingAnalysis(false);

        // AI 설명 생성
        try {
          const aiExp = await generateAIExplanation({
            dataName: parsedData.name,
            slope: analysisResult.slope,
            avgValue: analysisResult.stats.avgValue,
            maxValue: analysisResult.stats.maxValue,
            minValue: analysisResult.stats.minValue,
            trend: analysisResult.analysis.direction,
            nextVal: analysisResult.nextVal,
            dataPoints: dataset.length
          });
          setAiExplanation(aiExp);
        } catch (error) {
          console.error('AI 설명 생성 실패:', error);
        }
      }
    } catch (error) {
      console.error('파일 처리 오류:', error);
      alert('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 문제 생성
  const questions = useMemo(() => {
    if (!analysis || !data) return [];
    const analysisResult = {
      type: 'single',
      dataset: data.type === 'multi-series' 
        ? data.series.flatMap(s => s.data.map(p => ({ 
            label: `${s.name} (${p.year})`, 
            value: p.value,
            originalLabel: s.name
          })))
        : (data.data || []),
      title: data.name,
      xLabel: data.xLabel || '항목',
      yLabel: data.yLabel || '값',
      ...analysis
    };
    return generateQuestions(analysisResult);
  }, [analysis, data]);

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setShowQuiz(false);
  };

  const reset = () => {
    setData(null);
    setAnalysis(null);
    setAiExplanation(null);
    setShowQuiz(false);
    setQuizResults(null);
    setShowReportWriter(false);
    setDynamicExamples({});
    setIsEditingAnalysis(false);
    setEditedAnalysis(null);
    setOriginalAnalysis(null);
    setSelectedChartType('bar');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 인공지능 원리로 익히는 자료와 가능성</h1>
          <p className="text-purple-200">데이터를 업로드하면 자동으로 분석하고 시각화합니다</p>
        </header>

        {!data ? (
          <div className="space-y-6">
            {/* KOSIS 통계놀이터 안내 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">📊 KOSIS 통계놀이터에서 데이터 수집하기</h2>
              
              <div className="space-y-4 text-purple-100">
                <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                  <h3 className="text-lg font-bold text-blue-300 mb-3">1단계: 관심있는 주제 검색</h3>
                  <p className="mb-2">KOSIS 통계놀이터에서 관심있는 통계 주제를 검색하세요.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    <li>예: "인구", "출생아", "지진", "육아휴직" 등</li>
                    <li>검색 결과에서 원하는 통계표를 선택하세요</li>
                  </ul>
                </div>

                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <h3 className="text-lg font-bold text-green-300 mb-3">2단계: 데이터 다운로드</h3>
                  <p className="mb-2">선택한 통계표에서 CSV나 Excel 파일을 다운로드하세요.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    <li>통계표 페이지에서 "다운로드" 버튼을 클릭하세요</li>
                    <li>CSV 또는 Excel 형식으로 저장하세요</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-500/30">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3">3단계: 파일 업로드</h3>
                  <p className="mb-2">다운로드한 파일을 아래 버튼을 클릭하여 업로드하세요.</p>
                  <p className="text-sm">업로드된 데이터는 자동으로 그래프로 시각화되고 분석됩니다!</p>
                </div>

                <div className="text-center">
                  <a
                    href="https://kosis.kr/edu/index/index.do?sso=ok"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition mb-4"
                  >
                    🌐 KOSIS 통계놀이터 열기
                  </a>
                </div>
              </div>

              {/* AI 원리 설명 - 데이터 수집 과정 */}
              <div className="mt-6 bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-bold text-purple-300 mb-3">🤖 이 과정에서 사용된 AI 원리</h3>
                <div className="space-y-2">
                  <AIPrincipleAccordion 
                    step="file-upload" 
                    explanation={getAIPrincipleExplanation('file-upload')} 
                  />
                  <AIPrincipleAccordion 
                    step="data-parsing" 
                    explanation={getAIPrincipleExplanation('data-parsing')} 
                  />
                </div>
              </div>
            </div>

            {/* 파일 업로드 섹션 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">📁 파일 업로드</h2>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition"
              >
                {loading ? '처리 중...' : '📁 파일 업로드'}
              </label>
              <p className="text-purple-200 mt-4">CSV, Excel, TXT 파일을 지원합니다</p>
              <p className="text-purple-300 text-sm mt-2">
                💡 KOSIS 통계놀이터에서 다운로드한 파일을 업로드하면<br/>
                엑셀이나 CSV에 있는 그래프를 그대로 재현하고 데이터를 분석해드립니다!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 통계 카드 */}
            {analysis && data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                  <p className="text-purple-200 text-sm font-medium mb-2">최고 기록 시점</p>
                  <h3 className="text-2xl font-bold text-blue-400">
                    {(() => {
                      const dataset = data.type === 'multi-series' 
                        ? data.series[0]?.data || []
                        : (data.data || []);
                      if (dataset.length === 0) return '-';
                      const maxItem = dataset.reduce((max, item) => {
                        return (item.value || 0) > (max.value || 0) ? item : max;
                      }, dataset[0]);
                      return `${maxItem.label || maxItem.year} (${maxItem.value?.toFixed(1) || 0})`;
                    })()}
                  </h3>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                  <p className="text-purple-200 text-sm font-medium mb-2">최저 기록 시점</p>
                  <h3 className="text-2xl font-bold text-red-400">
                    {(() => {
                      const dataset = data.type === 'multi-series' 
                        ? data.series[0]?.data || []
                        : (data.data || []);
                      if (dataset.length === 0) return '-';
                      const minItem = dataset.reduce((min, item) => {
                        return (item.value || Infinity) < (min.value || Infinity) ? item : min;
                      }, dataset[0]);
                      return `${minItem.label || minItem.year} (${minItem.value?.toFixed(1) || 0})`;
                    })()}
                  </h3>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                  <p className="text-purple-200 text-sm font-medium mb-2">평균 수치</p>
                  <h3 className="text-2xl font-bold text-white">
                    {analysis.stats.avgValue.toFixed(2)}
                  </h3>
                </div>
              </div>
            )}

            {/* 그래프 타입 선택 버튼 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">{data.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedChartType('bar')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      selectedChartType === 'bar'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                    }`}
                  >
                    📊 막대 그래프
                  </button>
                  <button
                    onClick={() => setSelectedChartType('line')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      selectedChartType === 'line'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                    }`}
                  >
                    📈 꺾은선 그래프
                  </button>
                </div>
              </div>
              
              {/* 선택된 그래프만 표시 */}
              <div id="chart" style={{ width: '100%', height: '400px' }}></div>
              <ChartRender
                data={{
                  type: data.type || 'single',
                  dataset: data.type === 'multi-series' 
                    ? data.series.flatMap(s => s.data.map(p => ({ label: `${s.name} (${p.year})`, value: p.value, originalLabel: s.name })))
                    : (data.data || []),
                  title: data.name,
                  xLabel: data.xLabel || '항목',
                  yLabel: data.yLabel || '값',
                  series: data.series,
                  years: data.years
                }}
                chartType={selectedChartType}
                chartDivId="chart"
              />
            </div>

            {/* 데이터 표 */}
            {data && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-purple-500/30">
                <div className="p-6 border-b border-purple-500/30">
                  <h2 className="text-xl font-bold text-white">상세 데이터 표</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-purple-900/30">
                        <th className="px-6 py-4 text-sm font-semibold text-purple-200 border-b border-purple-500/30">구분</th>
                        <th className="px-6 py-4 text-sm font-semibold text-purple-200 border-b border-purple-500/30">수치</th>
                        <th className="px-6 py-4 text-sm font-semibold text-purple-200 border-b border-purple-500/30">전기 대비 증감</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/20">
                      {(() => {
                        const dataset = data.type === 'multi-series' 
                          ? (data.series[0]?.data || []).map(p => ({ label: p.year, value: p.value }))
                          : (data.data || []);
                        return dataset.map((item, idx) => {
                          const prevValue = idx > 0 ? dataset[idx - 1].value : null;
                          const diff = prevValue !== null ? item.value - prevValue : null;
                          const isUp = diff !== null && diff > 0;
                          const isDown = diff !== null && diff < 0;
                          
                          return (
                            <tr key={idx} className="hover:bg-purple-900/20 transition-colors">
                              <td className="px-6 py-4 text-sm text-purple-100 font-medium">{item.label || item.year}</td>
                              <td className="px-6 py-4 text-sm text-white font-bold">{item.value?.toLocaleString() || 0}</td>
                              <td className="px-6 py-4 text-sm">
                                {diff !== null ? (
                                  <span className={`font-bold ${isUp ? 'text-blue-400' : isDown ? 'text-red-400' : 'text-gray-400'}`}>
                                    {isUp ? '▲' : isDown ? '▼' : '-'} {Math.abs(diff).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 분석 결과 */}
            {analysis && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">📊 분석 결과</h2>
                  <div className="flex gap-2">
                    {!isEditingAnalysis ? (
                      <button
                        onClick={() => {
                          setIsEditingAnalysis(true);
                          setEditedAnalysis(JSON.parse(JSON.stringify(analysis)));
                        }}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition text-sm"
                      >
                        ✏️ 수정하기
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setAnalysis(editedAnalysis);
                            setIsEditingAnalysis(false);
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition text-sm"
                        >
                          ✅ 저장하기
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingAnalysis(false);
                            setEditedAnalysis(null);
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition text-sm"
                        >
                          ❌ 취소
                        </button>
                        {originalAnalysis && (
                          <button
                            onClick={() => {
                              setAnalysis(JSON.parse(JSON.stringify(originalAnalysis)));
                              setEditedAnalysis(JSON.parse(JSON.stringify(originalAnalysis)));
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                          >
                            🔄 원본으로 복구
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {!isEditingAnalysis ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
                      <div>
                        <p className="text-purple-200 text-sm">트렌드</p>
                        <p className="text-xl font-bold">{analysis.analysis.direction}</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">평균값</p>
                        <p className="text-xl font-bold">{analysis.stats.avgValue.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">최대값</p>
                        <p className="text-xl font-bold">{analysis.stats.maxValue.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">예측값</p>
                        <p className="text-xl font-bold">{analysis.nextVal !== undefined && !isNaN(analysis.nextVal) ? analysis.nextVal.toFixed(1) : 'N/A'}</p>
                      </div>
                    </div>
                    <p className="text-purple-100 mt-4">{analysis.analysis.desc}</p>
                    
                    {/* 원본과 비교 표시 */}
                    {originalAnalysis && JSON.stringify(analysis) !== JSON.stringify(originalAnalysis) && (
                      <div className="mt-4 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                        <p className="text-blue-200 text-sm font-semibold mb-2">💡 AI 원본 분석과 비교</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-purple-200 mb-1">AI 원본:</p>
                            <p className="text-white">트렌드: {originalAnalysis.analysis.direction}</p>
                            <p className="text-white">예측값: {originalAnalysis.nextVal !== undefined && !isNaN(originalAnalysis.nextVal) ? originalAnalysis.nextVal.toFixed(1) : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-yellow-200 mb-1">내가 수정한 결과:</p>
                            <p className="text-white">트렌드: {analysis.analysis.direction}</p>
                            <p className="text-white">예측값: {analysis.nextVal !== undefined && !isNaN(analysis.nextVal) ? analysis.nextVal.toFixed(1) : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-purple-200 text-sm mb-2">트렌드</label>
                        <select
                          value={editedAnalysis?.analysis.direction || ''}
                          onChange={(e) => {
                            const newAnalysis = { ...editedAnalysis };
                            newAnalysis.analysis.direction = e.target.value;
                            // 트렌드에 맞는 설명 자동 업데이트
                            if (e.target.value.includes('상승')) {
                              newAnalysis.analysis.desc = '데이터가 점점 증가하는 추세입니다.';
                            } else if (e.target.value.includes('하강')) {
                              newAnalysis.analysis.desc = '데이터가 점점 감소하는 추세입니다.';
                            } else {
                              newAnalysis.analysis.desc = '데이터가 거의 변화하지 않습니다.';
                            }
                            setEditedAnalysis(newAnalysis);
                          }}
                          className="w-full px-3 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
                        >
                          <option value="급격한 상승">급격한 상승</option>
                          <option value="뚜렷한 상승">뚜렷한 상승</option>
                          <option value="완만한 상승">완만한 상승</option>
                          <option value="변화 없음">변화 없음</option>
                          <option value="완만한 하강">완만한 하강</option>
                          <option value="뚜렷한 하강">뚜렷한 하강</option>
                          <option value="급격한 하강">급격한 하강</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-purple-200 text-sm mb-2">평균값</label>
                        <input
                          type="number"
                          value={editedAnalysis?.stats.avgValue || ''}
                          onChange={(e) => {
                            const newAnalysis = { ...editedAnalysis };
                            newAnalysis.stats.avgValue = parseFloat(e.target.value) || 0;
                            setEditedAnalysis(newAnalysis);
                          }}
                          className="w-full px-3 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-purple-200 text-sm mb-2">최대값</label>
                        <input
                          type="number"
                          value={editedAnalysis?.stats.maxValue || ''}
                          onChange={(e) => {
                            const newAnalysis = { ...editedAnalysis };
                            newAnalysis.stats.maxValue = parseFloat(e.target.value) || 0;
                            setEditedAnalysis(newAnalysis);
                          }}
                          className="w-full px-3 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-purple-200 text-sm mb-2">예측값</label>
                        <input
                          type="number"
                          value={editedAnalysis?.nextVal !== undefined && !isNaN(editedAnalysis.nextVal) ? editedAnalysis.nextVal : ''}
                          onChange={(e) => {
                            const newAnalysis = { ...editedAnalysis };
                            newAnalysis.nextVal = parseFloat(e.target.value) || 0;
                            setEditedAnalysis(newAnalysis);
                          }}
                          className="w-full px-3 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-purple-200 text-sm mb-2">설명</label>
                      <textarea
                        value={editedAnalysis?.analysis.desc || ''}
                        onChange={(e) => {
                          const newAnalysis = { ...editedAnalysis };
                          newAnalysis.analysis.desc = e.target.value;
                          setEditedAnalysis(newAnalysis);
                        }}
                        rows={3}
                        className="w-full px-3 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
                        placeholder="분석 결과에 대한 설명을 작성해주세요"
                      />
                    </div>
                    <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                      <p className="text-yellow-200 text-xs">
                        💡 AI가 분석한 결과를 보고, 그래프를 직접 확인하면서 자신의 판단으로 수정해보세요!
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 검증 과정 AI 원리 설명 */}
                {isEditingAnalysis && (
                  <div className="mt-4 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                    <AIPrincipleAccordion 
                      step="validation" 
                      explanation={getAIPrincipleExplanation('validation', {
                        type: 'single',
                        dataset: data.type === 'multi-series' 
                          ? data.series.flatMap(s => s.data.map(p => ({ label: `${s.name} (${p.year})`, value: p.value })))
                          : (data.data || []),
                        ...analysis
                      })} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* AI 설명 */}
            {aiExplanation && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">🤖 AI 분석</h2>
                <div className="text-purple-100 space-y-4">
                  <p>{aiExplanation.summary}</p>
                  {aiExplanation.analogy && (
                    <p className="italic text-purple-200">💡 {aiExplanation.analogy}</p>
                  )}
                </div>
              </div>
            )}

            {/* AI 원리 - 전체 과정 설명 */}
            {analysis && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">🧠 AI 원리 해석</h2>
                <p className="text-purple-200 mb-4 text-sm">
                  이 데이터를 분석하는 과정에서 사용된 AI 원리들을 알아보세요!
                </p>
                <div className="space-y-2">
                  <AIPrincipleAccordion 
                    step="graph-visualization" 
                    explanation={getAIPrincipleExplanation('graph-visualization', {
                      type: 'single',
                      dataset: data.type === 'multi-series' 
                        ? data.series.flatMap(s => s.data.map(p => ({ label: `${s.name} (${p.year})`, value: p.value })))
                        : (data.data || []),
                      ...analysis
                    }, dynamicExamples['graph-visualization'])} 
                  />
                  <AIPrincipleAccordion 
                    step="trend-analysis" 
                    explanation={getAIPrincipleExplanation('trend-analysis', {
                      type: 'single',
                      dataset: data.type === 'multi-series' 
                        ? data.series.flatMap(s => s.data.map(p => ({ label: `${s.name} (${p.year})`, value: p.value })))
                        : (data.data || []),
                      ...analysis
                    }, dynamicExamples['trend-analysis'])} 
                  />
                  <AIPrincipleAccordion 
                    step="ai-explanation" 
                    explanation={getAIPrincipleExplanation('ai-explanation', {
                      type: 'single',
                      dataset: data.type === 'multi-series' 
                        ? data.series.flatMap(s => s.data.map(p => ({ label: `${s.name} (${p.year})`, value: p.value })))
                        : (data.data || []),
                      ...analysis
                    }, dynamicExamples['ai-explanation'])} 
                  />
                  <AIPrincipleAccordion 
                    step="prediction" 
                    explanation={getAIPrincipleExplanation('prediction', {
        type: 'single',
                      dataset: data.type === 'multi-series' 
                        ? data.series.flatMap(s => s.data.map(p => ({ label: `${s.name} (${p.year})`, value: p.value })))
                        : (data.data || []),
                      ...analysis
                    }, dynamicExamples['prediction'])} 
                  />
                </div>
                
                {/* 데이터 기반 원리 설명 */}
                <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                  <h3 className="text-lg font-bold text-purple-300 mb-3">💡 이 데이터로 배우는 AI 원리</h3>
                  <div className="text-purple-100 space-y-3 text-sm">
                    <p>
                      <strong className="text-yellow-300">1. 패턴 인식 (Pattern Recognition):</strong><br/>
                      이 데이터에서 "{analysis.analysis.direction}" 패턴을 찾아냈어요. 
                      컴퓨터가 숫자들을 보고 "아, 이건 점점 {analysis.analysis.direction.includes('상승') || analysis.analysis.direction.includes('증가') ? '커지는' : '작아지는'} 패턴이구나!"라고 알아챈 거예요.
                    </p>
                    <p>
                      <strong className="text-yellow-300">2. 선형 회귀 (Linear Regression):</strong><br/>
                      평균적으로 {Math.abs(analysis.slope).toFixed(1)}씩 변하는 패턴을 찾아서, 
                      다음 값이 {analysis.nextVal !== undefined && !isNaN(analysis.nextVal) ? analysis.nextVal.toFixed(1) : '예측 중'}이 될 것으로 예측했어요.
                    </p>
                    <p>
                      <strong className="text-yellow-300">3. 데이터 시각화 (Data Visualization):</strong><br/>
                      숫자들을 그래프로 그려서 눈으로 쉽게 이해할 수 있게 만들었어요. 
                      그래프를 보면 패턴이 한눈에 보이죠!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 문제(퀴즈) 섹션 */}
            {analysis && !showQuiz && !quizResults && questions.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">📚 그래프 해석 문제</h2>
                <p className="text-purple-200 mb-4">그래프를 보고 문제를 풀어보세요!</p>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  문제 풀기 시작하기
                </button>
        </div>
            )}

            {showQuiz && questions.length > 0 && (
              <Quiz
                questions={questions}
                onComplete={handleQuizComplete}
                analysisResult={{
                  type: 'single',
                  dataset: data.type === 'multi-series' 
                    ? data.series.flatMap(s => s.data.map(p => ({ 
                        label: `${s.name} (${p.year})`, 
                        value: p.value,
                        originalLabel: s.name
                      })))
                    : (data.data || []),
                  title: data.name,
                  xLabel: data.xLabel || '항목',
                  yLabel: data.yLabel || '값',
                  ...analysis
                }}
              />
            )}

            {/* 보고서 작성 섹션 */}
            {analysis && !showReportWriter && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">📝 보고서 작성</h2>
                <p className="text-purple-200 mb-4">그래프를 분석하고 보고서를 작성해보세요!</p>
                <button
                  onClick={() => setShowReportWriter(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  보고서 작성하기
                </button>
              </div>
            )}

            {showReportWriter && (
              <ReportWriter
                analysisResult={{
                  type: 'single',
                  dataset: data.type === 'multi-series' 
                    ? data.series.flatMap(s => s.data.map(p => ({ 
                        label: `${s.name} (${p.year})`, 
                        value: p.value,
                        originalLabel: s.name
                      })))
                    : (data.data || []),
                  title: data.name,
                  xLabel: data.xLabel || '항목',
                  yLabel: data.yLabel || '값',
                  ...analysis
                }}
                onBack={() => setShowReportWriter(false)}
                stagedFiles={[]}
              />
            )}

            <button
              onClick={reset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              🔄 새로 시작
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

