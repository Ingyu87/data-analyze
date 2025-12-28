/**
 * 초등학교 4학년 수준의 문제를 생성합니다.
 * AI 원리 문제 2개 + 그래프 해석 문제 2개
 */

/**
 * 단일 데이터셋에 대한 문제를 생성합니다.
 * @param {object} data - 분석 결과 데이터
 * @returns {Array} - 문제 배열 (AI 원리 2개 + 그래프 해석 2개)
 */
export const generateQuestions = (data) => {
  const { dataset, stats, trend, nextVal, avgChange, title } = data;
  const questions = [];

  // AI 원리 문제 1: 패턴 인식
  questions.push({
    id: 1,
    type: 'ai-principle',
    category: 'AI 원리',
    question: `컴퓨터가 엑셀 파일에서 숫자와 글자를 구분해서 읽어내는 것은 어떤 AI 원리인가요?`,
    options: [
      `패턴 인식 (Pattern Recognition) - 파일에서 숫자와 글자의 패턴을 찾아내는 거예요`,
      `데이터 시각화 (Data Visualization) - 숫자를 그래프로 바꾸는 거예요`,
      `예측 모델링 (Predictive Modeling) - 미래를 예측하는 거예요`,
      `자연어 생성 (Natural Language Generation) - 쉬운 말로 설명하는 거예요`
    ],
    correctAnswer: 0,
    explanation: `정답은 "패턴 인식"이에요! 컴퓨터가 파일을 읽을 때, "여기는 숫자구나, 여기는 글자구나"라고 패턴을 찾아내는 거예요. 마치 우리가 그림책을 보면서 "이건 강아지고, 이건 고양이구나!"라고 알아보는 것과 같아요. ${title || '이 데이터'} 파일도 이렇게 읽어서 ${dataset?.length || 0}개의 데이터를 찾아냈어요!`,
    points: 5
  });

  // AI 원리 문제 2: 데이터 시각화 또는 선형 회귀
  const selectedChartType = data.selectedChartType || 'line';
  const chartTypeName = selectedChartType === 'line' ? '꺾은선 그래프' : selectedChartType === 'bar' ? '막대 그래프' : '그래프';
  
  questions.push({
    id: 2,
    type: 'ai-principle',
    category: 'AI 원리',
    question: `숫자들을 ${chartTypeName}로 바꾸는 것은 어떤 AI 원리인가요? 그리고 그래프에서 패턴을 찾는 것은 어떤 AI 원리인가요?`,
    options: [
      `데이터 시각화로 그래프를 만들고, 선형 회귀로 패턴을 찾아요`,
      `패턴 인식으로 그래프를 만들고, 데이터 시각화로 패턴을 찾아요`,
      `예측 모델링으로 그래프를 만들고, 자연어 생성으로 패턴을 찾아요`,
      `모두 같은 원리예요`
    ],
    correctAnswer: 0,
    explanation: `정답은 "데이터 시각화로 그래프를 만들고, 선형 회귀로 패턴을 찾아요"예요! 먼저 숫자들을 그래프로 바꾸는 것은 "데이터 시각화"예요. 그리고 그래프를 보면서 "이 그래프는 위로 올라가고 있구나!"라고 패턴을 찾는 것은 "선형 회귀"예요. ${title || '이 데이터'}도 ${dataset?.slice(0, 3).map(d => d.value).join(', ')} 등의 숫자를 그래프로 바꾸고, ${avgChange ? (parseFloat(avgChange) > 0 ? '증가' : '감소') : '변화'}하는 패턴을 찾았어요!`,
    points: 5
  });

  // 그래프 해석 문제 1: 그래프에서 값을 읽는 문제
  const maxValue = Math.max(...dataset.map(d => d.value));
  const minValue = Math.min(...dataset.map(d => d.value));
  const maxItem = dataset.find(d => d.value === maxValue);
  const minItem = dataset.find(d => d.value === minValue);

  questions.push({
    id: 3,
    type: 'graph-interpretation',
    category: '그래프 해석',
    question: `${title || '이 그래프'}를 보면 가장 큰 값과 가장 작은 값은 각각 얼마인가요?`,
    options: [
      `가장 큰 값: ${maxValue.toFixed(1)} (${maxItem?.year || maxItem?.label || '해당 항목'}), 가장 작은 값: ${minValue.toFixed(1)} (${minItem?.year || minItem?.label || '해당 항목'})`,
      `가장 큰 값: ${(maxValue + 5).toFixed(1)}, 가장 작은 값: ${(minValue - 5).toFixed(1)}`,
      `모든 값이 같아요`,
      `그래프에서 값을 알 수 없어요`
    ],
    correctAnswer: 0,
    explanation: `그래프를 보면 가장 큰 값은 ${maxValue.toFixed(1)}이고, 이는 ${maxItem?.year || maxItem?.label || '해당 항목'}에 기록되었어요. 가장 작은 값은 ${minValue.toFixed(1)}이고, 이는 ${minItem?.year || minItem?.label || '해당 항목'}에 기록되었어요. 그래프의 막대나 점의 높이를 비교하면 알 수 있어요!`,
    points: 5
  });

  // 그래프 해석 문제 2: 트렌드나 패턴을 이해하는 문제
  const isIncreasing = parseFloat(avgChange) > 0;
  const trendDesc = isIncreasing ? '증가하고' : '감소하고';
  const oppositeDesc = isIncreasing ? '감소하고' : '증가하고';
  const avgChangeValue = Math.abs(parseFloat(avgChange || 0));

  questions.push({
    id: 4,
    type: 'graph-interpretation',
    category: '그래프 해석',
    question: `${title || '이 그래프'}의 데이터는 시간이 지나면서 어떻게 변하고 있나요?`,
    options: [
      `점점 ${trendDesc} 있어요. 평균적으로 ${avgChangeValue.toFixed(1)}씩 ${trendDesc} 있어요.`,
      `점점 ${oppositeDesc} 있어요.`,
      `변하지 않고 있어요.`,
      `규칙 없이 변하고 있어요.`
    ],
    correctAnswer: 0,
    explanation: `그래프를 보면 데이터가 ${trendDesc} 있는 패턴을 보여요. 평균적으로 ${avgChangeValue.toFixed(1)}씩 ${trendDesc} 있어요. 그래프의 선이나 막대가 ${isIncreasing ? '오른쪽으로 갈수록 높아지는' : '오른쪽으로 갈수록 낮아지는'} 모양이에요! 예를 들어, ${dataset[0]?.year || dataset[0]?.label || '첫 번째'}에는 ${dataset[0]?.value.toFixed(1)}이었는데, ${dataset[dataset.length - 1]?.year || dataset[dataset.length - 1]?.label || '마지막'}에는 ${dataset[dataset.length - 1]?.value.toFixed(1)}로 ${isIncreasing ? '증가' : '감소'}했어요!`,
    points: 5
  });

  return questions;
};

