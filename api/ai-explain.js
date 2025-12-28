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

    } else if (type === 'principle-example') {
      // AI 원리 설명의 동적 예시 생성
      const { step, analysisResult } = data;
      
      let dataContext = '';
      
      if (step === 'graph-visualization') {
        if (analysisResult.type === 'single' && analysisResult.dataset) {
          const sampleData = analysisResult.dataset.slice(0, 5);
          const dataPoints = sampleData.map(d => `${d.label || d.originalLabel}: ${d.value}`).join(', ');
          dataContext = `데이터 이름: ${analysisResult.title}
실제 데이터 예시: ${dataPoints}
데이터 포인트 수: ${analysisResult.dataset.length}개`;
        }
      } else if (step === 'trend-analysis') {
        if (analysisResult.type === 'single') {
          dataContext = `데이터 이름: ${analysisResult.title}
변화 추세: ${analysisResult.trendDesc || analysisResult.trend}
평균 변화량: ${analysisResult.avgChange || '0'}
데이터 포인트 수: ${analysisResult.dataset?.length || 0}개`;
        }
      } else if (step === 'correlation-analysis') {
        if (analysisResult.type === 'multi') {
          dataContext = `데이터 1: ${analysisResult.file1}
데이터 2: ${analysisResult.file2}
상관계수: ${analysisResult.correlation.toFixed(2)}
관계 설명: ${analysisResult.corrTitle || ''}`;
        }
      } else if (step === 'ai-explanation') {
        if (analysisResult.childExplanation) {
          dataContext = `데이터 이름: ${analysisResult.title || analysisResult.file1}
설명 요약: ${analysisResult.childExplanation.summary || ''}
트렌드: ${analysisResult.trendDesc || ''}`;
        }
      } else if (step === 'prediction') {
        if (analysisResult.nextVal !== undefined) {
          dataContext = `데이터 이름: ${analysisResult.title || analysisResult.file1}
현재 마지막 값: ${analysisResult.dataset?.[analysisResult.dataset.length - 1]?.value || 'N/A'}
예측된 다음 값: ${analysisResult.nextVal.toFixed(1)}
장기 예측 (10년 후): ${analysisResult.longTermPrediction?.value10Years?.toFixed(1) || 'N/A'}
장기 예측 (20년 후): ${analysisResult.longTermPrediction?.value20Years?.toFixed(1) || 'N/A'}`;
        }
      } else if (step === 'question-generation') {
        if (analysisResult.dataset) {
          const maxValue = Math.max(...analysisResult.dataset.map(d => d.value));
          const minValue = Math.min(...analysisResult.dataset.map(d => d.value));
          dataContext = `데이터 이름: ${analysisResult.title || analysisResult.file1}
데이터 포인트 수: ${analysisResult.dataset.length}개
최대값: ${maxValue}
최소값: ${minValue}
평균값: ${(analysisResult.dataset.reduce((sum, d) => sum + d.value, 0) / analysisResult.dataset.length).toFixed(1)}`;
        }
      } else if (step === 'grading') {
        if (analysisResult.dataset) {
          dataContext = `데이터 이름: ${analysisResult.title || analysisResult.file1}
데이터 포인트 수: ${analysisResult.dataset.length}개
그래프 유형: ${analysisResult.type === 'single' ? '단일 데이터셋' : '복수 데이터셋'}`;
        }
      } else if (step === 'file-upload' || step === 'data-parsing') {
        // Staging 단계에서는 stagedFiles 정보가 없으므로 기본 예시 사용
        dataContext = `파일 업로드 및 파싱 단계입니다.`;
      }
      
      prompt = `당신은 초등학생을 위한 친절한 AI 원리 설명 전문가입니다. 다음 AI 원리 단계에서 실제 데이터를 기반으로 구체적인 예시를 만들어주세요.

AI 원리 단계: ${step}
${dataContext}

요구사항:
1. 제공된 실제 데이터를 반드시 사용해서 예시를 만들어주세요
2. 초등학생이 이해하기 쉬운 쉬운 말로 작성하세요
3. 한 문장으로 간결하게 작성하세요 (50자 이내)
4. 실제 데이터의 구체적인 숫자나 이름을 포함하세요
5. 이모지나 특수문자는 사용하지 마세요

응답 형식:
{
  "example": "실제 데이터를 사용한 구체적인 예시 한 문장"
}`;

    } else if (type === 'content-safety') {
      // 콘텐츠 안전성 검사
      const { text } = data;
      
      prompt = `당신은 초등학생이 작성한 텍스트를 검사하는 선생님입니다. 다음 텍스트에 부적절한 내용(욕설, 폭언, 비방 등)이 포함되어 있는지 확인해주세요.

텍스트: ${text}

요구사항:
1. 초등학생이 사용할 수 있는 부적절한 단어나 표현이 있는지 확인하세요
2. 욕설, 비방, 폭언, 차별적 표현 등을 찾아주세요
3. 교육적 맥락에서 부적절한 내용인지 판단하세요
4. 일반적인 단어나 학술적 용어는 허용하세요

응답 형식:
{
  "isInappropriate": true/false,
  "detectedWord": "발견된 부적절한 단어 (있는 경우)",
  "reason": "왜 부적절한지 간단한 이유"
}`;

    } else if (type === 'report-feedback') {
      // 보고서 피드백
      const { reportData, analysisResult } = data;
      
      // #region agent log
      console.log('Report feedback request:', {
        hasReportData: !!reportData,
        hasAnalysisResult: !!analysisResult,
        reportDataKeys: reportData ? Object.keys(reportData) : [],
        analysisResultType: analysisResult?.type,
        datasetLength: analysisResult?.dataset?.length || analysisResult?.dataset1?.length || 0
      });
      // #endregion
      
      // 실제 그래프 데이터 정보 추출
      let graphDataInfo = '';
      if (analysisResult) {
        if (analysisResult.type === 'single' && analysisResult.dataset) {
          // 단일 데이터셋
          const sampleData = analysisResult.dataset.slice(0, 10).map(d => 
            `${d.label || d.originalLabel || '항목'}: ${d.value}`
          ).join(', ');
          const allData = analysisResult.dataset.map(d => d.value);
          const maxVal = Math.max(...allData);
          const minVal = Math.min(...allData);
          const avgVal = allData.reduce((a, b) => a + b, 0) / allData.length;
          
          graphDataInfo = `실제 그래프 데이터:
- 데이터 이름: ${analysisResult.title || '데이터'}
- 데이터 포인트 수: ${analysisResult.dataset.length}개
- 데이터 예시: ${sampleData}${analysisResult.dataset.length > 10 ? '...' : ''}
- 최대값: ${maxVal.toFixed(1)}
- 최소값: ${minVal.toFixed(1)}
- 평균값: ${avgVal.toFixed(1)}
- 변화 추세: ${analysisResult.trendDesc || analysisResult.trend || '알 수 없음'}
- 예측된 다음 값: ${analysisResult.nextVal !== undefined ? analysisResult.nextVal.toFixed(1) : 'N/A'}
- 선택한 그래프 타입: ${reportData.selectedChartType || 'line'}`;
        } else if (analysisResult.type === 'multi') {
          // 복수 데이터셋 (상관관계)
          const data1Sample = analysisResult.dataset1?.slice(0, 5).map(d => d.value).join(', ') || '';
          const data2Sample = analysisResult.dataset2?.slice(0, 5).map(d => d.value).join(', ') || '';
          
          graphDataInfo = `실제 그래프 데이터:
- 데이터 1: ${analysisResult.file1 || '데이터1'}
- 데이터 2: ${analysisResult.file2 || '데이터2'}
- 상관계수: ${analysisResult.correlation?.toFixed(2) || 'N/A'}
- 관계 설명: ${analysisResult.corrTitle || 'N/A'}
- 데이터 1 예시: ${data1Sample}${analysisResult.dataset1?.length > 5 ? '...' : ''}
- 데이터 2 예시: ${data2Sample}${analysisResult.dataset2?.length > 5 ? '...' : ''}
- 선택한 그래프 타입: ${reportData.selectedChartType || 'line'}`;
        }
      }
      
      prompt = `당신은 초등학교 수학 교육과정의 '자료와 가능성' 영역 전문가이자 초등학생의 보고서를 평가하는 친절한 선생님입니다. 다음 보고서와 실제 그래프 데이터를 읽고, 교육과정 성취기준과 평가 가이드라인에 근거하여 구체적이고 근거 있는 피드백을 작성해주세요.

${graphDataInfo}

학생이 작성한 보고서:
- 보고서 제목: ${reportData.title}
- 데이터 선정 이유: ${reportData.dataSelectionReason}
- 선택한 그래프: ${reportData.selectedChartType}
- 그래프 선택 이유: ${reportData.chartSelectionReason}
- 그래프를 통해 알 수 있는 사실: ${reportData.findings}
- 미래 예측: ${reportData.futurePrediction}

【교육과정 성취기준 및 평가 가이드라인】

1. 학년군별 성취기준:
   - [1~2학년군] 자료의 정리: 분류, 표/그래프 표현
   - [3~4학년군] 자료의 수집과 정리: 그림그래프, 막대그래프, 꺾은선그래프로 나타내고 해석
   - [5~6학년군] 자료의 수집과 정리 및 가능성: 평균, 띠그래프/원그래프, 탐구 문제 설정, 가능성 예상

2. 평가 고려사항:
   - 실생활 연계: 학생들에게 친근한 소재 활용, 수학의 유용성 인식
   - 적절한 그래프 선택: 자료의 크기 비교→막대그래프, 시간에 따른 변화→꺾은선그래프, 전체에 대한 비율→띠/원그래프
   - 비판적 사고: 자료 수집 목적에 맞게 그래프가 적절히 표현되었는지, 정보를 왜곡하는 오류는 없는지 판단
   - 공학 도구 활용: 그래프를 그릴 때 공학 도구 활용
   - 가능성의 수치화: 가능성을 수로 나타내기

3. 평가 방법:
   - 프로젝트 평가: 탐구 문제 설정부터 결과 발표까지 전 과정 평가
   - 관찰 및 구술 평가: 판단의 근거 설명
   - 자기 및 동료 평가: 학습 성찰

【피드백 작성 요구사항】

1. **반드시 실제 그래프 데이터를 참고**하여 학생이 작성한 내용이 실제 데이터와 일치하는지 확인하세요.
   - 예: "그래프를 보면 2019년에 127로 최대값을 기록했는데, 이를 정확히 파악했어요!" (구체적 수치 언급)
   - 예: "그래프에서 2021년이 109로 가장 낮은 값인데, 이 부분을 언급하지 않았어요." (누락된 사실 지적)

2. **성취기준에 맞춰 평가**하세요:
   - 그래프 선택이 적절한지: 시계열 데이터면 꺾은선그래프가 적합, 항목 비교면 막대그래프가 적합
   - 그래프 해석 능력: 최대값, 최소값, 추세를 정확히 파악했는지
   - 탐구 문제 설정: 학생이 스스로 문제를 설정하고 자료를 수집했는지

3. **평가 가이드라인에 근거**하여 평가하세요:
   - 실생활 연계: 데이터 선정 이유가 실생활과 연결되어 있는지
   - 적절한 그래프 선택: 선택한 그래프가 데이터 특성에 맞는지 (구체적으로 설명)
   - 비판적 사고: 그래프가 목적에 맞게 표현되었는지, 왜곡이 없는지 판단했는지

4. **구체적이고 근거 있는 피드백**을 작성하세요:
   - 잘한 점: "그래프에서 2019년 최대값(127)과 2021년 최소값(109)을 정확히 파악했어요. 또한 시간에 따른 변화를 꺾은선그래프로 선택한 것도 적절해요!" (구체적 수치와 근거 제시)
   - 개선할 점: "그래프를 보면 2018년부터 2019년까지 증가하다가 2020년부터 감소하는 패턴이 보이는데, 이 추세를 더 자세히 설명하면 좋을 것 같아요. 또한 평균값(${analysisResult?.stats?.avgValue ? analysisResult.stats.avgValue.toFixed(1) : '계산 필요'})을 언급하면 더 좋겠어요." (구체적 개선 사항과 근거)
   - 추가 제안: "이 데이터를 띠그래프나 원그래프로도 표현해보면 전체에서 각 연도가 차지하는 비율을 알 수 있어요. 또한 '앞으로 외국인 수가 증가할 가능성이 높다'는 예측을 수로 나타내면(예: 70% 가능성) 더 구체적이에요." (실제 데이터 기반 구체적 제안)

5. **절대 하지 말아야 할 것**:
   - "잘했어요", "좋아요" 같은 근거 없는 칭찬 금지
   - "더 자세히 쓰세요" 같은 모호한 지적 금지
   - 실제 데이터와 무관한 일반적인 피드백 금지

6. 초등학생 수준에 맞게 친절하고 격려하는 톤으로 작성하되, 반드시 구체적인 근거를 제시하세요.

7. 각 항목은 3-5문장으로 작성하되, 반드시 실제 그래프 데이터의 구체적 수치나 패턴을 언급하세요.

응답 형식:
{
  "strengths": "잘한 점에 대한 칭찬과 격려 (실제 그래프 데이터의 구체적 수치/패턴을 언급하며 근거 제시)",
  "improvements": "개선할 점에 대한 건설적인 제안 (실제 그래프 데이터의 구체적 수치/패턴을 언급하며 근거 제시)",
  "suggestions": "추가로 생각해볼 수 있는 내용 제안 (실제 그래프 데이터를 기반으로 구체적 제안)"
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

