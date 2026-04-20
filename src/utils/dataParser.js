import { checkSafety } from './safety';

/** @param {unknown} cell */
function cellStr(cell) {
  return String(cell ?? '').trim();
}

/** 네 자리 연도 (2016, 2023) */
function countFourDigitYears(row) {
  if (!row) return 0;
  return row.filter((cell) => /^\d{4}$/.test(cellStr(cell))).length;
}

/** 한글 월 헤더 (1월 … 12월) */
function countKoreanMonthHeaders(row) {
  if (!row) return 0;
  return row.filter((cell) => /^\d{1,2}월$/.test(cellStr(cell))).length;
}

/** YYYY.MM, YYYY-M, 2023년 1월, YYYYMM(202301) 등 시점 열 */
function isYearMonthLabel(cell) {
  const s = cellStr(cell);
  if (!s) return false;
  if (/^\d{4}[.\-/](0?[1-9]|1[0-2])$/.test(s)) return true;
  if (/^\d{4}년\s*(0?[1-9]|1[0-2])월?$/.test(s)) return true;
  if (/^(19|20)\d{2}(0[1-9]|1[0-2])$/.test(s)) return true;
  return false;
}

function countYearMonthHeaders(row) {
  if (!row) return 0;
  return row.filter((cell) => isYearMonthLabel(cell)).length;
}

/**
 * wide 표에서 헤더 행 후보 찾기
 * @returns {{ index: number, row: unknown[], kind: 'year'|'month'|'yearMonth' } | null}
 */
function findWideTableHeaderRow(rows) {
  const tries = [
    { kind: 'year', min: 3, fn: countFourDigitYears },
    { kind: 'month', min: 3, fn: countKoreanMonthHeaders },
    { kind: 'yearMonth', min: 3, fn: countYearMonthHeaders },
    { kind: 'year', min: 2, fn: countFourDigitYears },
  ];

  for (const { kind, min, fn } of tries) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      if (fn(row) >= min) {
        return { index: i, row, kind };
      }
    }
  }
  return null;
}

/**
 * @param {string} label
 * @returns {string|null}
 */
function extractYearFromLabel(label) {
  const s = cellStr(label);
  if (/^\d{4}$/.test(s)) return s;
  const m = s.match(/^(\d{4})[.\-/년]/);
  if (m) return m[1];
  if (/^(19|20)\d{2}(0[1-9]|1[0-2])$/.test(s)) return s.slice(0, 4);
  return null;
}

/**
 * @param {'year'|'month'|'yearMonth'} headerKind
 */
function xLabelForHeaderKind(headerKind) {
  if (headerKind === 'month') return '월';
  if (headerKind === 'yearMonth') return '시점';
  return '연도';
}

/**
 * 2D 배열 wide 표 → multi-dataset (연도 / 월 / 년월 열 공통)
 * @param {Array<Array>} rows
 * @param {string} fileName
 */
