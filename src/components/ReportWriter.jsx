import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { checkContentSafety } from '../utils/contentSafety';
import { generateReportFeedback } from '../utils/reportFeedback';
import { generateReportPDF } from '../utils/reportPDFGenerator';
import ChartRender from './ChartRender';

const ReportWriter = ({ analysisResult, onBack, stagedFiles }) => {
  const { ArrowLeft } = Icons;
  
  // analysisResult가 없으면 에러 메시지 표시
  if (!analysisResult) {
    return (
      <div className="glass-panel rounded-xl p-6">
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
      // 오류 발생 시 경고 없이 진행
      return true;
    }
  };
  
  const handleInputChange = (field, value) => {
    setReportData(prev => ({ ...prev, [field]: value }));
    // 그래프 타입 변경은 즉시 반영 (안전성 검사 불필요)
    if (field === 'selectedChartType') {
      return; // 그래프 타입은 안전성 검사 불필요
    }
    // 디바운싱을 위해 약간의 지연 후 검사
    setTimeout(() => {
      checkAndWarn(field, value);
    }, 800);
  };
  
  const handleSubmit = async () => {
    // 모든 필드 검증
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
    
    // 욕설 검사 (비동기)
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
  
  // 그래프 미리보기용 ref
  const chartContainerRef = useRef(null);
  
  // 디버깅: 컴포넌트가 렌더링되는지 확인
  useEffect(() => {
    console.log('ReportWriter rendered', { analysisResult: !!analysisResult, reportData });
  }, [analysisResult, reportData]);
  
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
            placeholder="보고서 제목을 작성해주세요"
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
            placeholder="왜 이 데이터를 선택했는지 작성해주세요"
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
            {['line', 'bar', 'pie', 'pictograph'].map((type) => {
              const chartNames = {
                line: '꺾은선 그래프',
                bar: '막대 그래프',
                pie: '원그래프',
                pictograph: '그림그래프'
              };
              const chartIcons = {
                line: '📈',
                bar: '📊',
                pie: '🥧',
                pictograph: '🎨'
              };
              return (
                <button
                  key={type}
                  onClick={() => handleInputChange('selectedChartType', type)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    reportData.selectedChartType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800'
                  }`}
                >
                  <span>{chartIcons[type]}</span>
                  <span>{chartNames[type]}</span>
                </button>
              );
            })}
          </div>
          
          {/* 그래프 미리보기 */}
          <div className="mb-4 p-4 bg-black/20 rounded-lg">
            <div id="report-chart-div" className="w-full h-[300px]"></div>
            {analysisResult && (
              <ChartRender 
                data={analysisResult} 
                chartType={reportData.selectedChartType}
                chartDivId="report-chart-div"
              />
            )}
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
            placeholder="왜 이 그래프를 선택했는지 작성해주세요"
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
          <textarea
            value={reportData.findings}
            onChange={(e) => handleInputChange('findings', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            rows={5}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
            placeholder="그래프를 보면서 알 수 있는 사실들을 작성해주세요"
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
          <textarea
            value={reportData.futurePrediction}
            onChange={(e) => handleInputChange('futurePrediction', e.target.value)}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            rows={4}
            className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
            placeholder="앞으로 어떻게 될지 예측해보세요"
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
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {isSubmitting ? '분석 중...' : '제출하기'}
          </button>
        </div>
      </div>
      
      {/* AI 피드백 */}
      {aiFeedback && (
        <div className="glass-panel rounded-xl p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-green-300 mb-4">🤖 AI 피드백</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 rounded-lg">
              <h4 className="text-green-200 font-semibold mb-2">잘한 점</h4>
              <p className="text-purple-100 whitespace-pre-line">{aiFeedback.strengths}</p>
            </div>
            <div className="p-4 bg-yellow-900/20 rounded-lg">
              <h4 className="text-yellow-200 font-semibold mb-2">개선할 점</h4>
              <p className="text-purple-100 whitespace-pre-line">{aiFeedback.improvements}</p>
            </div>
            <div className="p-4 bg-blue-900/20 rounded-lg">
              <h4 className="text-blue-200 font-semibold mb-2">추가 제안</h4>
              <p className="text-purple-100 whitespace-pre-line">{aiFeedback.suggestions}</p>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                📄 PDF로 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportWriter;

