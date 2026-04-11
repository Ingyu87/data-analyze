/**
 * 기울기를 분석하여 트렌드 설명을 반환합니다.
 * @param {number} slope - 기울기
 * @returns {{desc: string, direction: string}}
 */
export const analyzeSlope = (slope) => {
  const absSlope = Math.abs(slope);
  let desc = "";
  let verb = slope > 0 ? "올라가고" : "내려가고";
  let direction = slope > 0 ? "상승" : "하강";
  
  if (absSlope > 5) {
    desc = `롤러코스터처럼 아주 가파르게 ${verb} 있어!`;
    direction = `급격한 ${direction}`;
  } else if (absSlope > 1) {
    desc = `동산을 오르듯 뚜렷하게 ${verb} 있어.`;
    direction = `뚜렷한 ${direction}`;
  } else if (absSlope > 0.2) {
    desc = `아주 완만하게(천천히) ${verb} 있어.`;
    direction = `완만한 ${direction}`;
  } else {
    desc = "거의 평평한 땅처럼 변화가 없어.";
    direction = "변화 없음";
  }
  
  return { desc, direction };
};

/**
 * 상관계수를 분석하여 설명을 반환합니다.
 * @param {number} r - 상관계수
 * @returns {{title: string, detail: string}}
 */
export const getCorrelationDesc = (r) => {
  if (r > 0.7) {
    return {
      title: "🔥 아주 끈끈한 짝꿍 (양의 관계)",
      detail: "하나가 산을 오르면, 다른 하나도 같이 올라가! 둘은 아주 친해."
    };
  }
  if (r > 0.3) {
    return {
      title: "✨ 사이좋은 친구 (양의 관계)",
      detail: "비슷한 방향으로 움직이고 있어. 하나가 커지면 다른 하나도 커져."
    };
  }
  if (r < -0.7) {
    return {
      title: "❄️ 정반대 청개구리 (음의 관계)",
      detail: "하나가 올라가면 다른 하나는 미끄럼틀 타듯 내려가. 반대야."
    };
  }
  if (r < -0.3) {
    return {
      title: "☁️ 조금 다른 성격 (음의 관계)",
      detail: "하나가 커지려 할 때, 다른 하나는 조금 작아지는 편이야."
    };
  }
  return {
    title: "🎈 서로 남남 (관계 없음)",
    detail: "아무런 규칙이 없어. 서로 상관없이 움직여."
  };
};

/**
 * 단일 데이터셋을 분석합니다.
 * @param {Array} dataset - 데이터 포인트 배열
 * @returns {{slope: number, intercept: number, nextVal: number, analysis: object, stats: object}}
 */
export const analyzeSingleDataset = (dataset) => {
  const n = dataset.length;
  const x = dataset.map((_, i) => i);
  const y = dataset.map(v => v.value);
  
  const sX = x.reduce((a, b) => a + b, 0);
  const sY = y.reduce((a, b) => a + b, 0);
  const sXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sXX = x.reduce((a, b) => a + b * b, 0);
  
  const slope = (n * sXY - sX * sY) / (n * sXX - sX * sX);
  const intercept = (sY - slope * sX) / n;
  const nextVal = slope * n + intercept;
  const analysis = analyzeSlope(slope);
  
  // 통계 계산
  const maxValue = Math.max(...y);
  const minValue = Math.min(...y);
  const avgValue = sY / n;
  
  return { 
    slope, 
    intercept, 
    nextVal, 
    analysis,
    stats: {
      maxValue,
      minValue,
      avgValue,
      range: maxValue - minValue
    }
  };
};

/**
 * 두 데이터셋 간의 상관관계를 분석합니다.
 * @param {Array} dataset1 - 첫 번째 데이터셋
 * @param {Array} dataset2 - 두 번째 데이터셋
 * @returns {{correlation: number, analysis: object}}
 */
export const analyzeCorrelation = (dataset1, dataset2) => {
  const min = Math.min(dataset1.length, dataset2.length);
  const s1 = dataset1.slice(0, min);
  const s2 = dataset2.slice(0, min);
  
  const x = s1.map(v => v.value);
  const y = s2.map(v => v.value);
  
  const mX = x.reduce((a, b) => a + b, 0) / min;
  const mY = y.reduce((a, b) => a + b, 0) / min;
  
  let num = 0;
  let den1 = 0;
  let den2 = 0;
  
  for (let i = 0; i < min; i++) {
    num += (x[i] - mX) * (y[i] - mY);
    den1 += (x[i] - mX) ** 2;
    den2 += (y[i] - mY) ** 2;
  }
  
  const r = num / Math.sqrt(den1 * den2);
  const analysis = getCorrelationDesc(r);
  
  return { correlation: r, analysis };
};
