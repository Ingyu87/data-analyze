import { checkSafety } from './safety';

/**
 * 텍스트를 파싱하여 데이터 포인트 배열로 변환합니다.
 * @param {string} text - 파싱할 텍스트
 * @param {string} fileName - 파일 이름
 * @returns {{success: boolean, data?: object, msg?: string, errorType?: string, word?: string}}
 */
export const parseTextToData = (text, fileName) => {
  if (!text || text.trim() === "") {
    return { success: false, msg: "내용 없음" };
  }
  
  const contentCheck = checkSafety(text);
  if (!contentCheck.safe) {
    return { 
      success: false, 
      errorType: 'safety', 
      word: contentCheck.word 
    };
  }

  let dataPoints = [];
  let xLabel = "항목";
  let yLabel = "값";
  let cleanText = text.trim();
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 헤더 찾기
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes(',')) {
      const parts = lines[i].split(',');
      // 첫 번째 컬럼이 숫자가 아니면 헤더로 간주
      if (isNaN(parseFloat(parts[0].replace(/"/g, '')))) {
        headerIdx = i;
        if (parts.length >= 2) {
          xLabel = parts[0].replace(/"/g, '').trim();
          yLabel = parts[1].replace(/"/g, '').trim();
        }
        break;
      }
    }
  }

  // 데이터 파싱
  const startRow = headerIdx === -1 ? 0 : headerIdx + 1;
  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i];
    let label = null;
    let value = null;
    
    if (line.includes(',')) {
      // CSV 형식 - 따옴표 처리 개선
      const parts = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      
      if (parts.length >= 2) {
        label = parts[0].replace(/^"|"$/g, '').trim();
        // 숫자 추출 (쉼표, 공백 제거)
        const valueStr = parts[1].replace(/^"|"$/g, '').replace(/,/g, '').trim();
        const valMatch = valueStr.match(/-?\d+(\.\d+)?/);
        if (valMatch) {
          value = parseFloat(valMatch[0]);
        }
      }
    } else {
      // 공백으로 구분된 형식
      const match = line.match(/^"?([^"]+)"?\s+([\d\.]+)/);
      if (match) {
        label = match[1].trim();
        value = parseFloat(match[2]);
      }
    }

    if (label && value !== null && !isNaN(value)) {
      if (label !== xLabel && label !== yLabel) {
        dataPoints.push({ 
          label, 
          value, 
          originalLabel: label 
        });
      }
    }
  }

  if (dataPoints.length > 0) {
    return {
      success: true,
      data: {
        name: fileName,
        xLabel,
        yLabel,
        data: dataPoints
      }
    };
  }
  
  return { success: false, msg: "데이터를 찾지 못했습니다" };
};


