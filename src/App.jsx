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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔮 데이터 분석 도구</h1>
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
            {/* 그래프 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{data.name}</h2>
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
                chartType="line"
                chartDivId="chart"
              />
            </div>

            {/* 분석 결과 */}
            {analysis && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">📊 분석 결과</h2>
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

