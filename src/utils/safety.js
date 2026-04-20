import { FORBIDDEN_WORDS } from '../constants';

/**
 * 텍스트에서 금지 단어를 검사합니다.
 * @param {string} text - 검사할 텍스트
 * @returns {{safe: boolean, word?: string}} - 안전 여부와 발견된 단어
 */
export const checkSafety = (text) => {
  if (!text) return { safe: true };
  
  for (let word of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      return { safe: false, word };
    }
  }
  
  return { safe: true };
};




