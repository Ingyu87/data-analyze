/**
 * 새로고침 후에도 분석 화면을 유지하기 위한 sessionStorage 스냅샷.
 * 탭을 닫으면 브라우저가 비웁니다.
 */

export const STORAGE_KEY = 'data-analyze:v1';
const SNAPSHOT_VERSION = 1;

export const defaultPersistedState = () => ({
  data: null,
  analysis: null,
  aiExplanation: null,
  showQuiz: false,
  quizResults: null,
  showReportWriter: false,
  dynamicExamples: {},
  isEditingAnalysis: false,
  editedAnalysis: null,
  originalAnalysis: null,
  selectedChartType: 'bar',
  editedPrincipleExplanations: {},
  selectedDatasetIndex: 0,
  checkedSteps: {
    'file-upload': false,
    'data-parsing': false,
  },
});

/**
 * @returns {Record<string, unknown>|null} 병합된 초기 상태 조각, 없으면 null
 */
export function loadSnapshot() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SNAPSHOT_VERSION || !parsed.state) return null;
    return { ...defaultPersistedState(), ...parsed.state };
  } catch (e) {
    console.warn('[sessionSnapshot] load failed', e);
    return null;
  }
}

/**
 * @param {ReturnType<typeof defaultPersistedState>} state
 */
export function saveSnapshot(state) {
  if (typeof sessionStorage === 'undefined') return;
  if (!state.data) {
    clearSnapshot();
    return;
  }
  try {
    const payload = JSON.stringify({
      version: SNAPSHOT_VERSION,
      state,
    });
    sessionStorage.setItem(STORAGE_KEY, payload);
  } catch (e) {
    if (e?.name === 'QuotaExceededError') {
      console.warn('[sessionSnapshot] quota exceeded');
    } else {
      console.warn('[sessionSnapshot] save failed', e);
    }
  }
}

export function clearSnapshot() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[sessionSnapshot] clear failed', e);
  }
}
