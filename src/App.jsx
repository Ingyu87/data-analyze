import React, { useState } from 'react';
import { extractTextFromExcel, readTextFile } from './utils/fileReaders';
import { parseTextToData } from './utils/dataParser';
import { analyzeSingleDataset } from './utils/analysis';
import ChartRender from './components/ChartRender';
import { generateAIExplanation } from './utils/aiService';
import { getAIPrincipleExplanation } from './utils/aiPrincipleExplainer';

const App = () => {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const reset = () => {
    setData(null);
    setAnalysis(null);
    setAiExplanation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔮 데이터 분석 도구</h1>
          <p className="text-purple-200">데이터를 업로드하면 자동으로 분석하고 시각화합니다</p>
        </header>

        {!data ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
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

            {/* AI 원리 */}
            {analysis && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">🧠 AI 원리 해석</h2>
                <div className="text-purple-100 space-y-4">
                  <div>
                    <h3 className="font-bold text-yellow-300 mb-2">선형 회귀 (Linear Regression)</h3>
                    <p>{getAIPrincipleExplanation('prediction', analysis)?.explanation || '데이터의 패턴을 찾아 미래를 예측하는 AI 원리입니다.'}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-300 mb-2">패턴 인식 (Pattern Recognition)</h3>
                    <p>데이터에서 반복되는 패턴을 찾아 미래를 예측합니다.</p>
                  </div>
                </div>
              </div>
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

