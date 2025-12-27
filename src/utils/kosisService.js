/**
 * KOSIS 국가통계포털 API 서비스
 */

/**
 * 통계표 검색
 * @param {string} query - 검색어
 * @returns {Promise<Array>} 검색 결과 목록
 */
export const searchKosisStatistics = async (query) => {
  try {
    const response = await fetch('/api/kosis-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchQuery: query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
      throw new Error(errorData.message || errorData.error || `검색 실패: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('KOSIS 검색 응답:', result);
    
    if (!result.success) {
      throw new Error(result.error || result.message || result.details || '검색 실패');
    }
    
    if (result.data) {
      // KOSIS API 응답 구조에 따라 파싱
      // 여러 가능한 구조 확인
      if (Array.isArray(result.data)) {
        console.log('배열 형식 응답:', result.data.length, '개 항목');
        return result.data;
      } else if (result.data.RESULT) {
        const results = Array.isArray(result.data.RESULT) ? result.data.RESULT : [];
        console.log('RESULT 형식 응답:', results.length, '개 항목');
        return results;
      } else if (result.data.statblList) {
        const results = Array.isArray(result.data.statblList) ? result.data.statblList : [];
        console.log('statblList 형식 응답:', results.length, '개 항목');
        return results;
      } else if (result.data.list) {
        const results = Array.isArray(result.data.list) ? result.data.list : [];
        console.log('list 형식 응답:', results.length, '개 항목');
        return results;
      } else if (result.data.StatisticSearch) {
        const results = Array.isArray(result.data.StatisticSearch) ? result.data.StatisticSearch : [];
        console.log('StatisticSearch 형식 응답:', results.length, '개 항목');
        return results;
      } else {
        // 객체의 모든 키 확인
        console.log('알 수 없는 응답 구조:', Object.keys(result.data));
        console.log('전체 응답:', JSON.stringify(result.data).substring(0, 500));
      }
    }
    
    // 데이터가 없으면 빈 배열 반환
    console.warn('검색 결과가 비어있습니다');
    return [];
  } catch (error) {
    console.error('KOSIS 검색 오류:', error);
    throw error;
  }
};

/**
 * 통계표 데이터 조회
 * @param {string} statId - 통계표 ID
 * @returns {Promise<Object>} 통계 데이터
 */
export const getKosisStatisticsData = async (statId) => {
  try {
    const response = await fetch('/api/kosis-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statId }),
    });

    if (!response.ok) {
      throw new Error(`데이터 조회 실패: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('KOSIS 데이터 조회 오류:', error);
    throw error;
  }
};

/**
 * KOSIS 데이터를 앱에서 사용하는 형식으로 변환
 * @param {Object} kosisData - KOSIS API 응답 데이터
 * @param {string} statName - 통계표 이름
 * @returns {Object} 변환된 데이터
 */
export const convertKosisDataToAppFormat = (kosisData, statName) => {
  try {
    // KOSIS API 응답 구조에 따라 파싱
    let rows = [];
    
    if (kosisData.DATA) {
      rows = kosisData.DATA;
    } else if (kosisData.statblList) {
      rows = kosisData.statblList;
    } else if (Array.isArray(kosisData)) {
      rows = kosisData;
    }

    if (rows.length === 0) {
      return { success: false, msg: '데이터가 없습니다' };
    }

    // 첫 번째 행을 헤더로 사용
    const headers = rows[0] || [];
    const dataPoints = [];

    // 데이터 행 파싱 (첫 번째 행은 헤더이므로 1부터 시작)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const label = row[0] || `항목 ${i}`;
      let value = null;

      // 숫자 값 찾기 (첫 번째 숫자 컬럼 사용)
      for (let j = 1; j < row.length; j++) {
        const cellValue = row[j];
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          const numValue = parseFloat(cellValue);
          if (!isNaN(numValue)) {
            value = numValue;
            break; // 첫 번째 숫자만 사용
          }
        }
      }

      if (value !== null && !isNaN(value) && value > 0) {
        dataPoints.push({
          label,
          value,
          originalLabel: label,
        });
      }
    }

    if (dataPoints.length === 0) {
      return { success: false, msg: '유효한 데이터를 찾지 못했습니다' };
    }

    return {
      success: true,
      data: {
        name: statName || 'KOSIS 통계',
        xLabel: headers[0] || '항목',
        yLabel: headers[1] || '값',
        data: dataPoints,
      },
    };
  } catch (error) {
    console.error('KOSIS 데이터 변환 오류:', error);
    return { success: false, msg: '데이터 변환 실패' };
  }
};

