/**
 * AI를 사용하여 부적절한 내용을 동적으로 감지합니다.
 */

/**
 * 텍스트가 부적절한 내용을 포함하는지 AI로 검사합니다.
 * @param {string} text - 검사할 텍스트
 * @returns {Promise<{safe: boolean, word?: string, reason?: string}>}
 */
export const checkContentSafety = async (text) => {
  if (!text || text.trim() === '') {
    return { safe: true };
  }

  try {
    const response = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'content-safety',
        data: {
          text
        }
      })
    });

    if (!response.ok) {
      // API 실패 시 안전하게 처리 (기본적으로 허용)
      return { safe: true };
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        safe: !result.data.isInappropriate,
        word: result.data.detectedWord,
        reason: result.data.reason
      };
    }

    return { safe: true };
  } catch (error) {
    console.error('콘텐츠 안전성 검사 오류:', error);
    // 오류 발생 시 안전하게 처리
    return { safe: true };
  }
};

