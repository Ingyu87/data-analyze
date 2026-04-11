/**
 * 각 그래프 유형의 특징과 장단점을 초등학생 수준으로 설명합니다.
 */

export const getChartTypeInfo = (chartType, data) => {
  const info = {
    'line': {
      name: '꺾은선 그래프',
      icon: '📈',
      description: '시간에 따라 숫자가 어떻게 변하는지 보여주는 그래프예요.',
      whenToUse: '시간이 지나면서 숫자가 어떻게 변하는지 보고 싶을 때 사용해요.',
      advantages: [
        '시간에 따른 변화를 한눈에 볼 수 있어요',
        '숫자가 올라가는지 내려가는지 쉽게 알 수 있어요',
        '미래를 예측하기 좋아요'
      ],
      disadvantages: [
        '각 항목이 얼마나 큰지 비교하기는 어려워요',
        '항목이 많으면 선이 겹쳐서 보기 어려울 수 있어요'
      ],
      recommendation: data && data.dataset && data.dataset.length > 5 
        ? '이 데이터는 시간에 따른 변화를 보여주기 때문에 꺾은선 그래프가 좋아요!'
        : '시간에 따라 변하는 데이터를 보여주기 좋은 그래프예요.'
    },
    'bar': {
      name: '막대 그래프',
      icon: '📊',
      description: '각 항목의 크기를 막대의 높이로 비교하는 그래프예요.',
      whenToUse: '여러 항목을 비교하고 싶을 때 사용해요.',
      advantages: [
        '각 항목을 쉽게 비교할 수 있어요',
        '어떤 항목이 가장 큰지 작은지 한눈에 알 수 있어요',
        '많은 항목도 보기 쉬워요'
      ],
      disadvantages: [
        '시간에 따른 변화를 보기는 어려워요',
        '항목이 너무 많으면 막대가 작아져서 보기 어려울 수 있어요'
      ],
      recommendation: data && data.dataset && data.dataset.length <= 10
        ? '이 데이터는 여러 항목을 비교하기 좋기 때문에 막대 그래프가 좋아요!'
        : '여러 항목을 비교하기 좋은 그래프예요.'
    },
    'pie': {
      name: '원그래프',
      icon: '🥧',
      description: '전체 중에서 각 항목이 차지하는 비율을 보여주는 그래프예요.',
      whenToUse: '전체 중에서 각 항목이 얼마나 차지하는지 알고 싶을 때 사용해요.',
      advantages: [
        '전체 중에서 차지하는 비율을 쉽게 알 수 있어요',
        '어떤 항목이 가장 많은지 한눈에 알 수 있어요',
        '예쁘고 보기 좋아요'
      ],
      disadvantages: [
        '정확한 숫자를 보기는 어려워요',
        '항목이 많으면 조각이 작아져서 보기 어려워요',
        '시간에 따른 변화를 보기는 어려워요'
      ],
      recommendation: data && data.dataset && data.dataset.length <= 8
        ? '이 데이터는 각 항목이 전체 중에서 차지하는 비율을 보기 좋기 때문에 원그래프가 좋아요!'
        : '전체 중에서 각 항목의 비율을 보기 좋은 그래프예요.'
    },
    'pictograph': {
      name: '그림그래프',
      icon: '🎨',
      description: '숫자 대신 그림이나 아이콘을 사용해서 보여주는 그래프예요.',
      whenToUse: '초등학생들이 쉽게 이해할 수 있도록 그림으로 보여주고 싶을 때 사용해요.',
      advantages: [
        '초등학생들이 가장 쉽게 이해할 수 있어요',
        '재미있고 예쁘게 보여줄 수 있어요',
        '숫자를 세기 쉬워요'
      ],
      disadvantages: [
        '정확한 숫자를 보기는 어려워요',
        '항목이 많으면 그림이 많아져서 복잡해질 수 있어요',
        '컴퓨터로 그리기 어려울 수 있어요'
      ],
      recommendation: '초등학생들이 가장 쉽게 이해할 수 있는 그래프예요!'
    }
  };
  
  return info[chartType] || info['line'];
};

/**
 * 데이터 특성에 따라 추천 그래프를 결정합니다.
 */
export const getRecommendedChartType = (data) => {
  if (!data || !data.dataset) return 'line';
  
  const dataLength = data.dataset.length;
  const hasTimeSequence = data.dataset.some((d, i) => {
    const label = d.label || d.originalLabel || '';
    return /월|일|년|시간|시|분|순서|번째/.test(label);
  });
  
  // 시간 순서가 있으면 꺾은선 그래프 추천
  if (hasTimeSequence && dataLength > 3) {
    return 'line';
  }
  
  // 항목이 적으면 막대 그래프 추천
  if (dataLength <= 8) {
    return 'bar';
  }
  
  // 기본값은 꺾은선 그래프
  return 'line';
};



