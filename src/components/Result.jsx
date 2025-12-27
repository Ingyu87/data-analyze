import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import ChartRender from './ChartRender';
import AIPrincipleAccordion from './AIPrincipleAccordion';
import { getAIPrincipleExplanation } from '../utils/aiPrincipleExplainer';
import { generateDynamicExample } from '../utils/aiPrincipleExampleGenerator';
import { generateQuestions, generateCorrelationQuestions } from '../utils/questionGenerator';
import { generateReportPNG } from '../utils/reportGenerator';
import Quiz from './Quiz';

const Result = ({ analysisResult, onReset, stagedFiles }) => {
  const { RefreshCw, Download } = Icons;
  const [chartType, setChartType] = useState('line');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [dynamicExamples, setDynamicExamples] = useState({});
  
  // 동적 예시 생성
  useEffect(() => {
    if (!analysisResult) return;
    
    const steps = analysisResult.type === 'single' 
      ? ['graph-visualization', 'trend-analysis', 'ai-explanation', 'prediction']
      : ['graph-visualization', 'trend-analysis', 'correlation-analysis', 'ai-explanation', 'prediction'];
    
    const loadExamples = async () => {
      const examples = {};
      for (const step of steps) {
        try {
          const example = await generateDynamicExample(step, analysisResult);
          if (example) {
            examples[step] = example;
          }
        } catch (error) {
          console.log(`예시 생성 실패 (${step}):`, error);
        }
      }
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
            {analysisResult.type === 'single' ? '미래 예언 (Future)' : '결속 확인 (Connection)'}
          </h3>
          {analysisResult.type === 'single' && (
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  chartType === 'line'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                }`}
              >
                꺾은선 그래프
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  chartType === 'bar'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                }`}
              >
                막대 그래프
              </button>
            </div>
          )}
        </div>
        <div id="chart-div" className="w-full h-[400px] bg-black/20 rounded-lg mb-4"></div>
        <ChartRender data={analysisResult} chartType={chartType} />
        
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
      
      {!showQuiz && !quizResults && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">📚 그래프 해석 문제</h3>
          <p className="text-purple-200 text-center mb-6">
            초등학교 4학년 수준의 문제를 풀어보세요!
          </p>
          <button
            onClick={() => setShowQuiz(true)}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg transition"
          >
            문제 풀기 (2문제)
          </button>
        </div>
      )}

      {showQuiz && (
        <Quiz
          questions={questions}
          onComplete={handleQuizComplete}
          analysisResult={analysisResult}
        />
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


