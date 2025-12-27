/**
 * 결과 보고서를 PNG로 생성합니다.
 */

// Lazy load html2canvas
let html2canvasLib = null;
const loadHtml2Canvas = async () => {
  if (!html2canvasLib) {
    html2canvasLib = (await import('html2canvas')).default;
  }
  return html2canvasLib;
};

/**
 * 결과 보고서를 PNG로 다운로드합니다.
 * @param {object} analysisResult - 분석 결과
 * @param {object} quizResults - 퀴즈 결과
 * @param {Array} stagedFiles - 업로드된 파일 목록
 */
export const generateReportPNG = async (analysisResult, quizResults, stagedFiles) => {
  // 보고서 HTML 생성
  const reportHTML = generateReportHTML(analysisResult, quizResults, stagedFiles);
  
  // 임시 div 생성
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = reportHTML;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '1200px';
  tempDiv.style.backgroundColor = '#0f0518';
  tempDiv.style.color = '#e9d5ff';
  tempDiv.style.padding = '40px';
  tempDiv.style.fontFamily = "'Noto Sans KR', sans-serif";
  document.body.appendChild(tempDiv);

  try {
    // 차트가 있는 경우 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    // html2canvas 로드
    const html2canvas = await loadHtml2Canvas();

    // HTML을 캔버스로 변환
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: '#0f0518',
      scale: 2,
      useCORS: true,
      logging: false
    });

    // PNG로 다운로드
    const link = document.createElement('a');
    link.download = `데이터분석_보고서_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (error) {
    console.error('보고서 생성 오류:', error);
    alert('보고서 생성 중 오류가 발생했습니다.');
  } finally {
    document.body.removeChild(tempDiv);
  }
};

/**
 * 보고서 HTML을 생성합니다.
 */
const generateReportHTML = (analysisResult, quizResults, stagedFiles) => {
  const date = new Date().toLocaleDateString('ko-KR');
  
  let html = `
    <div style="background: linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #0f0518 100%); padding: 40px; color: #e9d5ff; font-family: 'Noto Sans KR', sans-serif;">
      <h1 style="text-align: center; color: #fff; margin-bottom: 40px; font-size: 32px;">
        📊 데이터 분석 결과 보고서
      </h1>
      
      <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
        <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">📁 분석한 파일</h2>
        <ul style="list-style: none; padding: 0;">
          ${stagedFiles.map(file => `
            <li style="padding: 10px; background: rgba(0,0,0,0.3); margin-bottom: 10px; border-radius: 8px;">
              <strong>${file.name}</strong> (${file.type.toUpperCase()})
            </li>
          `).join('')}
        </ul>
        <p style="margin-top: 20px; color: #a78bfa;">생성일: ${date}</p>
      </div>
  `;

  if (analysisResult.type === 'single') {
    html += generateSingleReportHTML(analysisResult);
  } else {
    html += generateMultiReportHTML(analysisResult);
  }

  // 퀴즈 결과
  if (quizResults) {
    html += `
      <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-top: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
        <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">📝 그래프 해석 문제 결과</h2>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 28px; font-weight: bold; color: #fbbf24; margin-bottom: 10px;">
            ${quizResults.totalScore}점 / ${quizResults.maxScore}점
          </div>
          <div style="color: #a78bfa;">
            정답: ${quizResults.correctCount}문제 / 전체: ${quizResults.totalQuestions}문제
          </div>
        </div>
        
        <h3 style="color: #fff; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">문항별 분석</h3>
        ${quizResults.results.map((result, idx) => `
          <div style="background: ${result.isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${result.isCorrect ? '#22c55e' : '#ef4444'};">
            <div style="font-weight: bold; color: #fff; margin-bottom: 8px;">
              문제 ${idx + 1}. ${result.question}
            </div>
            <div style="color: ${result.isCorrect ? '#22c55e' : '#ef4444'}; margin-bottom: 8px;">
              ${result.isCorrect ? '✅ 정답' : '❌ 오답'} (${result.points}점)
            </div>
            <div style="color: #a78bfa; font-size: 14px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
              <strong>해설:</strong> ${result.explanation}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  html += `</div>`;
  return html;
};

const generateSingleReportHTML = (analysisResult) => {
  return `
    <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
      <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">📊 그래프 분석</h2>
      <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #c084fc; font-size: 18px; margin-bottom: 15px;">${analysisResult.title}</h3>
        <div style="color: #a78bfa;">
          <p><strong>트렌드:</strong> ${analysisResult.trend}</p>
          <p><strong>평균 변화율:</strong> ${analysisResult.avgChange}</p>
        </div>
      </div>
    </div>
    
    <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
      <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">🔮 미래 예측</h2>
      <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
        <div style="font-size: 20px; color: #fbbf24; margin-bottom: 15px;">
          예측된 다음 값: <strong>${analysisResult.nextVal.toFixed(1)}</strong>
        </div>
        <div style="color: #a78bfa; line-height: 1.8;">
          ${analysisResult.childExplanation?.summary || analysisResult.trendDesc}
        </div>
        ${analysisResult.predictionEvidence?.evidence ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(139, 92, 246, 0.3);">
            <strong style="color: #fff;">예측 근거:</strong>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${analysisResult.predictionEvidence.evidence.map(ev => `<li style="margin-bottom: 5px;">${ev}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${analysisResult.longTermPrediction ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid rgba(251, 191, 36, 0.5);">
            <h3 style="color: #fbbf24; font-size: 18px; margin-bottom: 15px;">📅 장기 예측</h3>
            <div style="background: rgba(251, 191, 36, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
              <p style="margin-bottom: 8px;"><strong>10년 후:</strong> ${analysisResult.longTermPrediction.prediction10Years}</p>
              <p style="color: #fbbf24; font-size: 16px; font-weight: bold;">예상값: ${analysisResult.longTermPrediction.value10Years.toFixed(1)}</p>
            </div>
            <div style="background: rgba(251, 191, 36, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
              <p style="margin-bottom: 8px;"><strong>20년 후:</strong> ${analysisResult.longTermPrediction.prediction20Years}</p>
              <p style="color: #fbbf24; font-size: 16px; font-weight: bold;">예상값: ${analysisResult.longTermPrediction.value20Years.toFixed(1)}</p>
            </div>
            ${analysisResult.longTermPrediction.reasons ? `
              <div style="margin-top: 15px;">
                <strong style="color: #fff;">이유:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                  ${analysisResult.longTermPrediction.reasons.map(reason => `<li style="margin-bottom: 5px; color: #a78bfa;">${reason}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${analysisResult.longTermPrediction.warning ? `
              <p style="color: #fbbf24; margin-top: 10px; font-weight: bold;">${analysisResult.longTermPrediction.warning}</p>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

const generateMultiReportHTML = (analysisResult) => {
  return `
    ${analysisResult.individualResults?.map((result, idx) => `
      <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
        <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">📊 데이터 ${idx + 1}: ${result.name}</h2>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
          <div style="color: #a78bfa; line-height: 1.8;">
            ${result.childExplanation?.summary || result.analysis.desc}
          </div>
          <div style="margin-top: 15px; color: #fbbf24;">
            <strong>예측값:</strong> ${result.nextVal.toFixed(1)}
          </div>
        </div>
      </div>
    `).join('')}
    
    <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
      <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">🔗 상관관계 분석</h2>
      <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
        <div style="color: #a78bfa; line-height: 1.8; margin-bottom: 15px;">
          <strong>${analysisResult.file1}</strong>과(와) <strong>${analysisResult.file2}</strong>의 상관계수: 
          <span style="color: #fbbf24; font-size: 20px;">${analysisResult.correlation.toFixed(2)}</span>
        </div>
        <div style="color: #a78bfa; line-height: 1.8;">
          ${analysisResult.correlationExplanation?.explanation || analysisResult.corrDetail}
        </div>
        ${analysisResult.correlationExplanation?.realWorldExample ? `
          <div style="margin-top: 15px; padding: 15px; background: rgba(139, 92, 246, 0.2); border-radius: 8px; border-left: 4px solid #8b5cf6;">
            <strong style="color: #fff;">실생활 예시:</strong>
            <p style="margin-top: 8px; color: #e9d5ff;">${analysisResult.correlationExplanation.realWorldExample}</p>
          </div>
        ` : ''}
      </div>
    </div>
    
    <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
      <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">🔮 미래 예측</h2>
      <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
        <div style="color: #a78bfa; line-height: 1.8;">
          ${analysisResult.futurePrediction || '두 데이터의 상관관계를 고려한 미래 예측이 여기에 표시됩니다.'}
        </div>
        ${analysisResult.futurePredictionEvidence ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(139, 92, 246, 0.3);">
            <strong style="color: #fff;">예측 근거:</strong>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${analysisResult.futurePredictionEvidence.map(ev => `<li style="margin-bottom: 5px; color: #a78bfa;">${ev}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

