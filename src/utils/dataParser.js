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

  // 헤더 찾기 - 엑셀 파일의 경우 첫 번째 행이 연도일 수 있음
  let headerIdx = -1;
  let isTimeSeries = false; // 시계열 데이터 여부
  
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes(',')) {
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim().replace(/^"|"$/g, ''));
      
      // 첫 번째 컬럼이 숫자가 아니면 헤더로 간주
      const firstCol = parts[0].replace(/^"|"$/g, '').trim();
      if (isNaN(parseFloat(firstCol))) {
        // 첫 번째 행이 연도들로만 구성되어 있는지 확인 (시계열 데이터)
        const allNumeric = parts.slice(1).every(p => {
          const cleaned = p.replace(/^"|"$/g, '').trim();
          return /^\d{4}$/.test(cleaned) || !isNaN(parseFloat(cleaned));
        });
        
        if (allNumeric && parts.length > 2) {
          // 첫 번째 컬럼이 비어있거나 "단위:" 같은 메타데이터이고, 나머지가 숫자면 시계열 헤더
          isTimeSeries = true;
          headerIdx = i;
          xLabel = "연도";
          yLabel = "값";
          break;
        } else if (parts.length >= 2) {
          headerIdx = i;
          xLabel = parts[0].replace(/^"|"$/g, '').trim();
          yLabel = parts[1].replace(/^"|"$/g, '').trim();
          break;
        }
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
  
  // 시계열 데이터 처리 (엑셀 파일의 연도별 데이터)
  if (isTimeSeries && headers.length > 1) {
    // 첫 번째 컬럼은 행 레이블, 나머지는 연도별 값
    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes(',')) continue;
      
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim().replace(/^"|"$/g, ''));
      
      if (parts.length < 2) continue;
      
      const rowLabel = parts[0].replace(/^"|"$/g, '').trim();
      // "단위:", "총 횟수", "규모 3 이상" 같은 레이블
      if (!rowLabel || rowLabel.includes('단위') || rowLabel === '') continue;
      
      // 각 연도별 값 추출
      for (let j = 1; j < Math.min(parts.length, headers.length); j++) {
        const yearLabel = headers[j].replace(/^"|"$/g, '').trim();
        const valueStr = parts[j].replace(/^"|"$/g, '').replace(/,/g, '').trim();
        
        // 연도인지 확인 (4자리 숫자)
        const isYear = /^\d{4}$/.test(yearLabel);
        const numMatch = valueStr.match(/-?\d+(\.\d+)?/);
        
        if (numMatch) {
          const value = parseFloat(numMatch[0]);
          if (!isNaN(value) && value >= 0) { // 음수 제외 (예측값이 아닌 실제 데이터만)
            const label = isYear ? `${rowLabel} (${yearLabel})` : `${rowLabel} - ${yearLabel}`;
            dataPoints.push({
              label,
              value,
              originalLabel: rowLabel,
              year: isYear ? yearLabel : null
            });
          }
        }
      }
    }
    
    if (dataPoints.length > 0) {
      return {
        success: true,
        data: {
          name: fileName,
          xLabel: "연도",
          yLabel: "값",
          data: dataPoints
        }
      };
    }
  }
  
  // 일반 CSV 데이터 파싱
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
        
        // 숫자 컬럼 찾기 - 여러 컬럼이 있으면 첫 번째 숫자 컬럼만 사용
        // (여러 지표가 섞이지 않도록)
        let foundValue = null;
        
        // 숫자 컬럼 찾기 (세 번째 컬럼부터 또는 숫자로 시작하는 컬럼부터)
        for (let k = numericStartIdx >= 0 ? numericStartIdx : 2; k < parts.length; k++) {
          const valueStr = parts[k].replace(/^"|"$/g, '').replace(/,/g, '').trim();
          const valMatch = valueStr.match(/-?\d+(\.\d+)?/);
          if (valMatch) {
            const num = parseFloat(valMatch[0]);
            if (!isNaN(num)) {
              // 첫 번째 숫자 컬럼만 사용 (여러 지표 합산 방지)
              if (foundValue === null) {
                foundValue = num;
                break; // 첫 번째 숫자만 사용
              }
            }
          }
        }
        
        // 첫 번째 숫자 컬럼이 없으면 두 번째 컬럼 확인
        if (foundValue === null && parts.length >= 2) {
          const valueStr = parts[1].replace(/^"|"$/g, '').replace(/,/g, '').trim();
          const valMatch = valueStr.match(/-?\d+(\.\d+)?/);
          if (valMatch) {
            foundValue = parseFloat(valMatch[0]);
          }
        }
        
        if (foundValue !== null) {
          value = foundValue;
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


