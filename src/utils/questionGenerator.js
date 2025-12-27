/**
 * 초등학교 4학년 수준의 그래프 해석 문제를 생성합니다.
 */

/**
 * 단일 데이터셋에 대한 문제를 생성합니다.
 * @param {object} data - 분석 결과 데이터
 * @returns {Array} - 문제 배열
 */
export const generateQuestions = (data) => {
  const { dataset, stats, trend, nextVal, avgChange } = data;
  const questions = [];

  // 문제 1: 그래프에서 값을 읽는 문제
  const maxValue = Math.max(...dataset.map(d => d.value));
  const minValue = Math.min(...dataset.map(d => d.value));
  const midIndex = Math.floor(dataset.length / 2);
  const midValue = dataset[midIndex]?.value;

  questions.push({
    id: 1,
    type: 'reading',
    question: `다음 중 그래프를 보고 알 수 있는 내용으로 옳은 것은?`,
    options: [
      `가장 큰 값은 ${maxValue.toFixed(1)}이고, 가장 작은 값은 ${minValue.toFixed(1)}예요.`,
      `가장 큰 값은 ${(maxValue + 5).toFixed(1)}이고, 가장 작은 값은 ${(minValue - 5).toFixed(1)}예요.`,
      `모든 값이 같아요.`,
      `그래프에서 값을 알 수 없어요.`
    ],
    correctAnswer: 0,
    explanation: `그래프를 보면 가장 큰 값은 ${maxValue.toFixed(1)}이고, 가장 작은 값은 ${minValue.toFixed(1)}예요. 그래프의 막대나 점의 높이를 비교하면 알 수 있어요!`,
    points: 5
  });

  // 문제 2: 트렌드나 패턴을 이해하는 문제
  const isIncreasing = parseFloat(avgChange) > 0;
  const trendDesc = isIncreasing ? '올라가고' : '내려가고';
  const oppositeDesc = isIncreasing ? '내려가고' : '올라가고';

  questions.push({
    id: 2,
    type: 'trend',
    question: `이 그래프의 데이터는 시간이 지나면서 어떻게 변하고 있나요?`,
    options: [
      `점점 ${trendDesc} 있어요.`,
      `점점 ${oppositeDesc} 있어요.`,
      `변하지 않고 있어요.`,
      `규칙 없이 변하고 있어요.`
    ],
    correctAnswer: 0,
    explanation: `그래프를 보면 데이터가 ${trendDesc} 있는 패턴을 보여요. 평균적으로 ${Math.abs(parseFloat(avgChange)).toFixed(1)}씩 ${trendDesc} 있어요. 그래프의 선이나 막대가 ${isIncreasing ? '오른쪽으로 갈수록 높아지는' : '오른쪽으로 갈수록 낮아지는'} 모양이에요!`,
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

