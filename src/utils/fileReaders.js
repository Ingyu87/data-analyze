import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// PDF.js worker 설정
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * PDF 파일에서 텍스트를 추출합니다.
 * @param {File} file - PDF 파일
 * @returns {Promise<string|null>} - 추출된 텍스트 또는 null
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 3);
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join("\n") + "\n";
    }
    
    return fullText;
  } catch (e) {
    console.error("PDF 읽기 오류:", e);
    return null;
  }
};

/**
 * Excel 파일에서 텍스트를 추출합니다.
 * @param {File} file - Excel 파일
 * @returns {Promise<string|null>} - 추출된 CSV 텍스트 또는 null
 */
export const extractTextFromExcel = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_csv(worksheet);
  } catch (e) {
    console.error("Excel 읽기 오류:", e);
    return null;
  }
};

/**
 * 텍스트 파일을 읽습니다 (UTF-8 또는 EUC-KR).
 * @param {File} file - 텍스트 파일
 * @returns {Promise<string>} - 파일 내용
 */
export const readTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      // 간단한 인코딩 체크 (한글 깨짐 감지)
      if (content.includes('')) {
        const reader2 = new FileReader();
        reader2.onload = (e2) => resolve(e2.target.result);
        reader2.onerror = reject;
        reader2.readAsText(file, 'euc-kr');
      } else {
        resolve(content);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
};

/**
 * 파일을 캔버스에 렌더링합니다 (이미지 또는 PDF).
 * @param {File} file - 이미지 또는 PDF 파일
 * @param {HTMLCanvasElement} canvas - 렌더링할 캔버스
 * @returns {Promise<boolean>} - 성공 여부
 */
export const renderPageToCanvas = async (file, canvas) => {
  try {
    if (file.type.startsWith('image/')) {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      return new Promise(resolve => {
        img.onload = () => {
          const scale = canvas.parentElement.clientWidth / img.width;
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(true);
        };
        img.onerror = () => resolve(false);
      });
    } else if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ 
        canvasContext: canvas.getContext('2d'), 
        viewport: viewport 
      }).promise;
      return true;
    }
    return false;
  } catch (e) {
    console.error("캔버스 렌더링 오류:", e);
    return false;
  }
};

