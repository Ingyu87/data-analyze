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
      // 통계표 검색
      const searchUrl = `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${apiKey}&format=json&jsonVD=Y&userStatsId=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`KOSIS API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } else if (statId) {
      // 통계표 데이터 조회
      const dataUrl = `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${apiKey}&format=json&jsonVD=Y&userStatsId=${encodeURIComponent(statId)}`;
      
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`KOSIS API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(400).json({ error: 'searchQuery 또는 statId가 필요합니다' });
    }
  } catch (error) {
    console.error('KOSIS API 오류:', error);
    return res.status(500).json({ 
      error: 'KOSIS API 호출 실패', 
      message: error.message 
    });
  }
}