/**
 * 상관관계 데이터에 대한 문제를 생성합니다.
 * @param {object} data - 상관관계 분석 결과
 * @returns {Array} - 문제 배열
 */
export const generateCorrelationQuestions = (data) => {
  const { correlation, file1, file2, dataset1, dataset2 } = data;
  const questions = [];

  const isPositive = correlation > 0;
  const isStrong = Math.abs(correlation) > 0.7;

  // 문제 1: 두 데이터의 관계 이해
  questions.push({
    id: 1,
    type: 'relationship',
    question: `${file1}과(와) ${file2}의 관계는 어떻게 될까요?`,
    options: [
      isPositive 
        ? `${file1}이(가) 커지면 ${file2}도(도) 커져요.`
        : `${file1}이(가) 커지면 ${file2}은(는) 작아져요.`,
      isPositive
        ? `${file1}이(가) 작아지면 ${file2}도(도) 작아져요.`
        : `${file1}이(가) 작아지면 ${file2}은(는) 커져요.`,
      `서로 상관없이 변해요.`,
      `항상 같은 값이에요.`
    ],
    correctAnswer: 0,
    explanation: isPositive
      ? `${file1}과(와) ${file2}은(는) ${isStrong ? '매우 강한' : '좋은'} 친구 관계예요. 하나가 커지면 다른 하나도 같이 커져요. 상관계수가 ${correlation.toFixed(2)}로 ${isStrong ? '매우 높아요' : '중간 정도예요'}.`
      : `${file1}과(와) ${file2}은(는) ${isStrong ? '완전 반대' : '반대'} 관계예요. 하나가 커지면 다른 하나는 작아져요. 상관계수가 ${correlation.toFixed(2)}로 ${isStrong ? '매우 낮아요' : '중간 정도예요'}.`,
    points: 5
  });

  // 문제 2: 실생활 예시 이해
  const avg1 = dataset1.reduce((sum, d) => sum + d.value, 0) / dataset1.length;
  const avg2 = dataset2.reduce((sum, d) => sum + d.value, 0) / dataset2.length;

  questions.push({
    id: 2,
    type: 'example',
    question: `다음 중 이 두 데이터의 관계를 설명하는 예시로 가장 적절한 것은?`,
    options: [
      isPositive
        ? `날씨가 좋아지면(온도가 올라가면) 사람들의 기분도 좋아질 수 있어요.`
        : `날씨가 추워지면(온도가 내려가면) 사람들이 밖에서 놀 시간이 줄어들어요.`,
      isPositive
        ? `운동을 많이 하면 건강해질 수 있어요.`
        : `공부 시간이 늘어나면 놀 시간이 줄어들어요.`,
      `서로 아무 관계가 없어요.`,
      `항상 같은 값이에요.`
    ],
    correctAnswer: 0,
    explanation: isPositive
      ? `${file1}과(와) ${file2}은(는) 함께 변하는 관계예요. ${file1}의 평균값은 ${avg1.toFixed(1)}이고, ${file2}의 평균값은 ${avg2.toFixed(1)}예요. 하나가 커지면 다른 하나도 같이 커지는 패턴을 보여요.`
      : `${file1}과(와) ${file2}은(는) 반대로 변하는 관계예요. ${file1}의 평균값은 ${avg1.toFixed(1)}이고, ${file2}의 평균값은 ${avg2.toFixed(1)}예요. 하나가 커지면 다른 하나는 작아지는 패턴을 보여요.`,
    points: 5
  });

  return questions;
};



