/**
 * 보고서에 대한 AI 피드백을 생성합니다.
 * 4학년 수학과 교육과정 성취기준 및 평가계획 기반
 */

// 4학년 성취기준 및 평가 루브릭
const ACHIEVEMENT_STANDARDS = {
  '[4수04-02]': '자료를 수집하여 꺾은선그래프로 나타내고 해석할 수 있다.',
  '[4수04-03]': '탐구 문제를 해결하기 위해 자료를 수집, 정리하여 막대그래프나 꺾은선그래프로 나타내고 해석할 수 있다.'
};

const RUBRIC = {
  '그래프 표현': {
    상: '자료의 특성을 고려하여 눈금 한 칸의 크기와 물결선의 위치를 적절히 정하고 정확하게 그릴 수 있다.',
    중: '자료를 꺾은선그래프로 나타낼 수 있으나 눈금 설정이나 물결선 사용이 다소 미흡하다.',
    하: '꺾은선그래프의 기본 요소(가로, 세로, 눈금 등)를 채우거나 점을 찍는 데 어려움이 있다.'
  },
  '자료 해석 및 추론': {
    상: '그래프를 보고 변화의 경향을 상세히 설명하며, 자료에 없는 중간값이나 미래의 변화를 논리적으로 예측할 수 있다.',
    중: '그래프에 나타난 통계적 사실(최댓값, 최솟값 등)을 찾아 말할 수 있다.',
    하: '그래프의 가로축과 세로축이 나타내는 값을 읽는 수준에 그친다.'
  },
  '그래프 선택 및 유용성': {
    상: '자료 수집 목적에 따라 막대그래프와 꺾은선그래프 중 알맞은 것을 선택하고 그 이유를 타당하게 설명할 수 있다.',
    중: '자료의 특성에 따라 적절한 그래프를 선택할 수 있다.',
    하: '자료의 특성과 관계없이 익숙한 그래프 형태로만 나타내려 한다.'
  },
  '태도 및 정보처리': {
    상: '실생활 문제 해결에 적극적으로 참여하며, 공학 도구(이지통계 등)를 활용하여 자료를 효율적으로 처리한다.',
    중: '자료 수집 및 정리 과정에 성실히 참여하며 도구 사용법을 익히려 노력한다.',
    하: '자료 수집이나 도구 활용 과정에서 타인의 도움을 지속적으로 필요로 한다.'
  }
};

/**
 * 퀴즈 결과를 기반으로 학생의 성취 수준을 평가합니다.
 */
const evaluateAchievementLevel = (quizResults) => {
  if (!quizResults || !quizResults.results) {
    return { level: '하', score: 0 };
  }

  const score = (quizResults.totalScore / quizResults.maxScore) * 100;
  
  if (score >= 80) return { level: '상', score };
  if (score >= 60) return { level: '중', score };
  return { level: '하', score };
};

/**
 * 성취기준 기반 피드백을 생성합니다.
 */
export const generateReportFeedback = async (reportData, analysisResult, quizResults) => {
  try {
    // 퀴즈 결과가 있으면 성취 수준 평가
    const achievementLevel = quizResults ? evaluateAchievementLevel(quizResults) : null;
    
    // AI API 호출
    const response = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'report-feedback',
        data: {
          reportData,
          analysisResult,
          quizResults,
          achievementLevel,
          achievementStandards: ACHIEVEMENT_STANDARDS,
          rubric: RUBRIC
        },
        prompt: generateFeedbackPrompt(reportData, analysisResult, quizResults, achievementLevel)
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    // 폴백: 기본 피드백 생성
    return generateFallbackFeedback(analysisResult, quizResults, achievementLevel);
  } catch (error) {
    console.error('보고서 피드백 생성 오류:', error);
    // 폴백 피드백 반환
    return generateFallbackFeedback(analysisResult, quizResults, null);
  }
};

/**
 * AI 프롬프트 생성
 */
