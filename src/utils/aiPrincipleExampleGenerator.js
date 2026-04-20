/**
 * 실제 데이터를 기반으로 AI 원리 설명의 예시를 동적으로 생성합니다.
 */

/**
 * AI 원리 설명의 예시를 실제 데이터 기반으로 생성합니다.
 * @param {string} step - AI 원리 단계
 * @param {object} analysisResult - 분석 결과 데이터
 * @returns {Promise<string>} - 동적으로 생성된 예시
 */
export const generateDynamicExample = async (step, analysisResult) => {
  try {
    const response = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'principle-example',
        data: {
          step,
          analysisResult
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data.example : null;
  } catch (error) {
    console.error('동적 예시 생성 오류:', error);
    return null;
  }
};

/**
 * 각 단계별로 실제 데이터에서 예시를 추출합니다 (폴백용)
 */
export const getFallbackExample = (step, analysisResult) => {
  if (!analysisResult) return null;

  switch (step) {
    case 'graph-visualization':
      if (analysisResult.type === 'single' && analysisResult.dataset) {
        const sampleData = analysisResult.dataset.slice(0, 3);
        const values = sampleData.map(d => d.value).join(', ');
        return `${analysisResult.title} 데이터의 ${values} 값을 그래프로 그려요.`;
      }
      break;
    
    case 'trend-analysis':
      if (analysisResult.type === 'single' && analysisResult.avgChange) {
        const direction = parseFloat(analysisResult.avgChange) > 0 ? '증가' : '감소';
        return `${analysisResult.title} 데이터가 평균적으로 ${Math.abs(parseFloat(analysisResult.avgChange)).toFixed(1)}씩 ${direction}하는 패턴을 찾아요.`;
      }
      break;
    
    case 'correlation-analysis':
      if (analysisResult.type === 'multi' && analysisResult.correlation !== undefined) {
        const corrDesc = Math.abs(analysisResult.correlation) > 0.7 ? '강한' : 
                        Math.abs(analysisResult.correlation) > 0.3 ? '중간' : '약한';
        return `${analysisResult.file1}과 ${analysisResult.file2} 사이의 ${corrDesc} 관계를 찾아요.`;
      }
      break;
    
    case 'ai-explanation':
      if (analysisResult.childExplanation?.summary) {
        return `"${analysisResult.childExplanation.summary.substring(0, 50)}..."와 같이 쉬운 말로 설명해요.`;
      }
      break;
    
    case 'prediction':
      if (analysisResult.nextVal !== undefined) {
        return `${analysisResult.title} 데이터를 보고 다음 값이 ${analysisResult.nextVal.toFixed(1)}이 될 것으로 예측해요.`;
      }
      break;
  }
  
  return null;
};



