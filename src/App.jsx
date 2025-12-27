import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './components/Icons';
import Lockdown from './components/Lockdown';
import Intro from './components/Intro';
import Staging from './components/Staging';
import Extraction from './components/Extraction';
import Result from './components/Result';
import { checkSafety } from './utils/safety';
import { extractTextFromPDF, extractTextFromExcel, readTextFile, renderPageToCanvas } from './utils/fileReaders';
import { parseTextToData } from './utils/dataParser';
import { analyzeSingleDataset, analyzeCorrelation } from './utils/analysis';
import { 
  generateChildFriendlyExplanation, 
  generateCorrelationExplanation,
  generatePredictionEvidence,
  generateLongTermPrediction
} from './utils/explanation';
import {
  generateAIExplanation,
  generateAICorrelationExplanation
} from './utils/aiService';
import { generateQuestions, generateCorrelationQuestions } from './utils/questionGenerator';
import { generateReportPNG } from './utils/reportGenerator';
import Quiz from './components/Quiz';
import { APP_SIGNATURE, APP_CONFIG } from './constants';
import './App.css';

const App = () => {
  const [view, setView] = useState('intro');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [detectedBadWord, setDetectedBadWord] = useState('');
  const [readyToStart, setReadyToStart] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [activeFile, setActiveFile] = useState(null);
  const [extractedPoints, setExtractedPoints] = useState([]);
  const [imgScaleY, setImgScaleY] = useState(100);
  const canvasRef = useRef(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  const resetApp = () => {
    setStagedFiles([]);
    setAnalysisResult(null);
    setDetectedBadWord('');
    setReadyToStart(false);
    setView('intro');
  };

  const processFiles = async (files) => {
    const newFiles = [];
    for (let file of files) {
      const fNameCheck = checkSafety(file.name);
      if (!fNameCheck.safe) {
        setDetectedBadWord(fNameCheck.word);
        setView('lockdown');
        return;
      }

      let type = 'unknown';
      let status = 'checking';
      let error = '';
      let data = null;
      const ext = file.name.split('.').pop().toLowerCase();

      // 파일 타입 감지 (확장자 우선)
      if (ext === 'csv' || file.type === 'text/csv' || file.type === 'application/csv') {
        type = 'csv';
      } else if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type === 'application/pdf' || ext === 'pdf') {
        type = 'pdf';
      } else if (ext === 'xlsx' || ext === 'xls' || file.type.includes('sheet') || file.type.includes('excel')) {
        type = 'excel';
      } else if (ext === 'txt' || file.type === 'text/plain') {
        type = 'text';
      } else {
        type = 'text'; // 기본값
      }

      // 타입별 처리
      if (type === 'csv' || type === 'text') {
        // CSV/Text 파일 처리
        try {
          const text = await readTextFile(file);
          const parseRes = parseTextToData(text, file.name);
          if (parseRes.success) {
            status = 'ready';
            data = parseRes.data;
          } else if (parseRes.errorType === 'safety') {
            setDetectedBadWord(parseRes.word);
            setView('lockdown');
            return;
          } else {
            status = 'error';
            error = parseRes.msg || '데이터 파싱 실패';
          }
        } catch (err) {
          console.error('CSV/Text 읽기 오류:', err);
          status = 'error';
          error = '파일 읽기 실패';
        }
      } else if (type === 'image') {
        status = 'needs_extraction';
      } else if (type === 'pdf') {
        const text = await extractTextFromPDF(file);
        const parseRes = parseTextToData(text, file.name);
        if (parseRes.success) {
          status = 'ready';
          data = parseRes.data;
          data.hasVisual = true;
        } else if (parseRes.errorType === 'safety') {
          setDetectedBadWord(parseRes.word);
          setView('lockdown');
          return;
        } else {
          status = 'needs_extraction';
          error = '표 인식 실패 (직접 채굴)';
        }
      } else if (type === 'excel') {
        const text = await extractTextFromExcel(file);
        if (text) {
          const parseRes = parseTextToData(text, file.name);
          if (parseRes.success) {
            status = 'ready';
            data = parseRes.data;
          } else if (parseRes.errorType === 'safety') {
            setDetectedBadWord(parseRes.word);
            setView('lockdown');
            return;
          } else {
            status = 'error';
            error = '엑셀 데이터 형식 오류';
          }
        } else {
          status = 'error';
          error = '엑셀 읽기 실패';
        }
      }
      newFiles.push({
        id: Date.now() + Math.random(),
        fileObj: file,
        name: file.name,
        type,
        status,
        error,
        data
      });
    }
    setStagedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    await processFiles(files);
    if (view === 'intro') setView('staging');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
      if (view === 'intro') setView('staging');
    }
  };

  const removeFile = (id) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  useEffect(() => {
    const ready = stagedFiles.filter((f) => f.status === 'ready').length;
    setReadyToStart(stagedFiles.length > 0 && ready === stagedFiles.length);
    if (stagedFiles.length === 0 && view === 'staging') setView('intro');
  }, [stagedFiles, view]);

  // Extraction 로직
  const startExtraction = (fileItem) => {
    setActiveFile(fileItem);
    setExtractedPoints([]);
    setImgScaleY(100);
    setView('extracting');
  };

  useEffect(() => {
    if (view === 'extracting' && activeFile && canvasRef.current) {
      renderPageToCanvas(activeFile.fileObj, canvasRef.current).then(() => {
        const ctx = canvasRef.current.getContext('2d');
        extractedPoints.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.stroke();
          if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(extractedPoints[i - 1].x, extractedPoints[i - 1].y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = 'rgba(251,191,36,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      });
    }
  }, [view, activeFile, extractedPoints]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setExtractedPoints((prev) => [
      ...prev,
      {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        invY: canvasRef.current.height - (e.clientY - rect.top)
      }
    ]);
  };

  const finishExtraction = () => {
    if (extractedPoints.length < 2) {
      alert('2개 이상의 점을 찍어주세요!');
      return;
    }
    const sorted = [...extractedPoints].sort((a, b) => a.x - b.x);
    const h = canvasRef.current.height;
    const finalData = sorted.map((p, i) => ({
      label: `${i + 1}번째`,
      value: parseFloat(((p.invY / h) * imgScaleY).toFixed(1)),
      originalLabel: `${i + 1}`
    }));
    setStagedFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id
          ? {
              ...f,
              status: 'ready',
              data: {
                name: f.name + '(Graph)',
                xLabel: '순서',
                yLabel: '값',
                data: finalData
              }
            }
          : f
      )
    );
    setView('staging');
  };

  // 미래 예측 생성 함수
  const generateFuturePrediction = (results, correlation, name1, name2) => {
    const absCorr = Math.abs(correlation);
    const isPositive = correlation > 0;
    
    let prediction = '';
    
    if (absCorr > 0.7) {
      if (isPositive) {
        prediction = `${name1}이(가) ${results[0].nextVal.toFixed(1)}로 예측되면, ${name2}도(도) ${results[1].nextVal.toFixed(1)} 정도로 함께 변할 가능성이 높아요. 두 데이터가 매우 강한 관계를 가지고 있기 때문이에요.`;
      } else {
        prediction = `${name1}이(가) ${results[0].nextVal.toFixed(1)}로 예측되면, ${name2}은(는) ${results[1].nextVal.toFixed(1)} 정도로 반대로 변할 가능성이 높아요. 두 데이터가 반대 관계를 가지고 있기 때문이에요.`;
      }
    } else if (absCorr > 0.3) {
      if (isPositive) {
        prediction = `${name1}이(가) ${results[0].nextVal.toFixed(1)}로 예측되면, ${name2}도(도) ${results[1].nextVal.toFixed(1)} 정도로 비슷한 방향으로 변할 수 있어요.`;
      } else {
        prediction = `${name1}이(가) ${results[0].nextVal.toFixed(1)}로 예측되면, ${name2}은(는) ${results[1].nextVal.toFixed(1)} 정도로 반대 방향으로 변할 수 있어요.`;
      }
    } else {
      prediction = `${name1}과(와) ${name2}은(는) 서로 독립적으로 움직일 가능성이 높아요. 각각 ${results[0].nextVal.toFixed(1)}와(과) ${results[1].nextVal.toFixed(1)} 정도로 예측돼요.`;
    }
    
    return prediction;
  };

  const performAlchemy = async () => {
    const dataList = stagedFiles.filter((f) => f.status === 'ready').map((f) => f.data);
    if (dataList.length === 0) return;

    if (dataList.length === 1) {
      // 단일 데이터셋 분석
      const d = dataList[0].data;
      const { slope, nextVal, analysis, stats } = analyzeSingleDataset(d);
      
      // 기본 설명 생성 (폴백)
      const childExplanation = generateChildFriendlyExplanation(
        d,
        dataList[0].name,
        slope,
        stats.avgValue,
        stats.maxValue,
        stats.minValue
      );
      
      // 미래 예측 근거 생성
      const currentValue = d[d.length - 1].value;
      const predictionEvidence = generatePredictionEvidence(
        slope,
        currentValue,
        nextVal,
        d.length
      );
      
      // 장기 예측 생성 (10년 후, 20년 후)
      const longTermPrediction = generateLongTermPrediction(
        slope,
        currentValue,
        d.length,
        dataList[0].name
      );
      
      // AI 설명 시도 (실패해도 기본 설명 사용)
      let aiExplanation = null;
      try {
        aiExplanation = await generateAIExplanation({
          dataName: dataList[0].name,
          slope,
          avgValue: stats.avgValue,
          maxValue: stats.maxValue,
          minValue: stats.minValue,
          trend: analysis.direction,
          nextVal,
          dataPoints: d.length
        });
      } catch (error) {
        console.log('AI 설명 생성 실패, 기본 설명 사용:', error);
      }
      
      setAnalysisResult({
        type: 'single',
        title: dataList[0].name,
        trend: analysis.direction,
        trendDesc: analysis.desc,
        nextVal,
        dataset: d,
        avgChange: slope.toFixed(1),
        stats: stats, // stats 정보 추가
        childExplanation: aiExplanation || childExplanation,
        predictionEvidence: aiExplanation ? {
          ...predictionEvidence,
          evidence: [
            ...predictionEvidence.evidence,
            ...(aiExplanation.predictionEvidence || [])
          ]
        } : predictionEvidence,
        longTermPrediction: longTermPrediction, // 10년 후, 20년 후 예측
        aiEnhanced: !!aiExplanation
      });
    } else {
      // 복수 데이터셋 분석
      const results = [];
      
      // 각 데이터셋을 개별 분석
      dataList.forEach((data, idx) => {
        const { slope, nextVal, analysis, stats } = analyzeSingleDataset(data.data);
        const childExplanation = generateChildFriendlyExplanation(
          data.data,
          data.name,
          slope,
          stats.avgValue,
          stats.maxValue,
          stats.minValue
        );
        const currentValue = data.data[data.data.length - 1].value;
        const predictionEvidence = generatePredictionEvidence(
          slope,
          currentValue,
          nextVal,
          data.data.length
        );
        
        results.push({
          name: data.name,
          analysis,
          childExplanation,
          predictionEvidence,
          nextVal
        });
      });
      
      // 상관관계 분석
      const d1 = dataList[0];
      const d2 = dataList[1];
      const min = Math.min(d1.data.length, d2.data.length);
      const s1 = d1.data.slice(0, min);
      const s2 = d2.data.slice(0, min);
      const { correlation, analysis } = analyzeCorrelation(s1, s2);
      
      // 기본 상관관계 설명 생성 (폴백)
      const correlationExplanation = generateCorrelationExplanation(
        correlation,
        d1.name,
        d2.name,
        s1,
        s2
      );
      
      // 미래 예측 생성
      const futurePrediction = generateFuturePrediction(
        results,
        correlation,
        d1.name,
        d2.name
      );
      
      // AI 상관관계 설명 시도
      let aiCorrelationExplanation = null;
      try {
        const data1Stats = analyzeSingleDataset(s1).stats;
        const data2Stats = analyzeSingleDataset(s2).stats;
        
        aiCorrelationExplanation = await generateAICorrelationExplanation({
          data1Name: d1.name,
          data2Name: d2.name,
          correlation,
          data1Stats: {
            avgValue: data1Stats.avgValue,
            maxValue: data1Stats.maxValue,
            minValue: data1Stats.minValue
          },
          data2Stats: {
            avgValue: data2Stats.avgValue,
            maxValue: data2Stats.maxValue,
            minValue: data2Stats.minValue
          },
          realWorldExample: correlationExplanation.realWorldExample
        });
      } catch (error) {
        console.log('AI 상관관계 설명 생성 실패, 기본 설명 사용:', error);
      }
      
      setAnalysisResult({
        type: 'multi',
        file1: d1.name,
        file2: d2.name,
        correlation,
        corrTitle: analysis.title,
        corrDetail: analysis.detail,
        dataset1: s1,
        dataset2: s2,
        individualResults: results,
        correlationExplanation: aiCorrelationExplanation || correlationExplanation,
        futurePrediction: aiCorrelationExplanation?.futurePrediction || futurePrediction,
        futurePredictionEvidence: aiCorrelationExplanation?.futurePredictionEvidence || [
          `${d1.name}의 예측값: ${results[0].nextVal.toFixed(1)}`,
          `${d2.name}의 예측값: ${results[1].nextVal.toFixed(1)}`,
          `두 데이터의 상관계수: ${correlation.toFixed(2)}`,
          (aiCorrelationExplanation || correlationExplanation).realWorldExample
        ],
        aiEnhanced: !!aiCorrelationExplanation
      });
    }
    setView('result');
  };


  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:480',message:'App render start',data:{view,stagedFilesCount:stagedFiles.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (view === 'lockdown') {
    return <Lockdown detectedBadWord={detectedBadWord} onReset={resetApp} />;
  }

  return (
    <div className="min-h-screen alchemy-gradient flex flex-col items-center p-4">
      <header className="w-full max-w-4xl flex justify-between items-center py-6 mb-8 z-10 text-white">
        <div className="flex items-center gap-3 cursor-pointer" onClick={resetApp}>
          <span className="text-2xl">🔮</span>
          <h1 className="text-2xl font-bold neon-text">
            {APP_CONFIG.title}
          </h1>
        </div>
      </header>

      <main className="w-full max-w-4xl z-10 min-h-[600px]">
        {view === 'intro' && (
          <Intro
            onFileSelect={handleFileSelect}
            dragActive={dragActive}
            onDrag={handleDrag}
            onDrop={handleDrop}
          />
        )}

        {view === 'staging' && (
          <Staging
            stagedFiles={stagedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={removeFile}
            onStartExtraction={startExtraction}
            onPerformAlchemy={performAlchemy}
            readyToStart={readyToStart}
            dragActive={dragActive}
            onDrag={handleDrag}
            onDrop={handleDrop}
            onReset={resetApp}
          />
        )}

        {view === 'extracting' && (
          <Extraction
            activeFile={activeFile}
            extractedPoints={extractedPoints}
            imgScaleY={imgScaleY}
            onImgScaleYChange={setImgScaleY}
            onCanvasClick={handleCanvasClick}
            onResetPoints={() => setExtractedPoints([])}
            onFinishExtraction={finishExtraction}
            canvasRef={canvasRef}
          />
        )}

        {view === 'result' && analysisResult && (
          <Result 
            analysisResult={analysisResult} 
            onReset={resetApp}
            stagedFiles={stagedFiles}
          />
        )}
      </main>
      <div className="hidden-sig">{APP_SIGNATURE}</div>
    </div>
  );
};

export default App;


