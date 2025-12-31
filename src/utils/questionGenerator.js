/**
 * 4학년 수학과 교육과정 성취기준 기반 퀴즈 문제 생성
 * 
 * 성취기준:
 * - [4수04-02] 자료를 수집하여 꺾은선그래프로 나타내고 해석할 수 있다.
 * - [4수04-03] 탐구 문제를 해결하기 위해 자료를 수집, 정리하여 막대그래프나 꺾은선그래프로 나타내고 해석할 수 있다.
 */

/**
 * 데이터셋에서 최댓값과 최솟값을 찾습니다.
 */
const findMinMax = (dataset) => {
  if (!dataset || dataset.length === 0) return { min: null, max: null };
  const values = dataset.map(d => d.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    minLabel: dataset.find(d => d.value === Math.min(...values))?.label || '',
    maxLabel: dataset.find(d => d.value === Math.max(...values))?.label || ''
  };
};

/**
 * 데이터셋의 평균값을 계산합니다.
 */
const calculateAverage = (dataset) => {
  if (!dataset || dataset.length === 0) return 0;
  const sum = dataset.reduce((acc, d) => acc + d.value, 0);
  return sum / dataset.length;
};

/**
 * 데이터셋의 변화 경향을 분석합니다.
 */
const analyzeTrend = (dataset) => {
  if (!dataset || dataset.length < 2) return '변화 없음';
  
  const values = dataset.map(d => d.value);
  let increasing = 0;
  let decreasing = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increasing++;
    else if (values[i] < values[i - 1]) decreasing++;
  }
  
  if (increasing > decreasing) return '증가';
  if (decreasing > increasing) return '감소';
  return '변화 없음';
};

/**
 * 4학년 수준에 맞는 퀴즈 문제를 생성합니다.
 * AI 원리 문제 2개 + 그래프 해석 문제 2개
 * @param {object} data - 분석 결과 데이터
 * @returns {Array} 문제 배열
 */
export const generateQuestions = (data) => {
  const { dataset, stats, trend, nextVal, avgChange, title } = data;
  const questions = [];

  if (!dataset || dataset.length === 0) return questions;

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
    points: 5,
    explanation: `정답은 "패턴 인식"이에요! 컴퓨터가 파일을 읽을 때, "여기는 숫자구나, 여기는 글자구나"라고 패턴을 찾아내는 거예요. 마치 우리가 그림책을 보면서 "이건 강아지고, 이건 고양이구나!"라고 알아보는 것과 같아요. ${title || '이 데이터'} 파일도 이렇게 읽어서 ${dataset?.length || 0}개의 데이터를 찾아냈어요!`
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
    points: 5,
    explanation: `정답은 "데이터 시각화로 그래프를 만들고, 선형 회귀로 패턴을 찾아요"예요! 먼저 숫자들을 그래프로 바꾸는 것은 "데이터 시각화"예요. 그리고 그래프를 보면서 "이 그래프는 위로 올라가고 있구나!"라고 패턴을 찾는 것은 "선형 회귀"예요. ${title || '이 데이터'}도 ${dataset?.slice(0, 3).map(d => d.value).join(', ')} 등의 숫자를 그래프로 바꾸고, ${avgChange ? (parseFloat(avgChange) > 0 ? '증가' : '감소') : '변화'}하는 패턴을 찾았어요!`
  });

  // 그래프 해석 문제 1: 최댓값과 최솟값 찾기 (4학년 수준)
  const { min, max, minLabel, maxLabel } = findMinMax(dataset);
  
  questions.push({
    id: 3,
    type: 'graph-interpretation',
    category: '그래프 해석',
    question: `${title || '이 그래프'}를 보면 가장 큰 값과 가장 작은 값은 각각 얼마인가요?`,
    options: [
      `가장 큰 값: ${max.toFixed(1)} (${maxLabel || '해당 항목'}), 가장 작은 값: ${min.toFixed(1)} (${minLabel || '해당 항목'})`,
      `가장 큰 값: ${max.toFixed(1)}, 가장 작은 값: ${min.toFixed(1)}`,
      '모든 값이 같아요',
      '그래프에서 값을 알 수 없어요'
    ],
    correctAnswer: 0,
    points: 20,
    achievementStandard: '[4수04-02]',
    explanation: `그래프를 자세히 보면 가장 큰 값은 ${max.toFixed(1)}이고, 이는 "${maxLabel || '해당 항목'}"에서 나타났어요. 가장 작은 값은 ${min.toFixed(1)}이고, 이는 "${minLabel || '해당 항목'}"에서 나타났어요. 그래프의 세로축(값)을 읽어서 찾을 수 있어요.`
  });

  // 그래프 해석 문제 2: 평균값 계산하기 (4학년 수준)
  const avg = calculateAverage(dataset);
  const roundedAvg = Math.round(avg * 10) / 10;
  
  questions.push({
    id: 4,
    type: 'graph-interpretation',
    category: '그래프 해석',
    question: `${title || '이 그래프'}의 평균값은 얼마인가요?`,
    options: [
      `약 ${roundedAvg}`,
      `약 ${Math.round(avg)}`,
      `약 ${Math.round(avg * 2) / 2}`,
      '계산할 수 없어요'
    ],
    correctAnswer: 0,
    points: 20,
    achievementStandard: '[4수04-02]',
    explanation: `모든 값들을 더한 후 개수로 나누면 평균값을 구할 수 있어요. 이 데이터의 평균값은 약 ${roundedAvg}예요. 평균은 데이터 전체의 대표값을 나타내는 중요한 지표예요.`
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
    achievementStandard: '[4수04-03]',
    explanation: isPositive
      ? `${file1}과(와) ${file2}은(는) ${isStrong ? '매우 강한' : '좋은'} 친구 관계예요. 하나가 커지면 다른 하나도 같이 커져요. 상관계수가 ${correlation.toFixed(2)}로 ${isStrong ? '매우 높아요' : '중간 정도예요'}.`
      : `${file1}과(와) ${file2}은(는) ${isStrong ? '완전 반대' : '반대'} 관계예요. 하나가 커지면 다른 하나는 작아져요. 상관계수가 ${correlation.toFixed(2)}로 ${isStrong ? '매우 낮아요' : '중간 정도예요'}.`,
    points: 5
  });

  return questions;
};
