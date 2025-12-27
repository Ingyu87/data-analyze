import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import ChartRender from './ChartRender';
import AIPrincipleAccordion from './AIPrincipleAccordion';
import ReportWriter from './ReportWriter';
import { getAIPrincipleExplanation } from '../utils/aiPrincipleExplainer';
import { generateDynamicExample } from '../utils/aiPrincipleExampleGenerator';
import { generateQuestions, generateCorrelationQuestions } from '../utils/questionGenerator';
import { generateReportPNG } from '../utils/reportGenerator';
import { getChartTypeInfo, getRecommendedChartType } from '../utils/chartTypeExplainer';
import Quiz from './Quiz';

const Result = ({ analysisResult, onReset, stagedFiles }) => {
  const { RefreshCw, Download } = Icons;
  const [chartType, setChartType] = useState(() => 
    analysisResult ? getRecommendedChartType(analysisResult) : 'line'
  );
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [showReportWriter, setShowReportWriter] = useState(false);
  const [dynamicExamples, setDynamicExamples] = useState({});
  const [showChartExplanation, setShowChartExplanation] = useState(true);
  const [isChartRendering, setIsChartRendering] = useState(false);
  
  // 동적 예시 생성
  useEffect(() => {
    if (!analysisResult) return;
    
    const steps = analysisResult.type === 'single' 
      ? ['graph-visualization', 'trend-analysis', 'ai-explanation', 'prediction']
      : ['graph-visualization', 'trend-analysis', 'correlation-analysis', 'ai-explanation', 'prediction'];
    
    const loadExamples = async () => {
      const examples = {};
      // 병렬로 실행하여 성능 개선
      const promises = steps.map(async (step) => {
        try {
          const example = await generateDynamicExample(step, analysisResult);
          return { step, example };
        } catch (error) {
          console.log(`예시 생성 실패 (${step}):`, error);
          return { step, example: null };
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(({ step, example }) => {
        if (example) {
          examples[step] = example;
        }
      });
      
      setDynamicExamples(examples);
    };
    
    loadExamples();
  }, [analysisResult]);
  
  // 문제 생성
  const questions = React.useMemo(() => {
    if (!analysisResult) return [];
    if (analysisResult.type === 'single') {
      return generateQuestions(analysisResult);
    } else {
      return generateCorrelationQuestions(analysisResult);
    }
  }, [analysisResult]);
  
  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setShowQuiz(false);
  };
  
  const handleDownloadReport = async () => {
    try {
      await generateReportPNG(analysisResult, quizResults, stagedFiles);
    } catch (error) {
      console.error('보고서 생성 실패:', error);
      alert('보고서 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* 그래프 섹션 */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">📊</span>{' '}
            {analysisResult.type === 'single' ? '데이터 시각화' : '상관관계 분석'}
          </h3>
          {analysisResult.type === 'single' && (
            <div className="flex flex-wrap gap-2">
              {['line', 'bar', 'pie', 'pictograph'].map((type) => {
                const info = getChartTypeInfo(type, analysisResult);
                return (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                      chartType === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                    }`}
                    title={info.description}
                  >
                    <span>{info.icon}</span>
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div id="chart-div" className="w-full h-[400px] bg-black/20 rounded-lg mb-4 relative">
          {isChartRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg z-10 backdrop-blur-sm">
              <div className="text-center">
                {/* 물결선 애니메이션 */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-400/30"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-purple-500/50 animate-pulse"></div>
                  <div className="absolute inset-4 rounded-full bg-purple-400/20 animate-pulse"></div>
                </div>
                <p className="text-purple-200 text-sm font-medium">그래프를 그리고 있어요...</p>
                <p className="text-purple-300 text-xs mt-2">데이터가 많으면 시간이 걸릴 수 있어요</p>
              </div>
            </div>
          )}
          {!isChartRendering && analysisResult && analysisResult.type === 'single' && (!analysisResult.dataset || analysisResult.dataset.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
              <p className="text-purple-300 text-sm">데이터를 불러오는 중...</p>
            </div>
          )}
        </div>
        <ChartRender 
          data={analysisResult} 
          chartType={chartType} 
          chartDivId="chart-div"
          onRenderingChange={setIsChartRendering}
        />
        
        {/* 그래프 축 설명 - 초등학생 눈높이 */}
        {analysisResult.type === 'single' && analysisResult.dataset && analysisResult.dataset.length > 0 && (
          <div className="mt-4 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
            <h4 className="text-purple-200 font-bold mb-3 text-lg">📐 그래프 읽는 방법</h4>
            
            {/* 축 설명 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 font-bold text-sm mb-1">➡️ 가로축 (아래쪽)</p>
                <p className="text-purple-100 text-sm">
                  <strong className="text-yellow-300">{analysisResult.xLabel || '항목'}</strong>을 보여줘요
                </p>
                <p className="text-purple-300 text-xs mt-1">
                  예: {analysisResult.dataset[0]?.originalLabel || analysisResult.dataset[0]?.label || '첫 번째 항목'}
                </p>
              </div>
              <div className="p-3 bg-green-900/30 rounded-lg border border-green-500/30">
                <p className="text-green-300 font-bold text-sm mb-1">⬆️ 세로축 (왼쪽)</p>
                <p className="text-purple-100 text-sm">
                  <strong className="text-yellow-300">{analysisResult.yLabel || '값'}</strong>을 보여줘요
                </p>
                <p className="text-purple-300 text-xs mt-1">
                  숫자가 클수록 위로 올라가요!
                </p>
              </div>
            </div>
            
            {/* 숫자의 의미 - 실제 데이터 기반 설명 */}
            <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
              <p className="text-yellow-200 font-bold mb-3 text-base">💡 그래프 속 숫자가 말해주는 것</p>
              
              {/* 데이터 기반 구체적 설명 */}
              {(() => {
                const data = analysisResult.dataset;
                const maxItem = data.reduce((max, d) => d.value > max.value ? d : max, data[0]);
                const minItem = data.reduce((min, d) => d.value < min.value ? d : min, data[0]);
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const avg = total / data.length;
                
                return (
                  <div className="space-y-3">
                    {/* 가장 큰 값 */}
                    <div className="flex items-start gap-2 p-2 bg-green-900/30 rounded">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="text-green-300 font-bold text-sm">가장 큰 값</p>
                        <p className="text-purple-100 text-sm">
                          <strong className="text-yellow-300">{maxItem.originalLabel || maxItem.label}</strong>이(가) 
                          <strong className="text-green-300 text-lg mx-1">{maxItem.value.toLocaleString()}</strong>
                          {analysisResult.yLabel && <span>({analysisResult.yLabel})</span>}으로 가장 커요!
                        </p>
                      </div>
                    </div>
                    
                    {/* 가장 작은 값 */}
                    <div className="flex items-start gap-2 p-2 bg-red-900/30 rounded">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="text-red-300 font-bold text-sm">가장 작은 값</p>
                        <p className="text-purple-100 text-sm">
                          <strong className="text-yellow-300">{minItem.originalLabel || minItem.label}</strong>이(가) 
                          <strong className="text-red-300 text-lg mx-1">{minItem.value.toLocaleString()}</strong>
                          {analysisResult.yLabel && <span>({analysisResult.yLabel})</span>}으로 가장 작아요
                        </p>
                      </div>
                    </div>
                    
                    {/* 차이 */}
                    <div className="flex items-start gap-2 p-2 bg-purple-900/30 rounded">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="text-purple-300 font-bold text-sm">가장 큰 것과 작은 것의 차이</p>
                        <p className="text-purple-100 text-sm">
                          {maxItem.value.toLocaleString()} - {minItem.value.toLocaleString()} = 
                          <strong className="text-yellow-300 text-lg mx-1">{(maxItem.value - minItem.value).toLocaleString()}</strong>
                          만큼 차이가 나요!
                        </p>
                      </div>
                    </div>
                    
                    {/* 평균 */}
                    <div className="flex items-start gap-2 p-2 bg-blue-900/30 rounded">
                      <span className="text-2xl">📈</span>
                      <div>
                        <p className="text-blue-300 font-bold text-sm">전체 평균</p>
                        <p className="text-purple-100 text-sm">
                          모든 값을 더해서 나누면 평균은 약 
                          <strong className="text-blue-300 text-lg mx-1">{Math.round(avg).toLocaleString()}</strong>
                          {analysisResult.yLabel && <span>({analysisResult.yLabel})</span>}이에요
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* 그래프 타입별 읽는 법 */}
              <div className="mt-4 p-3 bg-black/30 rounded border border-purple-500/30">
                <p className="text-purple-200 font-bold text-sm mb-2">📖 {
                  chartType === 'line' ? '꺾은선 그래프' :
                  chartType === 'bar' ? '막대 그래프' :
                  chartType === 'pie' ? '원그래프' : '그림그래프'
                } 읽는 법:</p>
                {chartType === 'line' && (
                  <ul className="text-purple-100 text-sm space-y-1 list-none">
                    <li>📈 선이 <span className="text-green-300 font-bold">올라가면</span> → 숫자가 <span className="text-green-300 font-bold">커졌어요!</span></li>
                    <li>📉 선이 <span className="text-red-300 font-bold">내려가면</span> → 숫자가 <span className="text-red-300 font-bold">작아졌어요!</span></li>
                    <li>➡️ 선이 <span className="text-yellow-300 font-bold">평평하면</span> → 숫자가 <span className="text-yellow-300 font-bold">비슷해요!</span></li>
                  </ul>
                )}
                {chartType === 'bar' && (
                  <ul className="text-purple-100 text-sm space-y-1 list-none">
                    <li>📊 막대가 <span className="text-green-300 font-bold">길수록</span> → 숫자가 <span className="text-green-300 font-bold">커요!</span></li>
                    <li>📊 막대가 <span className="text-red-300 font-bold">짧을수록</span> → 숫자가 <span className="text-red-300 font-bold">작아요!</span></li>
                    <li>👀 막대 끝에 있는 숫자가 그 항목의 값이에요</li>
                  </ul>
                )}
                {chartType === 'pie' && (
                  <ul className="text-purple-100 text-sm space-y-1 list-none">
                    <li>🥧 조각이 <span className="text-green-300 font-bold">클수록</span> → 차지하는 비율이 <span className="text-green-300 font-bold">높아요!</span></li>
                    <li>🥧 조각이 <span className="text-red-300 font-bold">작을수록</span> → 차지하는 비율이 <span className="text-red-300 font-bold">낮아요!</span></li>
                    <li>💯 모든 조각을 합치면 100%가 돼요</li>
                  </ul>
                )}
                {chartType === 'pictograph' && (
                  <ul className="text-purple-100 text-sm space-y-1 list-none">
                    <li>🎨 그림이 <span className="text-green-300 font-bold">많을수록</span> → 숫자가 <span className="text-green-300 font-bold">커요!</span></li>
                    <li>🎨 그림이 <span className="text-red-300 font-bold">적을수록</span> → 숫자가 <span className="text-red-300 font-bold">작아요!</span></li>
                    <li>🔢 그림 개수를 세어보면 값을 알 수 있어요</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 그래프 선택 이유 설명 */}
        {showChartExplanation && analysisResult.type === 'single' && (
          <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getChartTypeInfo(chartType, analysisResult).icon}</span>
                <h4 className="text-blue-300 font-bold">
                  왜 {getChartTypeInfo(chartType, analysisResult).name}를 선택했나요?
                </h4>
              </div>
              <button
                onClick={() => setShowChartExplanation(false)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-purple-100 text-sm mb-3">
              {getChartTypeInfo(chartType, analysisResult).recommendation}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-green-900/20 p-2 rounded border border-green-500/30">
                <p className="text-green-300 font-semibold mb-1">✅ 장점</p>
                <ul className="list-disc list-inside space-y-1 text-purple-200">
                  {getChartTypeInfo(chartType, analysisResult).advantages.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
                <p className="text-yellow-300 font-semibold mb-1">⚠️ 단점</p>
                <ul className="list-disc list-inside space-y-1 text-purple-200">
                  {getChartTypeInfo(chartType, analysisResult).disadvantages.map((dis, idx) => (
                    <li key={idx}>{dis}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-purple-200 text-xs mt-2 italic">
              💡 다른 그래프 버튼을 눌러서 비교해보세요!
            </p>
          </div>
        )}
        
        {/* 그래프 관련 AI 원리 */}
        <div className="mt-4 pt-4 border-t border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-300">🤖 이 그래프에서 사용된 AI 원리</span>
          </div>
          <div className="space-y-1">
            <AIPrincipleAccordion 
              step="graph-visualization" 
              explanation={getAIPrincipleExplanation('graph-visualization', analysisResult, dynamicExamples['graph-visualization'])} 
            />
            <AIPrincipleAccordion 
              step="trend-analysis" 
              explanation={getAIPrincipleExplanation('trend-analysis', analysisResult, dynamicExamples['trend-analysis'])} 
            />
            {analysisResult.type === 'multi' && (
              <AIPrincipleAccordion 
                step="correlation-analysis" 
                explanation={getAIPrincipleExplanation('correlation-analysis', analysisResult, dynamicExamples['correlation-analysis'])} 
              />
            )}
          </div>
        </div>
      </div>
      
      {/* 데이터 설명 섹션 */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-yellow-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-yellow-200">📚 초등학생을 위한 쉬운 설명</h3>
        </div>
        <div className="text-purple-100 space-y-4 leading-relaxed">
          {analysisResult.type === 'single' ? (
            <>
              <div className="p-4 bg-purple-900/40 rounded border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-yellow-300 font-bold text-lg">📖 데이터 이야기</h4>
                  {analysisResult.aiEnhanced && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">AI 강화</span>
                  )}
                </div>
                <p className="mb-2">{analysisResult.childExplanation?.summary || analysisResult.trendDesc}</p>
                {analysisResult.childExplanation?.analogy && (
                  <p className="text-purple-200 italic">💡 {analysisResult.childExplanation.analogy}</p>
                )}
                {analysisResult.childExplanation?.detailedExplanation && (
                  <div className="mt-3 text-sm text-purple-200 whitespace-pre-line">
                    {analysisResult.childExplanation.detailedExplanation}
                  </div>
                )}
              </div>
              
              {analysisResult.childExplanation?.evidence && (
                <div className="p-4 bg-blue-900/30 rounded border border-blue-500/30">
                  <h4 className="text-blue-300 font-bold mb-2">🔍 근거</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysisResult.childExplanation.evidence.map((ev, idx) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="p-4 bg-green-900/30 rounded border border-green-500/30">
                <h4 className="text-green-300 font-bold mb-2">🔮 단기 미래 예측</h4>
                <p className="mb-2">
                  다음 단계에서는 숫자가 약{' '}
                  <span className="text-yellow-300 font-bold text-xl">
                    {analysisResult.predictionEvidence?.predictedValue || analysisResult.nextVal.toFixed(1)}
                  </span>
                  정도가 될 거예요!
                </p>
                {analysisResult.predictionEvidence?.evidence && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold mb-1">예측 근거:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analysisResult.predictionEvidence.evidence.map((ev, idx) => (
                        <li key={idx}>{ev}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-green-200">
                      신뢰도: {analysisResult.predictionEvidence.confidence}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-purple-900/40 rounded border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-yellow-300 font-bold text-lg">🤝 두 데이터의 관계</h4>
                  {analysisResult.aiEnhanced && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">AI 강화</span>
                  )}
                </div>
                <p className="mb-2 font-bold text-lg">{analysisResult.correlationExplanation?.relationship}</p>
                <p className="mb-2">{analysisResult.correlationExplanation?.explanation}</p>
                {analysisResult.correlationExplanation?.realWorldExample && (
                  <p className="text-purple-200 italic mt-2">
                    💡 {analysisResult.correlationExplanation.realWorldExample}
                  </p>
                )}
                {analysisResult.correlationExplanation?.detailedExplanation && (
                  <div className="mt-3 text-sm text-purple-200 whitespace-pre-line">
                    {analysisResult.correlationExplanation.detailedExplanation}
                  </div>
                )}
              </div>
              
              {analysisResult.correlationExplanation?.evidence && (
                <div className="p-4 bg-blue-900/30 rounded border border-blue-500/30">
                  <h4 className="text-blue-300 font-bold mb-2">🔍 근거</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysisResult.correlationExplanation.evidence.map((ev, idx) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="p-4 bg-green-900/30 rounded border border-green-500/30">
                <h4 className="text-green-300 font-bold mb-2">🔮 미래 예측</h4>
                {analysisResult.futurePrediction && (
                  <div>
                    <p className="mb-2">{analysisResult.futurePrediction}</p>
                    {analysisResult.futurePredictionEvidence && (
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                        {analysisResult.futurePredictionEvidence.map((ev, idx) => (
                          <li key={idx}>{ev}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-sm text-purple-300 mt-2">
                (상관계수: {analysisResult.correlation.toFixed(2)})
              </div>
              
              {/* 예측 관련 AI 원리 */}
              <div className="mt-4 pt-4 border-t border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-300">🤖 이 예측에서 사용된 AI 원리</span>
                </div>
                <AIPrincipleAccordion 
                  step="prediction" 
                  explanation={getAIPrincipleExplanation('prediction')} 
                />
              </div>
            </>
          )}
        </div>
        
        {/* 설명 관련 AI 원리 */}
        <div className="mt-4 pt-4 border-t border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-yellow-300">🤖 이 설명에서 사용된 AI 원리</span>
          </div>
          <AIPrincipleAccordion 
            step="ai-explanation" 
            explanation={getAIPrincipleExplanation('ai-explanation', analysisResult, dynamicExamples['ai-explanation'])} 
          />
        </div>
      </div>
      
      {/* 미래 예측 섹션 (단일 데이터셋의 경우) */}
      {analysisResult.type === 'single' && analysisResult.longTermPrediction && (
        <div className="glass-panel rounded-xl p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-green-200 mb-4">🔮 장기 미래 예측</h3>
          <div className="p-4 bg-green-900/30 rounded border border-green-500/30">
            <div className="space-y-2 text-sm">
              <p>
                <strong>10년 후:</strong> {analysisResult.longTermPrediction.prediction10Years}
                <span className="text-yellow-300 font-bold ml-2">
                  (예상값: {analysisResult.longTermPrediction.value10Years.toFixed(1)})
                </span>
              </p>
              <p>
                <strong>20년 후:</strong> {analysisResult.longTermPrediction.prediction20Years}
                <span className="text-yellow-300 font-bold ml-2">
                  (예상값: {analysisResult.longTermPrediction.value20Years.toFixed(1)})
                </span>
              </p>
              {analysisResult.longTermPrediction.reasons && (
                <div className="mt-2">
                  <p className="font-semibold mb-1">이유:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResult.longTermPrediction.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisResult.longTermPrediction.warning && (
                <p className="text-yellow-300 mt-2">{analysisResult.longTermPrediction.warning}</p>
              )}
            </div>
          </div>
          
          {/* 예측 관련 AI 원리 */}
          <div className="mt-4 pt-4 border-t border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-green-300">🤖 이 예측에서 사용된 AI 원리</span>
            </div>
            <AIPrincipleAccordion 
              step="prediction" 
              explanation={getAIPrincipleExplanation('prediction', analysisResult, dynamicExamples['prediction'])} 
            />
          </div>
        </div>
      )}
      
      {/* 문제와 보고서 버튼 - 상호 배타적이지 않음 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">📚 그래프 해석 문제</h3>
          <p className="text-purple-200 text-center mb-6">
            초등학교 4학년 수준의 문제를 풀어보세요!
          </p>
          {!showQuiz && !quizResults ? (
            <button
              onClick={() => setShowQuiz(true)}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg transition"
            >
              문제 풀기 (2문제)
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-green-300 text-center mb-2">✅ 문제를 풀고 있어요!</p>
              <button
                onClick={() => {
                  setShowQuiz(false);
                  setQuizResults(null);
                }}
                className="w-full bg-gray-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                문제 닫기
              </button>
            </div>
          )}
        </div>
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">📝 보고서 작성</h3>
          <p className="text-purple-200 text-center mb-6">
            데이터 분석 결과를 바탕으로 보고서를 작성해보세요!
          </p>
          {!showReportWriter ? (
            <button
              onClick={() => setShowReportWriter(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg transition"
            >
              보고서 작성하기
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-green-300 text-center mb-2">✅ 보고서를 작성하고 있어요!</p>
              <button
                onClick={() => setShowReportWriter(false)}
                className="w-full bg-gray-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                보고서 닫기
              </button>
            </div>
          )}
        </div>
      </div>

      {showQuiz && (
        <Quiz
          questions={questions}
          onComplete={handleQuizComplete}
          analysisResult={analysisResult}
        />
      )}

      {showReportWriter && analysisResult && (
        <div className="mt-6 w-full">
          <ReportWriter
            analysisResult={analysisResult}
            onBack={() => setShowReportWriter(false)}
            stagedFiles={stagedFiles}
          />
        </div>
      )}
      {showReportWriter && !analysisResult && (
        <div className="glass-panel rounded-xl p-6 mt-6">
          <p className="text-red-400 text-center mb-4">데이터 분석 결과가 없습니다. 먼저 데이터를 분석해주세요.</p>
          <button
            onClick={() => setShowReportWriter(false)}
            className="w-full bg-gray-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            돌아가기
          </button>
        </div>
      )}

      {quizResults && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">✅ 문제 풀이 완료!</h3>
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-yellow-300 mb-2">
              {quizResults.totalScore}점 / {quizResults.maxScore}점
            </div>
            <div className="text-purple-200">
              정답: {quizResults.correctCount}문제 / 전체: {quizResults.totalQuestions}문제
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4">
        {quizResults && (
          <button
            onClick={handleDownloadReport}
            className="text-white border border-green-500 bg-green-900/50 px-6 py-3 rounded-full hover:bg-green-800/50 flex gap-2 items-center"
          >
            <Download size={20} /> 결과 보고서 다운로드 (PNG)
          </button>
        )}
        <button
          onClick={onReset}
          className="text-white border border-purple-500 px-6 py-3 rounded-full hover:bg-purple-900/50 flex gap-2"
        >
          <RefreshCw /> 처음으로
        </button>
      </div>
    </div>
  );
};

export default Result;


