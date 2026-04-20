import React, { useState, useRef, useMemo } from 'react';
import { Icons } from './Icons';
import { checkContentSafety } from '../utils/contentSafety';
import { generateReportFeedback } from '../utils/reportFeedback';
import { generateReportPDF } from '../utils/reportPDFGenerator';
import ChartRender from './ChartRender';
import AIPrincipleAccordion from './AIPrincipleAccordion';
import { getAIPrincipleExplanation } from '../utils/aiPrincipleExplainer';
const ReportWriter = ({ analysisResult, onBack, stagedFiles, data, selectedDatasetIndex = 0 }) => {
  const { ArrowLeft } = Icons;
  
  // 모든 hooks를 먼저 선언 (React hooks 규칙)
  const [reportData, setReportData] = useState({
    title: '',
    dataSelectionReason: '',
    findings: '',
    questions: '',
    futurePrediction: ''
  });
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState({});
  const [isChartRendering, setIsChartRendering] = useState(false);
  const chartContainerRef = useRef(null);
  
  // 단계별 체크 상태
  const [checkedSteps, setCheckedSteps] = useState({
    'file-upload': false,
    'data-parsing': false,
    'graph-visualization': false,
    'trend-analysis': false,
    'ai-explanation': false,
    'prediction': false
  });
  
  const chartPreviewData = useMemo(() => {
    if (!data || !analysisResult) return null;
    const multi = data.type === 'multi-dataset';
    const ds = multi ? data.datasets[selectedDatasetIndex]?.data || [] : null;
    return {
      type: multi ? 'multi-dataset' : 'single',
      dataset: multi
        ? ds
        : data.type === 'multi-series'
          ? data.series.flatMap((s) =>
              s.data.map((p) => ({
                label: `${s.name} (${p.year})`,
                value: p.value,
                originalLabel: s.name,
              }))
            )
          : data.data || [],
      title: data.name,
      xLabel: data.xLabel || '항목',
      yLabel: multi
        ? data.datasets[selectedDatasetIndex]?.name || '값'
        : data.yLabel || '값',
    };
  }, [data, analysisResult, selectedDatasetIndex]);

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
    setTimeout(() => {
      checkAndWarn(field, value);
    }, 800);
  };
  
  // 단계 체크 핸들러
  const handleStepCheck = (step) => {
    setCheckedSteps(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };
  
  // 모든 필수 단계가 체크되었는지 확인
  const allStepsChecked = Object.values(checkedSteps).every(checked => checked);
  
  const handleSubmit = async () => {
    if (!allStepsChecked) {
      alert('모든 AI 원리 단계를 확인해주세요. 각 단계의 아코디언을 열어서 내용을 읽고 체크해주세요.');
      return;
    }
    
    if (!reportData.title.trim()) {
      alert('제목을 작성해주세요.');
      return;
    }
    if (!reportData.dataSelectionReason.trim()) {
      alert('데이터 선정 이유를 작성해주세요.');
      return;
    }
    if (!reportData.findings.trim()) {
      alert('그래프를 통해 알 수 있는 사실을 작성해주세요.');
      return;
    }
    if (!reportData.questions.trim()) {
      alert('그래프를 보고 만든 질문을 작성해주세요.');
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
      const feedback = await generateReportFeedback(reportData, analysisResult, null);
      setAiFeedback(feedback);
      // 보고서 제출 완료
    } catch (error) {
      console.error('피드백 생성 오류:', error);
      alert('피드백 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    try {
      await generateReportPDF(
        analysisResult,
        null,
        Array.isArray(stagedFiles) ? stagedFiles : [],
        aiFeedback,
        reportData
      );
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };
  
  // AI 원리 단계 정의
  const aiPrincipleSteps = [
    { key: 'file-upload', title: '1단계: 파일 읽기', required: true },
    { key: 'data-parsing', title: '2단계: 데이터 정리', required: true },
    { key: 'graph-visualization', title: '3단계: 그래프 만들기', required: true },
    { key: 'trend-analysis', title: '4단계: 패턴 찾기', required: true },
    { key: 'ai-explanation', title: '5단계: 쉬운 설명 만들기', required: true },
    { key: 'prediction', title: '6단계: 미래 예측', required: true }
  ];

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
      
      {/* AI 원리 단계별 체크 - 보고서 작성 전 필수 */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-blue-500">
        <h3 className="text-xl font-bold text-blue-300 mb-4">🧠 AI 원리 학습 (필수)</h3>
        <p className="text-purple-200 mb-4 text-sm">
          보고서를 작성하기 전에 각 단계에서 사용된 AI 원리를 학습해주세요. 각 단계를 열어서 읽고 체크해주세요!
        </p>
        <div className="space-y-2">
          {aiPrincipleSteps.map((step) => (
            <div key={step.key} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checkedSteps[step.key]}
                onChange={() => handleStepCheck(step.key)}
                className="mt-2 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <AIPrincipleAccordion 
                  step={step.key} 
                  explanation={getAIPrincipleExplanation(step.key, analysisResult)} 
                />
              </div>
            </div>
          ))}
        </div>
        {!allStepsChecked && (
          <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
            <p className="text-yellow-200 text-sm">
              ⚠️ 모든 AI 원리 단계를 확인하고 체크해주세요. 보고서 작성을 위해 필수입니다!
            </p>
          </div>
        )}
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
        
        {/* 그래프 미리보기 — chartPreviewData로 참조 안정화(입력할 때마다 차트가 덜리렌더) */}
          {chartPreviewData && chartPreviewData.dataset?.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-purple-200 font-semibold text-sm mb-4">📊 그래프 미리보기</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/20 min-h-[460px]">
                  <h3 className="text-xl font-bold mb-6 text-white flex items-center">
                    <span className="w-2 h-6 bg-blue-500 rounded-full mr-2"></span>
                    막대 그래프 (Bar Chart)
                  </h3>
                  <div className="chart-container min-h-[400px]">
                    <ChartRender
                      data={chartPreviewData}
                      chartType="bar"
                      chartDivId="report-chart-bar"
                      onRenderingChange={setIsChartRendering}
                    />
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/20 min-h-[460px]">
                  <h3 className="text-xl font-bold mb-6 text-white flex items-center">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full mr-2"></span>
                    꺾은선 그래프 (Line Chart)
                  </h3>
                  <div className="chart-container min-h-[400px]">
                    <ChartRender
                      data={chartPreviewData}
                      chartType="line"
                      chartDivId="report-chart-line"
                      onRenderingChange={setIsChartRendering}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
              <p className="text-yellow-200 text-sm">⚠️ 그래프 데이터를 불러올 수 없습니다. 데이터 분석을 먼저 완료해주세요.</p>
            </div>
          )}
        
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
        
        {/* 그래프를 보고 질문 만들기 */}
        <div>
          <label className="block text-white font-semibold mb-2">
            이 그래프를 보고 질문 만들기 <span className="text-red-400">*</span>
          </label>
          <div className="mb-2 p-2 bg-purple-900/20 rounded border border-purple-500/30">
            <p className="text-purple-200 text-xs">💡 힌트: 단답형 질문은 피하고, "왜?", "어떻게?", "무엇이 있을까?" 같은 탐구 질문을 만들어보세요.</p>
            <p className="text-purple-200 text-xs mt-1">예시: "미세먼지 그래프를 보고 미세먼지를 줄이기 위한 방안은 무엇이 있을까? 왜 줄어들고 있을까?"</p>
          </div>
          <textarea
            value={reportData.questions}
            onChange={(e) => handleInputChange('questions', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            rows={4}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
            placeholder="그래프를 보고 궁금한 점이나 탐구하고 싶은 질문을 작성해주세요 (예: 왜 이 데이터가 증가하고 있을까? 어떤 요인이 영향을 미쳤을까?)"
          />
          {warnings.questions && (
            <p className="text-red-400 text-sm mt-1">{warnings.questions}</p>
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
            disabled={isSubmitting || !allStepsChecked}
            className={`px-8 py-3 text-white font-bold rounded-lg hover:shadow-lg transition flex items-center gap-2 ${
              isSubmitting || !allStepsChecked
                ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                AI 선생님이 읽고 있어요...
              </>
            ) : !allStepsChecked ? (
              <>
                ⚠️ 모든 AI 원리 단계를 확인해주세요
              </>
            ) : (
              <>
                ✨ AI 선생님께 검사 받기
              </>
            )}
          </button>
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
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>📄</span> 보고서 PDF 다운로드
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportWriter;
