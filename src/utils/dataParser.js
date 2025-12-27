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
  let headers = [];
  if (headerIdx >= 0) {
    // 헤더 파싱
    const headerLine = lines[headerIdx];
    const headerParts = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < headerLine.length; j++) {
      const char = headerLine[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headerParts.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    headerParts.push(current.trim().replace(/^"|"$/g, ''));
    headers = headerParts;
  }
  
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
        // 첫 번째와 두 번째 컬럼을 label로 사용 (범죄대분류-범죄중분류 형태)
        const col1 = parts[0].replace(/^"|"$/g, '').trim();
        const col2 = parts.length > 1 ? parts[1].replace(/^"|"$/g, '').trim() : '';
        
        // 숫자가 아닌 컬럼들을 label로 합치기
        let labelParts = [];
        let numericStartIdx = -1;
        
        for (let k = 0; k < parts.length; k++) {
          const part = parts[k].replace(/^"|"$/g, '').trim();
          const numMatch = part.match(/^-?\d+(\.\d+)?$/);
          if (!numMatch && part.length > 0) {
            labelParts.push(part);
          } else {
            if (numericStartIdx === -1) {
              numericStartIdx = k;
            }
          }
        }
        
        if (labelParts.length > 0) {
          label = labelParts.join('-');
        } else {
          label = col1;
        }
        
        // 숫자 컬럼들 찾기 (세 번째 컬럼부터 또는 숫자로 시작하는 컬럼부터)
        let sum = 0;
        let hasNumericValue = false;
        
        for (let k = numericStartIdx >= 0 ? numericStartIdx : 2; k < parts.length; k++) {
          const valueStr = parts[k].replace(/^"|"$/g, '').replace(/,/g, '').trim();
          const valMatch = valueStr.match(/-?\d+(\.\d+)?/);
          if (valMatch) {
            const num = parseFloat(valMatch[0]);
            if (!isNaN(num)) {
              sum += num;
              hasNumericValue = true;
            }
          }
        }
        
        // 숫자 컬럼이 여러 개인 경우 합산, 하나만 있으면 그 값 사용
        if (hasNumericValue) {
          value = sum;
        } else if (parts.length >= 2) {
          // 두 번째 컬럼이 숫자인지 확인
          const valueStr = parts[1].replace(/^"|"$/g, '').replace(/,/g, '').trim();
          const valMatch = valueStr.match(/-?\d+(\.\d+)?/);
          if (valMatch) {
            value = parseFloat(valMatch[0]);
          }
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

    if (label && value !== null && !isNaN(value) && value > 0) {
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


