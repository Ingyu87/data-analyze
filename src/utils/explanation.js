/**
 * 초등학생을 위한 데이터 설명을 생성합니다.
 * AI가 사용 가능하면 AI를 사용하고, 그렇지 않으면 기본 설명을 사용합니다.
 */

/**
 * 단일 데이터셋에 대한 초등학생용 설명을 생성합니다.
 * @param {Array} dataset - 데이터 포인트 배열
 * @param {string} dataName - 데이터 이름
 * @param {number} slope - 기울기
 * @param {number} avgValue - 평균값
 * @param {number} maxValue - 최대값
 * @param {number} minValue - 최소값
 * @returns {object} - 설명 객체
 */
export const generateChildFriendlyExplanation = (dataset, dataName, slope, avgValue, maxValue, minValue) => {
  const absSlope = Math.abs(slope);
  const range = maxValue - minValue;
  const isIncreasing = slope > 0;
  
  // 데이터 패턴 분석
  let pattern = '';
  let evidence = [];
  
  if (absSlope > 5) {
    pattern = isIncreasing ? '매우 빠르게 증가' : '매우 빠르게 감소';
    evidence.push(`데이터가 ${absSlope.toFixed(1)}씩 변하고 있어요. 이건 매우 큰 변화예요!`);
  } else if (absSlope > 1) {
    pattern = isIncreasing ? '뚜렷하게 증가' : '뚜렷하게 감소';
    evidence.push(`데이터가 ${absSlope.toFixed(1)}씩 변하고 있어요.`);
  } else if (absSlope > 0.2) {
    pattern = isIncreasing ? '천천히 증가' : '천천히 감소';
    evidence.push(`데이터가 ${absSlope.toFixed(1)}씩 조금씩 변하고 있어요.`);
  } else {
    pattern = '거의 변화 없음';
    evidence.push('데이터가 거의 변하지 않고 있어요.');
  }
  
  // 통계 근거
  evidence.push(`가장 큰 값은 ${maxValue.toFixed(1)}이고, 가장 작은 값은 ${minValue.toFixed(1)}예요.`);
  evidence.push(`평균적으로 ${avgValue.toFixed(1)} 정도예요.`);
  
  // 초등학생용 비유
  let analogy = '';
  if (isIncreasing && absSlope > 5) {
    analogy = '마치 롤러코스터가 위로 올라가는 것처럼 빠르게 올라가고 있어요!';
  } else if (isIncreasing && absSlope > 1) {
    analogy = '산을 오르는 것처럼 꾸준히 올라가고 있어요.';
  } else if (isIncreasing) {
    analogy = '계단을 천천히 오르는 것처럼 조금씩 올라가고 있어요.';
  } else if (!isIncreasing && absSlope > 5) {
    analogy = '미끄럼틀을 타는 것처럼 빠르게 내려가고 있어요!';
  } else if (!isIncreasing && absSlope > 1) {
    analogy = '언덕을 내려가는 것처럼 꾸준히 내려가고 있어요.';
  } else if (!isIncreasing) {
    analogy = '평지를 걷는 것처럼 조금씩 내려가고 있어요.';
  } else {
    analogy = '평평한 길을 걷는 것처럼 거의 변하지 않고 있어요.';
  }
  
  return {
    pattern,
    analogy,
    evidence,
    summary: `${dataName} 데이터는 ${pattern}하고 있어요. ${analogy}`
  };
};

/**
 * 상관관계에 대한 초등학생용 설명을 생성합니다.
 * @param {number} correlation - 상관계수
 * @param {string} data1Name - 첫 번째 데이터 이름
 * @param {string} data2Name - 두 번째 데이터 이름
 * @param {Array} dataset1 - 첫 번째 데이터셋
 * @param {Array} dataset2 - 두 번째 데이터셋
 * @returns {object} - 설명 객체
 */