const generateFeedbackPrompt = (reportData, analysisResult, quizResults, achievementLevel) => {
  let prompt = `초등학교 4학년 학생의 데이터 분석 보고서에 대한 피드백을 작성해주세요.

**4학년 수학과 교육과정 성취기준:**
- [4수04-02] 자료를 수집하여 꺾은선그래프로 나타내고 해석할 수 있다.
- [4수04-03] 탐구 문제를 해결하기 위해 자료를 수집, 정리하여 막대그래프나 꺾은선그래프로 나타내고 해석할 수 있다.

**평가 루브릭:**
`;

  Object.entries(RUBRIC).forEach(([category, levels]) => {
    prompt += `\n${category}:\n`;
    prompt += `- 상: ${levels.상}\n`;
    prompt += `- 중: ${levels.중}\n`;
    prompt += `- 하: ${levels.하}\n`;
  });

  prompt += `\n**분석 결과:**\n`;
  if (analysisResult) {
    if (analysisResult.type === 'single') {
      prompt += `- 그래프 유형: 단일 데이터셋 분석\n`;
      prompt += `- 트렌드: ${analysisResult.trend}\n`;
      prompt += `- 예측값: ${analysisResult.nextVal}\n`;
    } else {
      prompt += `- 그래프 유형: 상관관계 분석\n`;
      prompt += `- 상관계수: ${analysisResult.correlation}\n`;
    }
  }

  if (quizResults) {
    prompt += `\n**퀴즈 결과:**\n`;
    prompt += `- 점수: ${quizResults.totalScore}/${quizResults.maxScore}점\n`;
    prompt += `- 정답률: ${quizResults.correctCount}/${quizResults.totalQuestions}문제\n`;
    
    if (achievementLevel) {
      prompt += `- 성취 수준: ${achievementLevel.level} (${achievementLevel.score.toFixed(1)}%)\n`;
    }
  }

  prompt += `\n**요청사항:**
1. 4학년 학생 수준에 맞는 친절하고 격려하는 톤으로 작성해주세요.
2. 성취기준과 루브릭을 바탕으로 구체적인 피드백을 제공해주세요.
3. 잘한 점(strengths), 개선할 점(improvements), 다음 단계 제안(suggestions)을 포함해주세요.
4. 그래프 해석 능력, 변화 경향 파악 능력, 미래 예측 능력을 중점적으로 평가해주세요.
5. 선분의 기울어진 정도를 보고 변화가 급격한지 완만한지 판단하는 능력을 언급해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "strengths": "잘한 점을 구체적으로 설명",
  "improvements": "개선할 점을 구체적으로 설명",
  "suggestions": "다음 단계 제안",
  "rubricEvaluation": {
    "그래프 표현": "상/중/하",
    "자료 해석 및 추론": "상/중/하",
    "그래프 선택 및 유용성": "상/중/하",
    "태도 및 정보처리": "상/중/하"
  },
  "achievementStandard": "[4수04-02] 또는 [4수04-03]",
  "encouragement": "격려 메시지"
}`;

  return prompt;
};

/**
 * 폴백 피드백 생성
 */
const generateFallbackFeedback = (analysisResult, quizResults, achievementLevel) => {
  const feedback = {
    strengths: '',
    improvements: '',
    suggestions: '',
    rubricEvaluation: {
      '그래프 표현': '중',
      '자료 해석 및 추론': '중',
      '그래프 선택 및 유용성': '중',
      '태도 및 정보처리': '중'
    },
    achievementStandard: '[4수04-02]',
    encouragement: '계속 노력하면 더 좋은 결과를 얻을 수 있어요!'
  };

  if (quizResults) {
    const score = (quizResults.totalScore / quizResults.maxScore) * 100;
    
    if (score >= 80) {
      feedback.strengths = '그래프를 정확하게 읽고 해석하는 능력이 뛰어나요! 최댓값, 최솟값, 평균값을 잘 찾았고, 변화의 경향도 잘 파악했어요.';
      feedback.improvements = '이제 물결선을 사용하여 그래프를 더 읽기 쉽게 만드는 방법을 배워보면 좋을 것 같아요.';
      feedback.suggestions = '다양한 데이터로 연습하여 그래프 해석 실력을 더 키워보세요.';
      feedback.rubricEvaluation['자료 해석 및 추론'] = '상';
    } else if (score >= 60) {
      feedback.strengths = '그래프의 기본적인 정보를 읽을 수 있어요. 최댓값과 최솟값을 찾는 연습을 잘 하고 있네요.';
      feedback.improvements = '변화의 경향을 더 자세히 관찰하고, 미래 값을 예측하는 연습을 해보면 좋을 것 같아요.';
      feedback.suggestions = '그래프를 자세히 관찰하고, 선이 어떻게 변하는지 주의 깊게 살펴보세요.';
      feedback.rubricEvaluation['자료 해석 및 추론'] = '중';
    } else {
      feedback.strengths = '그래프를 읽으려고 노력하는 모습이 좋아요.';
      feedback.improvements = '그래프의 가로축과 세로축이 무엇을 나타내는지 다시 확인하고, 값을 정확히 읽는 연습이 필요해요.';
      feedback.suggestions = '그래프의 기본 요소(가로축, 세로축, 눈금)를 다시 공부하고, 간단한 그래프부터 연습해보세요.';
      feedback.rubricEvaluation['자료 해석 및 추론'] = '하';
    }
  } else {
    feedback.strengths = '데이터를 분석하고 그래프로 나타내는 과정에 참여한 점이 좋아요!';
    feedback.improvements = '그래프를 더 자세히 관찰하고, 변화의 경향을 파악하는 연습을 해보면 좋을 것 같아요.';
    feedback.suggestions = '퀴즈를 풀어보면서 그래프 해석 능력을 확인해보세요.';
  }

  return feedback;
};
