import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { checkContentSafety } from '../utils/contentSafety';
import { generateReportFeedback } from '../utils/reportFeedback';
import { generateReportPDF } from '../utils/reportPDFGenerator';
import ChartRender from './ChartRender';
import AIPrincipleAccordion from './AIPrincipleAccordion';
import { getAIPrincipleExplanation } from '../utils/aiPrincipleExplainer';

const ReportWriter = ({ analysisResult, onBack, stagedFiles }) => {
  const { ArrowLeft } = Icons;
  
  // 모든 hooks를 먼저 선언 (React hooks 규칙)
  const [reportData, setReportData] = useState({
    title: '',
    dataSelectionReason: '',
    selectedChartType: 'line',
    chartSelectionReason: '',
    findings: '',
    futurePrediction: ''
  });
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState({});
  const [isChartRendering, setIsChartRendering] = useState(false);
  const chartContainerRef = useRef(null);
  
  // 디버깅 로그
  useEffect(() => {
    console.log('ReportWriter 마운트됨', { 
      hasAnalysisResult: !!analysisResult, 
      datasetLength: analysisResult?.dataset?.length 
    });
  }, [analysisResult]);
  
  // analysisResult가 없으면 에러 메시지 표시 (hooks 이후에 조건부 렌더링)
  if (!analysisResult) {
    return (
      <div className="glass-panel rounded-xl p-6 w-full">
        <p className="text-red-400 text-center">데이터 분석 결과가 없습니다. 먼저 데이터를 분석해주세요.</p>
        <button
          onClick={onBack}
          className="mt-4 w-full bg-gray-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-700 transition"
        >
          돌아가기
        </button>
      </div>
    );
  }
  
  // 복사/붙여넣기 방지
  const handlePaste = (e) => {
    e.preventDefault();
    alert('복사 붙여넣기는 사용할 수 없습니다. 직접 작성해주세요.');
  };
  
  const handleCopy = (e) => {
    e.preventDefault();
    alert('복사는 사용할 수 없습니다.');
  };
  
  const handleCut = (e) => {
    e.preventDefault();
    alert('잘라내기는 사용할 수 없습니다.');
  };
  
  // 욕설 필터링 (AI 기반 동적 검사)
  const checkAndWarn = async (field, value) => {
    if (!value || value.trim() === '') {
      setWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[field];
        return newWarnings;
      });
      return true;
    }

    try {
      const safetyCheck = await checkContentSafety(value);
      if (!safetyCheck.safe) {
        setWarnings(prev => ({
          ...prev,
          [field]: `부적절한 내용이 포함되어 있습니다. ${safetyCheck.reason || '다시 작성해주세요.'}`
        }));
        return false;
      } else {
        setWarnings(prev => {
          const newWarnings = { ...prev };
          delete newWarnings[field];
          return newWarnings;
        });
        return true;
      }
    } catch (error) {
      console.error('안전성 검사 오류:', error);
      return true;
    }
  };
  
  const handleInputChange = (field, value) => {
    setReportData(prev => ({ ...prev, [field]: value }));
    if (field === 'selectedChartType') {
      return;
    }
    setTimeout(() => {
      checkAndWarn(field, value);
    }, 800);
  };
  
  const handleSubmit = async () => {
    if (!reportData.title.trim()) {
      alert('제목을 작성해주세요.');
      return;
    }
    if (!reportData.dataSelectionReason.trim()) {
      alert('데이터 선정 이유를 작성해주세요.');
      return;
    }
    if (!reportData.chartSelectionReason.trim()) {
      alert('그래프 선택 이유를 작성해주세요.');
      return;
    }
    if (!reportData.findings.trim()) {
      alert('그래프를 통해 알 수 있는 사실을 작성해주세요.');
      return;
    }
    if (!reportData.futurePrediction.trim()) {
      alert('미래 예측을 작성해주세요.');
      return;
    }
    
    const allFields = Object.keys(reportData);
    for (const field of allFields) {
      const isSafe = await checkAndWarn(field, reportData[field]);
      if (!isSafe) {
        alert('부적절한 내용이 포함되어 있습니다. 다시 확인해주세요.');
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const feedback = await generateReportFeedback(reportData, analysisResult);
      setAiFeedback(feedback);
    } catch (error) {
      console.error('피드백 생성 오류:', error);
      alert('피드백 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    try {
      await generateReportPDF(reportData, analysisResult, aiFeedback);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };
  
  // 그래프 타입 정보
  const chartTypes = {
    line: { name: '꺾은선 그래프', icon: '📈', desc: '시간에 따른 변화를 보여줘요' },
    bar: { name: '막대 그래프', icon: '📊', desc: '항목별 크기를 비교해요' },
    pie: { name: '원그래프', icon: '🥧', desc: '전체에서 각 부분의 비율을 보여줘요' },
    pictograph: { name: '그림그래프', icon: '🎨', desc: '그림으로 수량을 표현해요' }
  };
  
  return (
    <div className="space-y-6 animate-fade-in-up pb-12 w-full">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-white hover:text-purple-300 transition flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span>돌아가기</span>
        </button>
        <h2 className="text-2xl font-bold text-white">📝 보고서 작성</h2>
      </div>
      
      <div className="glass-panel rounded-xl p-6 space-y-6">
        {/* 제목 */}
        <div>
          <label className="block text-white font-semibold mb-2">
            제목 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={reportData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
            placeholder="보고서 제목을 작성해주세요 (예: 우리 반 키 조사 보고서)"
          />
          {warnings.title && (
            <p className="text-red-400 text-sm mt-1">{warnings.title}</p>
          )}
        </div>
        
        {/* 데이터 선정 이유 */}
        <div>
          <label className="block text-white font-semibold mb-2">
            데이터 선정 이유 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reportData.dataSelectionReason}
            onChange={(e) => handleInputChange('dataSelectionReason', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            rows={4}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
            placeholder="왜 이 데이터를 선택했는지 작성해주세요 (예: 우리 반 친구들의 키가 궁금해서 조사했어요)"
          />
          {warnings.dataSelectionReason && (
            <p className="text-red-400 text-sm mt-1">{warnings.dataSelectionReason}</p>
          )}
        </div>
        
        {/* 그래프 선택 */}
        <div>
          <label className="block text-white font-semibold mb-2">
            그래프 선택 <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {Object.entries(chartTypes).map(([type, info]) => (
              <button
                key={type}
                onClick={() => handleInputChange('selectedChartType', type)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition flex flex-col items-center justify-center gap-1 ${
                  reportData.selectedChartType === type
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                }`}
              >
                <span className="text-2xl">{info.icon}</span>
                <span className="font-bold">{info.name}</span>
                <span className="text-xs opacity-75">{info.desc}</span>
              </button>
            ))}
          </div>
          
          {/* 그래프 미리보기 */}
          <div className="mb-4 p-4 bg-black/30 rounded-lg border border-purple-500/30" ref={chartContainerRef}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-purple-200 font-semibold text-sm">📊 그래프 미리보기</h4>
              {isChartRendering && (
                <span className="text-purple-300 text-xs animate-pulse">그래프 그리는 중...</span>
              )}
            </div>
            <div id="report-chart-div" className="w-full h-[300px] bg-black/20 rounded-lg relative">
              {isChartRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                </div>
              )}
            </div>
            <ChartRender 
              data={analysisResult} 
              chartType={reportData.selectedChartType}
              chartDivId="report-chart-div"
              onRenderingChange={setIsChartRendering}
            />
            
            {/* 그래프 읽는 법 힌트 */}
            <div className="mt-3 p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
              <p className="text-yellow-200 text-xs font-semibold mb-1">💡 이 그래프에서 알 수 있는 것:</p>
              {reportData.selectedChartType === 'line' && (
                <p className="text-purple-200 text-xs">선이 올라가면 숫자가 커지고, 내려가면 작아져요. 시간에 따른 변화를 알 수 있어요!</p>
              )}
              {reportData.selectedChartType === 'bar' && (
                <p className="text-purple-200 text-xs">막대가 길수록 숫자가 커요. 어떤 항목이 가장 큰지 한눈에 비교할 수 있어요!</p>
              )}
              {reportData.selectedChartType === 'pie' && (
                <p className="text-purple-200 text-xs">조각이 클수록 차지하는 비율이 높아요. 전체 중에서 각 부분이 얼마나 되는지 알 수 있어요!</p>
              )}
              {reportData.selectedChartType === 'pictograph' && (
                <p className="text-purple-200 text-xs">그림이 많을수록 숫자가 커요. 그림으로 수량을 쉽게 이해할 수 있어요!</p>
              )}
            </div>
          </div>
          
          {/* 그래프 선택 이유 */}
          <label className="block text-white font-semibold mb-2 mt-4">
            그래프 선택 이유 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reportData.chartSelectionReason}
            onChange={(e) => handleInputChange('chartSelectionReason', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            rows={3}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
            placeholder="왜 이 그래프를 선택했는지 작성해주세요 (예: 친구들 키를 비교하려고 막대그래프를 선택했어요)"
          />
          {warnings.chartSelectionReason && (
            <p className="text-red-400 text-sm mt-1">{warnings.chartSelectionReason}</p>
          )}
        </div>
        
        {/* 그래프를 통해 알 수 있는 사실 */}
        <div>
          <label className="block text-white font-semibold mb-2">
            그래프를 통해 알 수 있는 사실 <span className="text-red-400">*</span>
          </label>
          <div className="mb-2 p-2 bg-blue-900/20 rounded border border-blue-500/30">
            <p className="text-blue-200 text-xs">💡 힌트: 가장 큰 값은? 가장 작은 값은? 어떤 패턴이 보이나요?</p>
          </div>
          <textarea
            value={reportData.findings}
            onChange={(e) => handleInputChange('findings', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            rows={5}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
            placeholder="그래프를 보면서 알 수 있는 사실들을 작성해주세요 (예: 민수가 가장 키가 크고, 영희가 가장 작아요)"
          />
          {warnings.findings && (
            <p className="text-red-400 text-sm mt-1">{warnings.findings}</p>
          )}
        </div>
        
        {/* 미래 예측 */}
        <div>
          <label className="block text-white font-semibold mb-2">
            미래 예측 <span className="text-red-400">*</span>
          </label>
          <div className="mb-2 p-2 bg-green-900/20 rounded border border-green-500/30">
            <p className="text-green-200 text-xs">💡 힌트: 이 데이터가 계속된다면 앞으로 어떻게 될까요? 왜 그렇게 생각하나요?</p>
          </div>
          <textarea
            value={reportData.futurePrediction}
            onChange={(e) => handleInputChange('futurePrediction', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            rows={4}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
            placeholder="앞으로 어떻게 될지 예측해보세요 (예: 6학년이 되면 친구들 키가 더 커질 것 같아요)"
          />
          {warnings.futurePrediction && (
            <p className="text-red-400 text-sm mt-1">{warnings.futurePrediction}</p>
          )}
        </div>
        
        {/* 제출 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                AI 선생님이 읽고 있어요...
              </>
            ) : (
              <>
                ✨ AI 선생님께 검사 받기
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* 보고서 작성 과정의 AI 원리 */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-blue-500">
        <h3 className="text-xl font-bold text-blue-300 mb-4">🧠 보고서 작성에서 사용된 AI 원리</h3>
        <p className="text-purple-200 mb-4 text-sm">
          보고서를 작성하는 과정에서도 AI 원리가 사용되고 있어요!
        </p>
        <div className="space-y-2">
          <AIPrincipleAccordion 
            step="ai-explanation" 
            explanation={getAIPrincipleExplanation('ai-explanation', analysisResult)} 
          />
        </div>
      </div>

      {/* AI 피드백 */}
      {aiFeedback && (
        <div className="glass-panel rounded-xl p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-green-300 mb-4">🤖 AI 선생님의 피드백</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
              <h4 className="text-green-200 font-semibold mb-2 flex items-center gap-2">
                <span>👍</span> 잘한 점
              </h4>
              <p className="text-purple-100 whitespace-pre-line">{aiFeedback.strengths || '잘 작성했어요!'}</p>
            </div>
            <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
              <h4 className="text-yellow-200 font-semibold mb-2 flex items-center gap-2">
                <span>💡</span> 더 좋아질 수 있는 점
              </h4>
              <p className="text-purple-100 whitespace-pre-line">{aiFeedback.improvements || '조금 더 자세히 쓰면 좋겠어요!'}</p>
            </div>
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <h4 className="text-blue-200 font-semibold mb-2 flex items-center gap-2">
                <span>🌟</span> 추가 제안
              </h4>
              <p className="text-purple-100 whitespace-pre-line">{aiFeedback.suggestions || '다른 데이터도 분석해보면 어떨까요?'}</p>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>📄</span> PDF로 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportWriter;
