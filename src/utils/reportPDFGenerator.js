/**
 * 보고서를 PDF로 생성합니다.
 */

const loadJsPDF = async () => {
  const jsPDF = (await import('jspdf')).default;
  return jsPDF;
};

const loadHtml2Canvas = async () => {
  const html2canvas = (await import('html2canvas')).default;
  return html2canvas;
};

export const generateReportPDF = async (reportData, analysisResult, aiFeedback) => {
  try {
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF();
    
    // 한글 폰트 설정 (기본 폰트 사용)
    doc.setFont('helvetica');
    
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // 제목
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title || '데이터 분석 보고서', margin, yPos);
    yPos += 15;
    
    // 구분선
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // 데이터 선정 이유
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. 데이터 선정 이유', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dataReasonLines = doc.splitTextToSize(reportData.dataSelectionReason || '', maxWidth);
    doc.text(dataReasonLines, margin, yPos);
    yPos += dataReasonLines.length * 6 + 10;
    
    // 그래프 선택 이유
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. 그래프 선택 이유', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const chartReasonLines = doc.splitTextToSize(
      `선택한 그래프: ${reportData.selectedChartType}\n${reportData.chartSelectionReason || ''}`, 
      maxWidth
    );
    doc.text(chartReasonLines, margin, yPos);
    yPos += chartReasonLines.length * 6 + 10;
    
    // 그래프 이미지 추가
    try {
      const chartDiv = document.getElementById('report-chart-div');
      if (chartDiv) {
        // 그래프가 렌더링될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const html2canvas = await loadHtml2Canvas();
        const chartCanvas = await html2canvas(chartDiv, {
          backgroundColor: 'rgba(0,0,0,0)',
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const chartImgData = chartCanvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
        
        // 페이지가 부족하면 새 페이지 추가
        if (yPos + imgHeight > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('📊 그래프', margin, yPos);
        yPos += 8;
        
        doc.addImage(chartImgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      }
    } catch (error) {
      console.error('그래프 이미지 추가 실패:', error);
      // 그래프 추가 실패해도 계속 진행
    }
    
    // 그래프를 통해 알 수 있는 사실
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. 그래프를 통해 알 수 있는 사실', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const findingsLines = doc.splitTextToSize(reportData.findings || '', maxWidth);
    doc.text(findingsLines, margin, yPos);
    yPos += findingsLines.length * 6 + 10;
    
    // 미래 예측
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. 미래 예측', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const predictionLines = doc.splitTextToSize(reportData.futurePrediction || '', maxWidth);
    doc.text(predictionLines, margin, yPos);
    yPos += predictionLines.length * 6 + 10;
    
    // AI 피드백
    if (aiFeedback) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('5. AI 피드백', margin, yPos);
      yPos += 8;
      
      // 잘한 점
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('잘한 점:', margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const strengthsLines = doc.splitTextToSize(aiFeedback.strengths || '', maxWidth);
      doc.text(strengthsLines, margin, yPos);
      yPos += strengthsLines.length * 5 + 8;
      
      // 개선할 점
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('개선할 점:', margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const improvementsLines = doc.splitTextToSize(aiFeedback.improvements || '', maxWidth);
      doc.text(improvementsLines, margin, yPos);
      yPos += improvementsLines.length * 5 + 8;
      
      // 추가 제안
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('추가 제안:', margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const suggestionsLines = doc.splitTextToSize(aiFeedback.suggestions || '', maxWidth);
      doc.text(suggestionsLines, margin, yPos);
    }
    
    // 파일명 생성
    const fileName = `데이터분석_보고서_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    throw error;
  }
};



