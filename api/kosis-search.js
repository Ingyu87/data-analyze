// KOSIS 국가통계포털 API 프록시
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchQuery, statId } = req.body;
  const apiKey = process.env.KOSIS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'KOSIS_API_KEY 환경변수가 설정되지 않았습니다',
      message: 'Vercel 환경변수에 KOSIS_API_KEY를 설정해주세요'
    });
  }

  try {
    if (searchQuery) {
      // 통계표 검색 - 여러 가능한 엔드포인트 시도
      const searchUrls = [
        `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${apiKey}&format=json&jsonVD=Y&userStatsId=${encodeURIComponent(searchQuery)}`,
        `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${apiKey}&format=json&userStatsId=${encodeURIComponent(searchQuery)}`,
        `https://kosis.kr/openapi/statisticsSearch.do?apiKey=${apiKey}&format=json&userStatsId=${encodeURIComponent(searchQuery)}`
      ];
      
      let lastError = null;
      for (const searchUrl of searchUrls) {
        try {
          const response = await fetch(searchUrl, {
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            return res.status(200).json({ success: true, data });
          } else {
            const errorText = await response.text();
            lastError = new Error(`KOSIS API 오류 (${response.status}): ${errorText.substring(0, 200)}`);
          }
        } catch (err) {
          lastError = err;
          continue; // 다음 URL 시도
        }
      }
      
      throw lastError || new Error('모든 KOSIS API 엔드포인트 시도 실패');
      
    } else if (statId) {
      // 통계표 데이터 조회
      const dataUrls = [
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${apiKey}&format=json&jsonVD=Y&userStatsId=${encodeURIComponent(statId)}`,
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${apiKey}&format=json&userStatsId=${encodeURIComponent(statId)}`,
        `https://kosis.kr/openapi/statisticsData.do?apiKey=${apiKey}&format=json&userStatsId=${encodeURIComponent(statId)}`
      ];
      
      let lastError = null;
      for (const dataUrl of dataUrls) {
        try {
          const response = await fetch(dataUrl, {
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            return res.status(200).json({ success: true, data });
          } else {
            const errorText = await response.text();
            lastError = new Error(`KOSIS API 오류 (${response.status}): ${errorText.substring(0, 200)}`);
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      
      throw lastError || new Error('모든 KOSIS API 엔드포인트 시도 실패');
      
    } else {
      return res.status(400).json({ error: 'searchQuery 또는 statId가 필요합니다' });
    }
  } catch (error) {
    console.error('KOSIS API 오류:', error);
    return res.status(500).json({ 
      error: 'KOSIS API 호출 실패', 
      message: error.message,
      details: 'KOSIS API 키가 올바른지, API 엔드포인트가 변경되지 않았는지 확인해주세요.'
    });
  }
}
