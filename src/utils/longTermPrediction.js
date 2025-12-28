/**
 * 장기 미래 예측 (10년 후, 20년 후)을 생성합니다.
 */

/**
 * 단일 데이터셋의 장기 예측을 생성합니다.
 * @param {number} slope - 기울기 (변화율)
 * @param {number} currentValue - 현재 값
 * @param {number} dataPoints - 데이터 포인트 수
 * @param {string} dataName - 데이터 이름
 * @returns {object} - 장기 예측 객체
 */
export const generateLongTermPrediction = (slope, currentValue, dataPoints, dataName) => {
  // 데이터 포인트 수를 기준으로 시간 단위 추정 (예: 1년 = 12개월, 1개월 = 1포인트)
  // 실제로는 데이터의 시간 간격을 알 수 없으므로, 데이터 포인트 수를 기준으로 추정
  const timeUnit = dataPoints; // 예: 10개 포인트 = 10년치 데이터라고 가정
  
  // 10년 후 예측 (현재 + 10 * 연간 변화율)
  const years10 = 10;
  const predicted10Years = currentValue + (slope * timeUnit * years10);
  
  // 20년 후 예측
  const years20 = 20;
  const predicted20Years = currentValue + (slope * timeUnit * years20);
  
  const isIncreasing = slope > 0;
  const absSlope = Math.abs(slope);
  
  let prediction10 = '';
  let prediction20 = '';
  let reasons = [];
  
  // 10년 후 예측
  if (isIncreasing) {
    prediction10 = `10년 후에는 약 ${predicted10Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  } else {
    prediction10 = `10년 후에는 약 ${predicted20Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  }
  
  // 20년 후 예측
  if (isIncreasing) {
    prediction20 = `20년 후에는 약 ${predicted20Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  } else {
    prediction20 = `20년 후에는 약 ${predicted20Years.toFixed(1)} 정도가 될 것으로 예상돼요.`;
  }
  
  // 근거 생성
  reasons.push(`현재 값은 ${currentValue.toFixed(1)}이고, 매 ${timeUnit > 0 ? Math.round(timeUnit) : 1}년마다 약 ${absSlope.toFixed(1)}씩 ${isIncreasing ? '증가' : '감소'}하고 있어요.`);
  
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

/**
 * 복수 데이터셋의 장기 예측을 생성합니다.
 * @param {Array} results - 각 데이터셋의 분석 결과
 * @param {number} correlation - 상관계수
 * @param {string} data1Name - 첫 번째 데이터 이름
 * @param {string} data2Name - 두 번째 데이터 이름
 * @returns {object} - 장기 예측 객체
 */
export const generateLongTermCorrelationPrediction = (results, correlation, data1Name, data2Name) => {
  const data1Slope = results[0].analysis?.slope || 0;
  const data2Slope = results[1].analysis?.slope || 0;
  const data1Current = results[0].nextVal || 0;
  const data2Current = results[1].nextVal || 0;
  
  // 간단한 추정 (실제로는 더 복잡한 계산 필요)
  const timeUnit = 10; // 기본값
  
  const data1_10Years = data1Current + (data1Slope * timeUnit * 10);
  const data1_20Years = data1Current + (data1Slope * timeUnit * 20);
  const data2_10Years = data2Current + (data2Slope * timeUnit * 10);
  const data2_20Years = data2Current + (data2Slope * timeUnit * 20);
  
  const absCorr = Math.abs(correlation);
  const isPositive = correlation > 0;
  
  let prediction = '';
  let reasons = [];
  
  if (absCorr > 0.7) {
    if (isPositive) {
      prediction = `10년 후에는 ${data1Name}이(가) ${data1_10Years.toFixed(1)} 정도가 되고, ${data2Name}도(도) ${data2_10Years.toFixed(1)} 정도로 함께 변할 것으로 예상돼요. 20년 후에는 각각 ${data1_20Years.toFixed(1)}와(과) ${data2_20Years.toFixed(1)} 정도가 될 거예요.`;
      reasons.push(`두 데이터가 매우 강한 관계(상관계수: ${correlation.toFixed(2)})를 가지고 있어서, 하나가 변하면 다른 하나도 같이 변해요.`);
    } else {
      prediction = `10년 후에는 ${data1Name}이(가) ${data1_10Years.toFixed(1)} 정도가 되면, ${data2Name}은(는) ${data2_20Years.toFixed(1)} 정도로 반대로 변할 것으로 예상돼요.`;
      reasons.push(`두 데이터가 반대 관계(상관계수: ${correlation.toFixed(2)})를 가지고 있어서, 하나가 커지면 다른 하나는 작아져요.`);
    }
  } else {
    prediction = `10년 후에는 ${data1Name}이(가) ${data1_10Years.toFixed(1)} 정도, ${data2Name}은(는) ${data2_10Years.toFixed(1)} 정도가 될 것으로 예상돼요. 20년 후에는 각각 ${data1_20Years.toFixed(1)}와(과) ${data2_20Years.toFixed(1)} 정도가 될 거예요.`;
    reasons.push(`두 데이터의 관계가 약해서(상관계수: ${correlation.toFixed(2)}), 각자 독립적으로 변할 가능성이 높아요.`);
  }
  
  reasons.push(`현재 ${data1Name}은(는) ${data1Current.toFixed(1)}, ${data2Name}은(는) ${data2Current.toFixed(1)}예요.`);
  
  return {
    prediction,
    prediction10Years: {
      data1: data1_10Years,
      data2: data2_10Years
    },
    prediction20Years: {
      data1: data1_20Years,
      data2: data2_20Years
    },
    reasons
  };
};



