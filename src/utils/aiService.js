/**
 * AI 서비스를 통한 설명 생성
 * Vercel 서버리스 함수를 통해 Upstage API를 호출합니다.
 */

/**
 * 단일 데이터셋에 대한 AI 설명을 생성합니다.
 * @param {object} data - 분석 데이터
 * @returns {Promise<object>} - AI 생성 설명
 */
export const generateAIExplanation = async (data) => {
  try {
    const response = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'single',
        data: {
          dataName: data.dataName,
          slope: data.slope,
          avgValue: data.avgValue,
          maxValue: data.maxValue,
          minValue: data.minValue,
          trend: data.trend,
          nextVal: data.nextVal,
          dataPoints: data.dataPoints
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('AI 설명 생성 오류:', error);
    return null; // 실패 시 null 반환, 기존 설명 사용
  }
};

/**
 * 상관관계에 대한 AI 설명을 생성합니다.
 * @param {object} data - 상관관계 데이터
 * @returns {Promise<object>} - AI 생성 설명
 */
export const generateAICorrelationExplanation = async (data) => {
  try {
    const response = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'correlation',
        data: {
          data1Name: data.data1Name,
          data2Name: data.data2Name,
          correlation: data.correlation,
          data1Stats: data.data1Stats,
          data2Stats: data.data2Stats,
          realWorldExample: data.realWorldExample
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('AI 상관관계 설명 생성 오류:', error);
    return null; // 실패 시 null 반환, 기존 설명 사용
  }
};