function parseWideTableRows(rows, fileName) {
  if (!rows || rows.length === 0) {
    return { success: false, msg: '데이터가 없습니다' };
  }

  const header = findWideTableHeaderRow(rows);
  if (!header) {
    return {
      success: false,
      msg:
        '데이터 형식을 인식할 수 없습니다. 첫 번째 열에 항목명, 가로로 연도·월·시점(2018, 1월, 2023.01 등)이 2개 이상 이어지는 행이 있는지 확인해 주세요.',
    };
  }

  const { index: headerRowIndex, row: headerRow, kind: headerKind } = header;
  const datasets = [];

  for (let j = headerRowIndex + 1; j < rows.length; j++) {
    const currentRow = rows[j];
    const name = cellStr(currentRow[0]);
    if (name === '' || name.includes('단위')) continue;

    const values = [];
    let hasNumericData = false;
    for (let k = 1; k < headerRow.length; k++) {
      const valStr = cellStr(currentRow[k]).replace(/,/g, '');
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

  if (datasets.length === 0) {
    return {
      success: false,
      msg: '데이터 형식을 인식할 수 없습니다. 헤더 아래에 숫자가 있는 데이터 행이 있는지 확인해 주세요.',
    };
  }

  const labels = [];
  for (let i = 1; i < headerRow.length; i++) {
    const label = cellStr(headerRow[i]);
    if (label !== '') labels.push(label);
  }

  datasets.forEach((ds) => {
    ds.values = ds.values.slice(0, labels.length);
  });

  const xLabel = xLabelForHeaderKind(headerKind);

  return {
    success: true,
    data: {
      name: fileName,
      type: 'multi-dataset',
      xLabel,
      labels,
      datasets: datasets.map((ds) => ({
        name: ds.name,
        data: labels.map((label, idx) => ({
          label,
          value: ds.values[idx] !== null ? ds.values[idx] : 0,
          year: extractYearFromLabel(label),
        })),
      })),
    },
  };
}

/**
 * Excel 파일을 2D 배열로 읽어서 파싱합니다 (여러 항목 지원, 연도·월·년월 헤더).
 * @param {Array<Array>} rows - Excel 파일의 2D 배열 데이터
 * @param {string} fileName - 파일 이름
 * @returns {{success: boolean, data?: object, msg?: string, errorType?: string, word?: string}}
 */
export const parseExcelData = (rows, fileName) => parseWideTableRows(rows, fileName);

/**
 * 텍스트를 파싱하여 데이터 포인트 배열로 변환합니다 (CSV용).
 * @param {string} text - 파싱할 텍스트
 * @param {string} fileName - 파일 이름
 * @returns {{success: boolean, data?: object, msg?: string, errorType?: string, word?: string}}
 */
export const parseTextToData = (text, fileName) => {
  if (!text || text.trim() === '') {
    return { success: false, msg: '내용 없음' };
  }

  const contentCheck = checkSafety(text);
  if (!contentCheck.safe) {
    return {
      success: false,
      errorType: 'safety',
      word: contentCheck.word,
    };
  }

  const cleanText = text.trim();
  const lines = cleanText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const rows = lines.map((line) => parseCSVLine(line));
  const wide = parseWideTableRows(rows, fileName);
  if (wide.success) {
    return wide;
  }

  // 이전 단일 시리즈(헤더 1행 + 값 1행) 호환
  let yearRowIndex = -1;
  let valueRowIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(',')) continue;

    const parts = parseCSVLine(lines[i]);

    const yearMatches = parts.filter((cell) => {
      const str = String(cell).trim();
      return /^\d{4}$/.test(str);
    });

    if (yearMatches.length >= 3) {
      yearRowIndex = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].includes(',')) continue;

        const valueParts = parseCSVLine(lines[j]);

        const hasValues = valueParts.some((cell, idx) => {
          if (idx === 0) return false;
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

  if (yearRowIndex !== -1 && valueRowIndex !== -1) {
    const yearRow = lines[yearRowIndex];
    const valueRow = lines[valueRowIndex];

    const yearParts = parseCSVLine(yearRow);
    const valueParts = parseCSVLine(valueRow);

    const categoryLabel = valueParts[0] || '수치';
    const labels = [];
    const values = [];

    for (let i = 1; i < yearParts.length; i++) {
      const label = String(yearParts[i]).trim();
      const valStr = String(valueParts[i]).replace(/,/g, '').trim();
      const val = parseFloat(valStr);

      if (label !== '' && !isNaN(val)) {
        labels.push(label);
        values.push(val);
      }
    }

    if (labels.length === 0) {
      return { success: false, msg: '유효한 수치 데이터를 찾지 못했습니다.' };
    }

    const dataPoints = labels.map((label, idx) => ({
      label,
      value: values[idx],
      originalLabel: categoryLabel,
      year: /^\d{4}$/.test(label) ? label : null,
    }));

    return {
      success: true,
      data: {
        name: fileName,
        type: 'single',
        xLabel: '연도',
        yLabel: categoryLabel,
        data: dataPoints,
      },
    };
  }

  return {
    success: false,
    msg:
      wide.msg ||
      '데이터 행을 찾을 수 없습니다. 파일 형식이 맞는지 확인해주세요.\n\n파일 형식:\n- 가로 방향에 연도(2016, 2017 등) 또는 월(1월~12월), 시점(2023.01 등)이 2개 이상 있어야 합니다\n- 세로 첫 열은 항목명, 그 아래 행에 숫자 값이 있어야 합니다',
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
