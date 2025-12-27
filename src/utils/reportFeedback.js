/**
 * 보고서에 대한 AI 피드백을 생성합니다.
 */

export const generateReportFeedback = async (reportData, analysisResult) => {
  try {
    const response = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'report-feedback',
        data: {
          reportData,
          analysisResult
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('보고서 피드백 생성 오류:', error);
    // 폴백 피드백 반환
    return {
      strengths: '보고서를 작성해주셔서 감사합니다. 계속 노력해주세요!',
      improvements: '더 구체적인 설명을 추가하면 좋을 것 같아요.',
      suggestions: '그래프를 자세히 관찰하고 더 많은 사실을 찾아보세요.'
    };
  }
};

