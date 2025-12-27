/**
 * Vercel Serverless Function
 * Upstage API를 사용하여 초등학생용 설명을 생성합니다.
 * API 키는 서버 사이드에서만 사용되므로 안전합니다.
 */

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    const apiKey = process.env.UPSTAGE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set UPSTAGE_API_KEY in Vercel environment variables.' 
      });
    }

    let prompt = '';

    if (type === 'single') {
      // 단일 데이터셋 설명
      const { dataName, slope, avgValue, maxValue, minValue, trend, nextVal, dataPoints } = data;
      
      prompt = `당신은 초등학생을 위한 친절한 데이터 설명 전문가입니다. 다음 데이터를 분석해서 초등학생이 이해하기 쉽게 설명해주세요.

데이터 이름: ${dataName}
데이터 포인트 수: ${dataPoints}개
평균값: ${avgValue.toFixed(1)}
최대값: ${maxValue.toFixed(1)}
최소값: ${minValue.toFixed(1)}
변화 추세: ${trend}
변화율: ${slope > 0 ? '+' : ''}${slope.toFixed(2)} (매 단계마다)
예측된 다음 값: ${nextVal.toFixed(1)}

요구사항:
1. 초등학생이 이해할 수 있는 쉬운 단어와 비유를 사용하세요
2. 데이터가 어떻게 변하고 있는지 구체적으로 설명하세요
3. 왜 그렇게 변하는지 근거를 제시하세요 (통계적 근거 포함)
4. 미래 예측에 대한 설명과 그 근거를 포함하세요
5. 친근하고 따뜻한 톤으로 작성하세요
6. 이모지를 적절히 사용하세요

응답 형식:
{
  "summary": "한 문장 요약",
  "detailedExplanation": "상세한 설명 (3-4문단)",
  "analogy": "비유 설명",
  "evidence": ["근거1", "근거2", "근거3"],
  "futurePrediction": "미래 예측 설명",
  "predictionEvidence": ["예측 근거1", "예측 근거2"]
}`;

    } else if (type === 'correlation') {
      // 상관관계 설명
      const { data1Name, data2Name, correlation, data1Stats, data2Stats, realWorldExample } = data;
      
      prompt = `당신은 초등학생을 위한 친절한 데이터 설명 전문가입니다. 두 데이터의 관계를 분석해서 초등학생이 이해하기 쉽게 설명해주세요.

데이터 1: ${data1Name}
- 평균값: ${data1Stats.avgValue.toFixed(1)}
- 최대값: ${data1Stats.maxValue.toFixed(1)}
- 최소값: ${data1Stats.minValue.toFixed(1)}

데이터 2: ${data2Name}
- 평균값: ${data2Stats.avgValue.toFixed(1)}
- 최대값: ${data2Stats.maxValue.toFixed(1)}
- 최소값: ${data2Stats.minValue.toFixed(1)}

상관계수: ${correlation.toFixed(2)} (${correlation > 0.7 ? '매우 강한 양의 관계' : correlation > 0.3 ? '양의 관계' : correlation < -0.7 ? '매우 강한 음의 관계' : correlation < -0.3 ? '음의 관계' : '관계 없음'})

요구사항:
1. 초등학생이 이해할 수 있는 쉬운 단어와 비유를 사용하세요
2. 두 데이터가 어떤 관계인지 구체적으로 설명하세요
3. 실생활 예시를 들어서 설명하세요 (예: "날씨가 추우면 학생들의 기분이 안 좋을 수 있어요")
4. 왜 그런 관계인지 근거를 제시하세요
5. 미래에 두 데이터가 어떻게 변할지 예측하고 근거를 제시하세요
6. 친근하고 따뜻한 톤으로 작성하세요
7. 이모지를 적절히 사용하세요

응답 형식:
{
  "relationship": "관계 설명 (한 문장)",
  "detailedExplanation": "상세한 설명 (3-4문단)",
  "realWorldExample": "실생활 예시",
  "evidence": ["근거1", "근거2", "근거3"],
  "futurePrediction": "미래 예측 설명",
  "futurePredictionEvidence": ["예측 근거1", "예측 근거2"]
}`;
    }

    // Upstage API 호출
    const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'solar-1-mini-chat',
        messages: [
          {
            role: 'system',
            content: '당신은 초등학생을 위한 친절하고 이해하기 쉬운 데이터 설명 전문가입니다. 항상 JSON 형식으로 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Upstage API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'AI API 호출 실패',
        details: errorData 
      });
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content || '';

    // JSON 파싱 시도
    try {
      const parsed = JSON.parse(aiResponse);
      return res.status(200).json({ success: true, data: parsed });
    } catch (parseError) {
      // JSON이 아닌 경우 그대로 반환
      return res.status(200).json({ 
        success: true, 
        data: { 
          detailedExplanation: aiResponse,
          summary: aiResponse.substring(0, 100) + '...'
        } 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

