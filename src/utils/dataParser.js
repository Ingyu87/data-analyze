import { checkSafety } from './safety';

/**
 * 텍스트를 파싱하여 데이터 포인트 배열로 변환합니다.
 * @param {string} text - 파싱할 텍스트
 * @param {string} fileName - 파일 이름
 * @returns {{success: boolean, data?: object, msg?: string, errorType?: string, word?: string}}
 */
export const parseTextToData = (text, fileName) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:9',message:'parseTextToData start',data:{fileName,textLength:text?.length,textPreview:text?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:27',message:'Lines parsed',data:{lineCount:lines.length,firstLines:lines.slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // 헤더 찾기 - 엑셀 파일의 경우 가로가 연도, 세로가 지표
  let headerIdx = -1;
  let isTimeSeries = false; // 시계열 데이터 여부
  
  // 시계열 데이터 패턴: 여러 행을 확인해서 연도 컬럼이 있는지 찾기
  // 첫 10줄을 확인 (메타데이터 행이 있을 수 있음)
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
      
      if (parts.length < 2) continue; // 최소 2개 컬럼 필요
      
      const firstCol = parts[0].replace(/^"|"$/g, '').trim();
      
      // 시계열 감지: 두 번째 컬럼부터 패턴 확인
      // 1. 연도(4자리 숫자) 감지
      const yearColumns = parts.slice(1).filter(p => {
        const cleaned = p.replace(/^"|"$/g, '').trim();
        return /^\d{4}$/.test(cleaned); // 4자리 숫자 (연도)
      });
      
      // 2. 국가/지역명 등 텍스트 카테고리 감지 (숫자가 아닌 텍스트가 2개 이상)
      const textCategories = parts.slice(1).filter(p => {
        const cleaned = p.replace(/^"|"$/g, '').trim();
        // 숫자가 아니고, 빈 값이 아니며, "단위:" 같은 메타데이터가 아닌 경우
        return cleaned && !/^\d+(\.\d+)?$/.test(cleaned) && !cleaned.includes('단위');
      });
      
      // 연도 컬럼이 2개 이상이면 시계열 데이터로 판단
      if (yearColumns.length >= 2) {
        isTimeSeries = true;
        headerIdx = i;
        xLabel = "연도";
        yLabel = "값";
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:75',message:'Time series detected (years)',data:{headerIdx:i,yearColumns:yearColumns,parts,firstCol},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        break;
      }
      
      // 텍스트 카테고리(국가, 지역 등)가 2개 이상이면 시계열 데이터로 판단
      if (textCategories.length >= 2 && parts.length >= 3) {
        isTimeSeries = true;
        headerIdx = i;
        // 첫 번째 컬럼이 비어있거나 메타데이터면 "항목"으로 설정, 아니면 첫 컬럼명 사용
        xLabel = (firstCol && !firstCol.includes('단위') && firstCol !== '') ? firstCol : "항목";
        yLabel = "값";
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:88',message:'Time series detected (categories)',data:{headerIdx:i,textCategories:textCategories,parts,firstCol,xLabel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        break;
      }
      
      // 일반 헤더로 인식 (시계열이 아닌 경우)
      if (!isTimeSeries && isNaN(parseFloat(firstCol)) && parts.length >= 2) {
        headerIdx = i;
        xLabel = parts[0].replace(/^"|"$/g, '').trim();
        yLabel = parts[1].replace(/^"|"$/g, '').trim();
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
  
  // 시계열 데이터 처리 (엑셀 파일: 가로=연도, 세로=지표)
  if (isTimeSeries && headers.length > 1) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:106',message:'Processing time series',data:{isTimeSeries,headersLength:headers.length,headers,startRow,linesToProcess:lines.length-startRow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // 첫 번째 컬럼은 행 레이블(지표명), 두 번째부터가 연도별 값
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:130',message:'Processing row',data:{rowIndex:i,rowLabel,parts,partsLength:parts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // "단위:", 빈 행, 숫자만 있는 행은 건너뛰기
      // 단, 첫 번째 컬럼이 비어있고 두 번째부터 값이 있는 경우도 처리 (지표명이 없는 경우)
      const isMetaRow = !rowLabel || rowLabel.includes('단위') || rowLabel === '' || /^\d+$/.test(rowLabel);
      
      // 첫 번째 컬럼이 비어있지만 두 번째부터 연도가 있는 경우는 지표명 없이 처리
      if (isMetaRow && rowLabel === '') {
        // 첫 번째 컬럼이 비어있고 두 번째부터 연도인 경우, 지표명을 "데이터"로 설정
        const secondCol = parts.length > 1 ? parts[1].replace(/^"|"$/g, '').trim() : '';
        if (/^\d{4}$/.test(secondCol)) {
          // 첫 번째 컬럼이 비어있고 두 번째가 연도인 경우, 지표명 없이 처리
          // 이 경우는 지표명을 파일명이나 기본값으로 사용
          const defaultLabel = fileName.replace(/\.[^/.]+$/, '') || '데이터';
          // 첫 번째 컬럼을 건너뛰고 두 번째부터 처리
          for (let j = 1; j < Math.min(parts.length, headers.length); j++) {
            const yearLabel = headers[j].replace(/^"|"$/g, '').trim();
            const valueStr = parts[j].replace(/^"|"$/g, '').replace(/,/g, '').trim();
            const isYear = /^\d{4}$/.test(yearLabel);
            if (!valueStr || valueStr === '') continue;
            const numMatch = valueStr.match(/-?\d+(\.\d+)?/);
            if (numMatch && isYear) {
              const value = parseFloat(numMatch[0]);
              if (!isNaN(value)) {
                const label = `${defaultLabel} (${yearLabel})`;
                dataPoints.push({
                  label,
                  value,
                  originalLabel: defaultLabel,
                  year: yearLabel
                });
              }
            }
          }
          continue;
        }
      }
      
      if (isMetaRow) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:150',message:'Skipping row',data:{rowLabel,reason:'unit_or_empty_or_numeric'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        continue;
      }
      
      // 각 카테고리별 값 추출 (두 번째 컬럼부터)
      // 카테고리는 연도(4자리 숫자) 또는 국가/지역명 등 텍스트일 수 있음
      let rowDataPoints = 0;
      for (let j = 1; j < Math.min(parts.length, headers.length); j++) {
        const categoryLabel = headers[j].replace(/^"|"$/g, '').trim();
        const valueStr = parts[j].replace(/^"|"$/g, '').replace(/,/g, '').trim();
        
        // 카테고리 타입 확인: 연도(4자리 숫자) 또는 텍스트
        // "2024 p)" 같은 형식도 연도로 인식 (앞의 4자리 숫자 추출)
        const yearMatch = categoryLabel.match(/^(\d{4})/);
        const isYear = yearMatch !== null;
        const extractedYear = isYear ? yearMatch[1] : null;
        const isTextCategory = !isYear && categoryLabel && !categoryLabel.includes('단위');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:140',message:'Processing column',data:{rowLabel,columnIndex:j,categoryLabel,isYear,isTextCategory,valueStr,isEmpty:!valueStr||valueStr===''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // 값이 비어있거나 카테고리가 유효하지 않으면 건너뛰기
        if (!valueStr || valueStr === '' || (!isYear && !isTextCategory)) continue;
        
        // 숫자 추출
        const numMatch = valueStr.match(/-?\d+(\.\d+)?/);
        
        if (numMatch && (isYear || isTextCategory)) {
          const value = parseFloat(numMatch[0]);
          if (!isNaN(value)) { // 음수도 포함 (데이터에 따라 음수값이 있을 수 있음)
            const label = `${rowLabel} (${categoryLabel})`;
            // 연도 추출: "2024 p)" -> "2024"
            const yearValue = extractedYear || (isYear ? categoryLabel : null);
            dataPoints.push({
              label,
              value,
              originalLabel: rowLabel,
              year: yearValue,
              category: isTextCategory ? categoryLabel : null,
              rawCategory: categoryLabel // 원본 카테고리 라벨 저장
            });
            rowDataPoints++;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:160',message:'Data point added',data:{label,value,year:isYear?categoryLabel:null,category:isTextCategory?categoryLabel:null,rowLabel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:165',message:'Value is NaN',data:{valueStr,numMatch:numMatch?numMatch[0]:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
          }
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:168',message:'Skipping column',data:{categoryLabel,isYear,isTextCategory,valueStr,hasNumMatch:!!numMatch},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:160',message:'Row processed',data:{rowLabel,rowDataPoints,totalDataPoints:dataPoints.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
    
    if (dataPoints.length > 0) {
      // 정렬: 연도가 있으면 연도순, 아니면 카테고리명순
      dataPoints.sort((a, b) => {
        if (a.year && b.year) {
          return a.year.localeCompare(b.year);
        }
        if (a.category && b.category) {
          return a.category.localeCompare(b.category);
        }
        return 0;
      });
      
      // 시계열 데이터는 모든 연도를 보여주고, 카테고리 데이터(국가, 지역 등)는 최신 연도만 선택
      const categoryMap = new Map();
      const finalDataPoints = [];
      
      // 연도 데이터가 있는 경우
      const hasYearData = dataPoints.some(d => d.year);
      const hasRawCategoryWithYear = dataPoints.some(d => d.rawCategory && d.rawCategory.match(/^\d{4}/));
      
      if (hasYearData || hasRawCategoryWithYear) {
        // 카테고리별로 그룹화
        for (const point of dataPoints) {
          if (point.originalLabel) {
            const key = point.originalLabel;
            if (!categoryMap.has(key)) {
              categoryMap.set(key, []);
            }
            categoryMap.get(key).push(point);
          }
        }
        
        // 각 카테고리별로 처리
        for (const [category, points] of categoryMap.entries()) {
          const yearPoints = points.filter(p => p.year);
          
          // 시계열 데이터인 경우: 모든 연도 데이터를 보여줌
          // 카테고리 데이터인 경우: 최신 연도만 선택
          // 구분 기준: 같은 카테고리에 여러 연도가 있으면 시계열, 아니면 카테고리
          if (yearPoints.length > 1) {
            // 시계열 데이터: 모든 연도 데이터를 보여줌
            // 연도순 정렬
            yearPoints.sort((a, b) => {
              const yearA = parseInt(a.year) || 0;
              const yearB = parseInt(b.year) || 0;
              return yearA - yearB; // 오름차순 (과거부터 미래로)
            });
            
            // 모든 연도 데이터 추가
            for (const point of yearPoints) {
              finalDataPoints.push({
                label: point.label || `${category} (${point.year})`,
                value: point.value,
                originalLabel: category
              });
            }
          } else if (yearPoints.length === 1) {
            // 연도가 하나만 있는 경우: 그대로 사용
            finalDataPoints.push({
              label: category,
              value: yearPoints[0].value,
              originalLabel: category
            });
          } else {
            // 연도가 없는 경우 (카테고리만 있는 경우) rawCategory를 사용해서 정렬
            const pointsWithRaw = points.filter(p => p.rawCategory);
            if (pointsWithRaw.length > 1) {
              // 여러 rawCategory가 있으면 모든 데이터 보여줌 (시계열처럼)
              pointsWithRaw.sort((a, b) => {
                const yearA = parseInt(a.rawCategory.match(/^(\d{4})/)?.[1] || '0') || 0;
                const yearB = parseInt(b.rawCategory.match(/^(\d{4})/)?.[1] || '0') || 0;
                if (yearA !== 0 || yearB !== 0) {
                  return yearA - yearB; // 오름차순
                }
                return 0;
              });
              
              for (const point of pointsWithRaw) {
                finalDataPoints.push({
                  label: point.label || `${category} (${point.rawCategory})`,
                  value: point.value,
                  originalLabel: category
                });
              }
            } else if (pointsWithRaw.length === 1) {
              // rawCategory가 하나만 있으면 그대로 사용
              finalDataPoints.push({
                label: category,
                value: pointsWithRaw[0].value,
                originalLabel: category
              });
            } else {
              // rawCategory도 없는 경우 가장 마지막 값 선택
              const latest = points[points.length - 1];
              finalDataPoints.push({
                label: category,
                value: latest.value,
                originalLabel: category
              });
            }
          }
        }
      } else {
        // 연도 데이터가 없는 경우 원본 데이터 사용
        finalDataPoints.push(...dataPoints.map(p => ({
          label: p.originalLabel || p.label,
          value: p.value,
          originalLabel: p.originalLabel || p.label
        })));
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:200',message:'Time series parsing complete',data:{totalDataPoints:dataPoints.length,finalDataPoints:finalDataPoints.length,firstFew:finalDataPoints.slice(0,5),xLabel,yLabel,hasYearData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // 멀티 시리즈 데이터인지 확인 (여러 카테고리가 있고 각각 시계열 데이터인 경우)
      const seriesMap = new Map();
      let allYears = new Set();
      
      // 카테고리별로 그룹화하고 연도 추출
      for (const point of finalDataPoints) {
        if (point.originalLabel) {
          const category = point.originalLabel;
          if (!seriesMap.has(category)) {
            seriesMap.set(category, []);
          }
          
          // 연도 추출 (label에서 또는 year 필드에서)
          let year = null;
          if (point.year) {
            year = point.year;
          } else if (point.label) {
            const yearMatch = point.label.match(/\((\d{4})/);
            if (yearMatch) {
              year = yearMatch[1];
            }
          }
          
          if (year) {
            allYears.add(year);
            seriesMap.get(category).push({ year, value: point.value });
          } else {
            // 연도가 없으면 그냥 추가
            seriesMap.get(category).push({ value: point.value, label: point.label });
          }
        }
      }
      
      // 여러 시리즈가 있고 각각 연도 데이터가 있으면 멀티 시리즈로 변환
      if (seriesMap.size > 1 && allYears.size > 0) {
        const sortedYears = Array.from(allYears).sort((a, b) => parseInt(a) - parseInt(b));
        const series = [];
        
        for (const [category, points] of seriesMap.entries()) {
          // 연도별로 정렬
          const yearPoints = points.filter(p => p.year);
          if (yearPoints.length > 0) {
            yearPoints.sort((a, b) => parseInt(a.year) - parseInt(b.year));
            series.push({
              name: category,
              data: yearPoints.map(p => ({ year: p.year, value: p.value }))
            });
          }
        }
        
        if (series.length > 1) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:410',message:'Multi-series detected',data:{seriesCount:series.length,seriesNames:series.map(s=>s.name),years:sortedYears},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          
          return {
            success: true,
            data: {
              name: fileName,
              type: 'multi-series',
              xLabel: "연도",
              yLabel: yLabel || "값",
              series: series,
              years: sortedYears
            }
          };
        }
      }
      
      return {
        success: true,
        data: {
          name: fileName,
          xLabel: "항목",
          yLabel: yLabel || "값",
          data: finalDataPoints.length > 0 ? finalDataPoints : dataPoints
        }
      };
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/utils/dataParser.js:220',message:'Time series parsing failed - no data points',data:{isTimeSeries,headersLength:headers.length,startRow,linesProcessed:lines.length-startRow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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