export const generateCorrelationExplanation = (correlation, data1Name, data2Name, dataset1, dataset2) => {
  const absCorr = Math.abs(correlation);
  const isPositive = correlation > 0;
  
  let relationship = '';
  let explanation = '';
  let evidence = [];
  let realWorldExample = '';
  
  // 상관관계 강도 분석
  if (absCorr > 0.7) {
    if (isPositive) {
      relationship = '매우 강한 친구 관계';
      explanation = `${data1Name}이(가) 커지면 ${data2Name}도(도) 같이 커져요!`;
      realWorldExample = '예를 들어, 날씨가 추워지면(온도가 내려가면) 아이들이 감기에 걸릴 수 있어요.';
    } else {
      relationship = '완전 반대 관계';
      explanation = `${data1Name}이(가) 커지면 ${data2Name}은(는) 작아져요!`;
      realWorldExample = '예를 들어, 날씨가 추워지면(온도가 내려가면) 아이들이 밖에서 놀 시간이 줄어들어요.';
    }
    evidence.push(`상관계수가 ${correlation.toFixed(2)}로 매우 높아요. (1.0에 가까울수록 강한 관계예요)`);
  } else if (absCorr > 0.3) {
    if (isPositive) {
      relationship = '좋은 친구 관계';
      explanation = `${data1Name}이(가) 커지면 ${data2Name}도(도) 조금 커지는 경향이 있어요.`;
      realWorldExample = '예를 들어, 운동을 많이 하면 건강해질 수 있어요.';
    } else {
      relationship = '반대 경향';
      explanation = `${data1Name}이(가) 커지면 ${data2Name}은(는) 조금 작아지는 경향이 있어요.`;
      realWorldExample = '예를 들어, 공부 시간이 늘어나면 놀 시간이 줄어들어요.';
    }
    evidence.push(`상관계수가 ${correlation.toFixed(2)}로 중간 정도예요.`);
  } else {
    relationship = '관계 없음';
    explanation = `${data1Name}과(와) ${data2Name}은(는) 서로 영향을 주지 않아요.`;
    realWorldExample = '서로 다른 별처럼 각자 움직여요.';
    evidence.push(`상관계수가 ${correlation.toFixed(2)}로 거의 0에 가까워요.`);
  }
  
  // 데이터 근거 추가
  const avg1 = dataset1.reduce((sum, d) => sum + d.value, 0) / dataset1.length;
  const avg2 = dataset2.reduce((sum, d) => sum + d.value, 0) / dataset2.length;
  
  evidence.push(`${data1Name}의 평균값은 ${avg1.toFixed(1)}이고, ${data2Name}의 평균값은 ${avg2.toFixed(1)}예요.`);
  
  // 실제 데이터 예시
  if (dataset1.length > 0 && dataset2.length > 0) {
    const sampleIdx = Math.floor(dataset1.length / 2);
    evidence.push(`예를 들어, ${data1Name}이(가) ${dataset1[sampleIdx].value.toFixed(1)}일 때 ${data2Name}은(는) ${dataset2[sampleIdx].value.toFixed(1)}이었어요.`);
  }
  
  return {
    relationship,
    explanation,
    realWorldExample,
    evidence,
    summary: `${data1Name}과(와) ${data2Name}은(는) ${relationship}예요. ${explanation}`
  };
};

/**
 * 미래 예측에 대한 근거를 생성합니다.
 * @param {number} slope - 기울기
 * @param {number} currentValue - 현재 값
 * @param {number} predictedValue - 예측 값
 * @param {number} dataPoints - 데이터 포인트 수
 * @returns {object} - 근거 객체
 */
