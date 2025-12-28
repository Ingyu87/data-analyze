import { checkSafety } from './safety';

/**
 * Excel 파일을 2D 배열로 읽어서 파싱합니다 (HTML 코드와 동일한 방식 - 여러 항목 지원).
 * @param {Array<Array>} rows - Excel 파일의 2D 배열 데이터
 * @param {string} fileName - 파일 이름
 * @returns {{success: boolean, data?: object, msg?: string, errorType?: string, word?: string}}
 */
export const parseExcelData = (rows, fileName) => {
  if (!rows || rows.length === 0) {
    return { success: false, msg: "데이터가 없습니다" };
  }

  // HTML 코드의 processRawData 함수와 동일한 로직 - 여러 항목 지원
  let yearRowIndex = -1;
  const datasets = [];

  // 1. Find Header Row (Looking for years like 2016, 2017...)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    // Check how many cells look like a year (4 digits)
    const yearMatches = row.filter(cell => {
      const str = String(cell).trim();
      return /^\d{4}$/.test(str);
    });

    if (yearMatches.length >= 3) {
      yearRowIndex = i;
      // 2. Collect all rows below this header that have numeric data (HTML 코드와 동일)
      for (let j = i + 1; j < rows.length; j++) {
        const currentRow = rows[j];
        const name = String(currentRow[0] || "").trim();
        if (name === "" || name.includes("단위")) continue;

        const values = [];
        let hasNumericData = false;
        for (let k = 1; k < row.length; k++) {
          const valStr = String(currentRow[k] || "").replace(/,/g, '').trim();
          const val = parseFloat(valStr);
          if (!isNaN(val)) {
            values.push(val);
            hasNumericData = true;
          } else {
            values.push(null);
          }
        }

        if (hasNumericData) {
          datasets.push({ name, values });
        }
      }
      break;
    }
  }

  if (yearRowIndex === -1 || datasets.length === 0) {
    return { 
      success: false, 
      msg: "데이터 행을 찾을 수 없습니다. 파일 형식이 맞는지 확인해주세요." 
    };
  }

  // Extract valid year labels
  const yearRow = rows[yearRowIndex];
  const labels = [];
  for (let i = 1; i < yearRow.length; i++) {
    const label = String(yearRow[i]).trim();
    if (label !== "") labels.push(label);
  }

  // Clean datasets to match label length
  datasets.forEach(ds => {
    ds.values = ds.values.slice(0, labels.length);
  });

  // 여러 항목이 있는 경우 multi-dataset 구조로 반환
  if (datasets.length > 1) {
    return {
      success: true,
      data: {
        name: fileName,
        type: 'multi-dataset',
        xLabel: "연도",
        labels: labels,
        datasets: datasets.map(ds => ({
          name: ds.name,
          data: labels.map((label, idx) => ({
            label: label,
            value: ds.values[idx] !== null ? ds.values[idx] : 0,
            year: /^\d{4}$/.test(label) ? label : null
          }))
        }))
      }
    };
  }

  // 단일 항목인 경우 기존 구조 유지
  const firstDataset = datasets[0];
  const dataPoints = labels.map((label, idx) => ({
    label: label,
    value: firstDataset.values[idx] !== null ? firstDataset.values[idx] : 0,
    originalLabel: firstDataset.name,
    year: /^\d{4}$/.test(label) ? label : null
  }));

  return {
    success: true,
    data: {
      name: fileName,
      type: 'single',
      xLabel: "연도",
      yLabel: firstDataset.name,
      data: dataPoints
    }
  };
};

/**
 * 텍스트를 파싱하여 데이터 포인트 배열로 변환합니다 (CSV용).
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

  const cleanText = text.trim();
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // HTML 코드의 파싱 로직을 정확히 구현
  let yearRowIndex = -1;
  let valueRowIndex = -1;

  // 연도가 3개 이상 있는 행을 헤더로 찾기 (HTML 코드와 동일)
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(',')) continue;
    
    const parts = parseCSVLine(lines[i]);

    // Check how many cells look like a year (4 digits) - HTML 코드와 동일
    const yearMatches = parts.filter(cell => {
      const str = String(cell).trim();
      return /^\d{4}$/.test(str); // 정확히 4자리 숫자만 (HTML 코드와 동일)
    });

    if (yearMatches.length >= 3) { // HTML 코드: 3개 이상
      yearRowIndex = i;
      // 2. Find the first non-empty row below this header - HTML 코드와 동일
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].includes(',')) continue;
        
        const valueParts = parseCSVLine(lines[j]);
        
        // HTML 코드: idx > 0 && !isNaN(parseFloat(cell)) && cell !== ""
        const hasValues = valueParts.some((cell, idx) => {
          if (idx === 0) return false; // 첫 번째 컬럼 제외
          const val = parseFloat(cell.replace(/,/g, '').trim());
          return !isNaN(val) && cell.trim() !== '';
        });
        
        if (hasValues) {
          valueRowIndex = j;
          break;
        }
      }
      break;
    }
  }

  // HTML 코드의 파싱 로직 적용
  if (yearRowIndex !== -1 && valueRowIndex !== -1) {
    // 헤더 행과 값 행 파싱
    const yearRow = lines[yearRowIndex];
    const valueRow = lines[valueRowIndex];
    
    const yearParts = parseCSVLine(yearRow);
    const valueParts = parseCSVLine(valueRow);

    const categoryLabel = valueParts[0] || "수치";
    const labels = [];
    const values = [];

    // HTML 코드: Extract data starting from index 1
    for (let i = 1; i < yearParts.length; i++) {
      const label = String(yearParts[i]).trim();
      const valStr = String(valueParts[i]).replace(/,/g, '').trim();
      const val = parseFloat(valStr);

      if (label !== "" && !isNaN(val)) {
        labels.push(label);
        values.push(val);
      }
    }

    if (labels.length === 0) {
      return { success: false, msg: "유효한 수치 데이터를 찾지 못했습니다." };
    }

    // HTML 코드와 동일한 데이터 구조로 변환
    const dataPoints = labels.map((label, idx) => ({
      label: label,
      value: values[idx],
      originalLabel: categoryLabel,
      year: /^\d{4}$/.test(label) ? label : null
    }));

    return {
      success: true,
      data: {
        name: fileName,
        type: 'single',
        xLabel: "연도",
        yLabel: categoryLabel,
        data: dataPoints
      }
    };
  }

  // HTML 코드 로직이 실패한 경우
  return { 
    success: false, 
    msg: "데이터 행을 찾을 수 없습니다. 파일 형식이 맞는지 확인해주세요.\n\n파일 형식:\n- 첫 번째 행에 연도(2016, 2017 등)가 3개 이상 있어야 합니다\n- 두 번째 행부터 숫자 값이 있어야 합니다" 
  };
};

/**
 * CSV 라인을 파싱하여 배열로 반환합니다.
 */
function parseCSVLine(line) {
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
  
  return parts;
}
