/**
 * 결과 보고서를 PDF로 생성합니다.
 * 한글 폰트 지원 포함
 */

// Lazy load jsPDF
let jsPDFLib = null;
const loadJsPDF = async () => {
  if (!jsPDFLib) {
    jsPDFLib = (await import('jspdf')).default;
  }
  return jsPDFLib;
};

/**
 * HTML을 PDF로 변환합니다.
 * 한글 폰트 문제를 해결하기 위해 html2canvas를 사용합니다.
 */
export const generateReportPDF = async (
  analysisResult,
  quizResults,
  stagedFiles,
  feedback = null,
  reportForm = null
) => {
  let tempDiv = null;
  let fontLink = null;
  try {
    const [html2canvas, jsPDF] = await Promise.all([
      import('html2canvas'),
      loadJsPDF()
    ]);

    const files = Array.isArray(stagedFiles) ? stagedFiles : [];
    const reportHTML = generateReportHTML(analysisResult, quizResults, files, feedback, reportForm);

    tempDiv = document.createElement('div');
    tempDiv.innerHTML = reportHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '1200px';
    tempDiv.style.backgroundColor = '#0f0518';
    tempDiv.style.color = '#e9d5ff';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = "'Noto Sans KR', sans-serif";
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.6';

    fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    document.body.appendChild(tempDiv);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const canvas = await html2canvas.default(tempDiv, {
      backgroundColor: '#0f0518',
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      onclone: (clonedDoc) => {
        const clonedDiv = clonedDoc.querySelector('div');
        if (clonedDiv) {
          clonedDiv.style.fontFamily = "'Noto Sans KR', sans-serif";
        }
      }
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/png', 0.92);
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `데이터분석_보고서_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    alert('PDF 생성 중 오류가 발생했습니다: ' + error.message);
  } finally {
    if (tempDiv?.parentNode) {
      tempDiv.parentNode.removeChild(tempDiv);
    }
    if (fontLink?.parentNode) {
      fontLink.parentNode.removeChild(fontLink);
    }
  }
};

/**
 * 보고서 HTML을 생성합니다.
 */
const escapeHtml = (s) => {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const generateReportHTML = (analysisResult, quizResults, stagedFiles, feedback, reportForm = null) => {
  const date = new Date().toLocaleDateString('ko-KR');
  const files = Array.isArray(stagedFiles) ? stagedFiles : [];
  const trendText =
    analysisResult?.trend ||
    analysisResult?.analysis?.direction ||
    analysisResult?.analysis?.desc ||
    '분석 중';

  let html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Noto Sans KR', sans-serif;
          background: linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #0f0518 100%);
          padding: 40px;
          color: #e9d5ff;
        }
        h1, h2, h3 {
          font-family: 'Noto Sans KR', sans-serif;
        }
      </style>
    </head>
    <body>
      <div style="background: linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #0f0518 100%); padding: 40px; color: #e9d5ff; font-family: 'Noto Sans KR', sans-serif;">
        <h1 style="text-align: center; color: #fff; margin-bottom: 40px; font-size: 32px;">
          📊 데이터 분석 결과 보고서
        </h1>
        
        <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">📁 분석한 파일</h2>
          <ul style="list-style: none; padding: 0;">
            ${
              files.length > 0
                ? files
                    .map(
                      (file) => `
              <li style="padding: 10px; background: rgba(0,0,0,0.3); margin-bottom: 10px; border-radius: 8px;">
                <strong>${escapeHtml(file.name)}</strong> (${escapeHtml(String(file.type || '').toUpperCase())})
              </li>
            `
                    )
                    .join('')
                : `<li style="padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; color: #a78bfa;">업로드 파일명은 PDF에 포함되지 않습니다. 아래는 분석된 데이터 요약입니다.</li>`
            }
          </ul>
          <p style="margin-top: 20px; color: #a78bfa;">생성일: ${date}</p>
        </div>
  `;

  if (analysisResult && analysisResult.type === 'single') {
    html += `
      <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
        <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">📊 그래프 분석</h2>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
          <h3 style="color: #c084fc; font-size: 18px; margin-bottom: 15px;">${escapeHtml(analysisResult.title || '데이터')}</h3>
          <div style="color: #a78bfa;">
            <p><strong>트렌드:</strong> ${escapeHtml(trendText)}</p>
            ${analysisResult.avgChange ? `<p><strong>평균 변화율:</strong> ${analysisResult.avgChange}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  if (reportForm && typeof reportForm === 'object') {
    const rf = reportForm;
    const hasText =
      (rf.title && String(rf.title).trim()) ||
      (rf.dataSelectionReason && String(rf.dataSelectionReason).trim()) ||
      (rf.findings && String(rf.findings).trim()) ||
      (rf.questions && String(rf.questions).trim()) ||
      (rf.futurePrediction && String(rf.futurePrediction).trim());
    if (hasText) {
      html += `
      <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
        <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">📝 작성한 보고서</h2>
        <div style="color: #a78bfa; line-height: 1.8;">
          ${rf.title ? `<p><strong>제목:</strong> ${escapeHtml(rf.title)}</p>` : ''}
          ${rf.dataSelectionReason ? `<p><strong>데이터 선정 이유:</strong><br/>${escapeHtml(rf.dataSelectionReason).replace(/\n/g, '<br/>')}</p>` : ''}
          ${rf.findings ? `<p><strong>그래프로 알 수 있는 사실:</strong><br/>${escapeHtml(rf.findings).replace(/\n/g, '<br/>')}</p>` : ''}
          ${rf.questions ? `<p><strong>스스로 만든 질문:</strong><br/>${escapeHtml(rf.questions).replace(/\n/g, '<br/>')}</p>` : ''}
          ${rf.futurePrediction ? `<p><strong>미래 예측:</strong><br/>${escapeHtml(rf.futurePrediction).replace(/\n/g, '<br/>')}</p>` : ''}
        </div>
      </div>
    `;
    }
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
              문제 ${idx + 1}. ${escapeHtml(result.question)}
            </div>
            <div style="color: ${result.isCorrect ? '#22c55e' : '#ef4444'}; margin-bottom: 8px;">
              ${result.isCorrect ? '✅ 정답' : '❌ 오답'} (${result.points}점)
            </div>
            <div style="color: #a78bfa; font-size: 14px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
              <strong>해설:</strong> ${escapeHtml(result.explanation)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 피드백
  if (feedback) {
    html += `
      <div style="background: rgba(30, 27, 75, 0.7); padding: 30px; border-radius: 16px; margin-top: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
        <h2 style="color: #fff; font-size: 24px; margin-bottom: 20px;">💬 선생님의 피드백</h2>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #22c55e; font-size: 18px; margin-bottom: 10px;">✨ 잘한 점</h3>
          <p style="color: #a78bfa; line-height: 1.8;">${escapeHtml(feedback.strengths)}</p>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #fbbf24; font-size: 18px; margin-bottom: 10px;">📈 개선할 점</h3>
          <p style="color: #a78bfa; line-height: 1.8;">${escapeHtml(feedback.improvements)}</p>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #8b5cf6; font-size: 18px; margin-bottom: 10px;">💡 다음 단계</h3>
          <p style="color: #a78bfa; line-height: 1.8;">${escapeHtml(feedback.suggestions)}</p>
        </div>
        ${feedback.encouragement ? `
          <div style="background: rgba(251, 191, 36, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #fbbf24;">
            <p style="color: #fbbf24; font-weight: bold;">${escapeHtml(feedback.encouragement)}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  html += `</div></body></html>`;
  return html;
};