export const generatePredictionEvidence = (slope, currentValue, predictedValue, dataPoints) => {
  const evidence = [];
  
  // 과거 데이터 패턴 근거
  evidence.push(`지금까지 ${dataPoints}개의 데이터를 보니, 매번 약 ${Math.abs(slope).toFixed(1)}씩 변하는 패턴이 있었어요.`);
  
  // 현재 값 근거
  evidence.push(`현재 값은 ${currentValue.toFixed(1)}예요.`);
  
  // 예측 근거
  const change = predictedValue - currentValue;
  if (Math.abs(change) > 0) {
    if (change > 0) {
      evidence.push(`이 패턴이 계속되면 ${change.toFixed(1)}만큼 더 커질 거예요.`);
    } else {
      evidence.push(`이 패턴이 계속되면 ${Math.abs(change).toFixed(1)}만큼 더 작아질 거예요.`);
    }
  }
  
  // 신뢰도
  let confidence = '';
  if (dataPoints >= 10) {
    confidence = '매우 높아요';
    evidence.push(`데이터가 ${dataPoints}개나 있어서 예측이 정확할 가능성이 높아요.`);
  } else if (dataPoints >= 5) {
    confidence = '높아요';
    evidence.push(`데이터가 ${dataPoints}개 있어서 예측이 어느 정도 정확할 거예요.`);
  } else {
    confidence = '보통이에요';
    evidence.push(`데이터가 ${dataPoints}개밖에 없어서 예측이 정확하지 않을 수 있어요.`);
  }
  
  return {
    evidence,
    confidence,
    predictedValue: predictedValue.toFixed(1)
  };
};

/**
 * 장기 미래 예측 (10년 후, 20년 후)을 생성합니다.
 * @param {number} slope - 기울기
 * @param {number} currentValue - 현재 값
 * @param {number} dataPoints - 데이터 포인트 수
 * @param {string} dataName - 데이터 이름
 * @returns {object} - 장기 예측 객체
 */
export const generateLongTermPrediction = (slope, currentValue, dataPoints, dataName) => {
  // 데이터 포인트 수를 기준으로 시간 단위 추정
  // 예: 데이터가 10개면 10년치 데이터라고 가정 (실제로는 사용자가 입력한 시간 간격에 따라 다름)
  const estimatedYearsPerPoint = dataPoints > 0 ? Math.max(1, Math.floor(10 / dataPoints)) : 1;
  const yearsPerPoint = estimatedYearsPerPoint;
  
  // 10년 후 예측
  const points10Years = 10 / yearsPerPoint;
  const predicted10Years = currentValue + (slope * points10Years);
  
  // 20년 후 예측
  const points20Years = 20 / yearsPerPoint;
  const predicted20Years = currentValue + (slope * points20Years);
  
  const isIncreasing = slope > 0;
  const absSlope = Math.abs(slope);
  
  let prediction10 = '';
  let prediction20 = '';
  let reasons = [];
  
  // 10년 후 예측 설명
  if (isIncreasing) {
    prediction10 = `10년 후에는 약 ${predicted10Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  } else {
    prediction10 = `10년 후에는 약 ${predicted10Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  }
  
  // 20년 후 예측 설명
  if (isIncreasing) {
    prediction20 = `20년 후에는 약 ${predicted20Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  } else {
    prediction20 = `20년 후에는 약 ${predicted20Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  }
  
  // 근거 생성
  reasons.push(`현재 값은 ${currentValue.toFixed(1)}이고, 데이터를 보면 매 ${yearsPerPoint}년마다 약 ${absSlope.toFixed(1)}씩 ${isIncreasing ? '증가' : '감소'}하고 있어요.`);
  
  if (dataPoints >= 10) {
    reasons.push(`지금까지 ${dataPoints}개의 데이터를 분석한 결과, 이 패턴이 꾸준히 유지되고 있어요.`);
  } else {
    reasons.push(`지금까지 ${dataPoints}개의 데이터를 분석했지만, 더 많은 데이터가 있으면 예측이 더 정확해질 거예요.`);
  }
  
  reasons.push(`만약 이 패턴이 계속된다면, ${isIncreasing ? '계속 증가' : '계속 감소'}할 것으로 보여요.`);
  
  // 주의사항
  let warning = '';
  if (dataPoints < 10) {
    warning = '⚠️ 데이터가 적어서 장기 예측의 정확도는 낮을 수 있어요.';
  } else if (absSlope > 5) {
    warning = '⚠️ 변화가 매우 빠르므로, 10-20년 후에는 패턴이 바뀔 수도 있어요.';
  }
  
  return {
    prediction10Years: prediction10,
    prediction20Years: prediction20,
    value10Years: predicted10Years,
    value20Years: predicted20Years,
    reasons,
    warning
  };
};

