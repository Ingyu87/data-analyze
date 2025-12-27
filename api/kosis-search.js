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
      // 통계표 검색 - KOSIS API 실제 구조에 맞게 수정
      // KOSIS OpenAPI는 여러 방법을 지원하므로 여러 방식 시도
      const searchUrls = [
        // 방법 1: 통계표 목록 조회 (키워드 검색)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${apiKey}&format=json&jsonVD=Y&userStatsId=${encodeURIComponent(searchQuery)}`,
        // 방법 2: 통계표 검색
        `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${apiKey}&format=json&jsonVD=Y&userStatsId=${encodeURIComponent(searchQuery)}`,
        // 방법 3: 간단한 형식
        `https://kosis.kr/openapi/statisticsList.do?apiKey=${apiKey}&format=json&userStatsId=${encodeURIComponent(searchQuery)}`,
        // 방법 4: 키워드 검색 (다른 파라미터)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${apiKey}&format=json&jsonVD=Y&keyword=${encodeURIComponent(searchQuery)}`,
      ];
      
      let lastError = null;
      let lastResponse = null;
      
      for (let i = 0; i < searchUrls.length; i++) {
        const searchUrl = searchUrls[i];
        try {
          console.log(`KOSIS API 시도 ${i + 1}: ${searchUrl.substring(0, 100)}...`);
          
          const response = await fetch(searchUrl, {
            headers: {
              'Accept': 'application/json',
            },
            timeout: 10000
          });
          
          const responseText = await response.text();
          console.log(`KOSIS API 응답 ${i + 1} (${response.status}):`, responseText.substring(0, 500));
          
          if (response.ok) {
            try {
              const data = JSON.parse(responseText);
              console.log('KOSIS API 성공, 데이터 구조:', Object.keys(data));
              
              // 응답 구조 확인 및 반환
              return res.status(200).json({ 
                success: true, 
                data,
                debug: {
                  url: searchUrl.substring(0, 100),
                  dataKeys: Object.keys(data)
                }
              });
            } catch (parseError) {
              console.error('JSON 파싱 오류:', parseError);
              lastError = new Error(`JSON 파싱 실패: ${parseError.message}`);
              lastResponse = responseText;
              continue;
            }
          } else {
            lastError = new Error(`KOSIS API 오류 (${response.status}): ${responseText.substring(0, 200)}`);
            lastResponse = responseText;
          }
        } catch (err) {
          console.error(`KOSIS API 시도 ${i + 1} 실패:`, err.message);
          lastError = err;
          continue;
        }
      }
      
      // 모든 시도 실패
      return res.status(500).json({ 
        error: 'KOSIS API 호출 실패', 
        message: lastError?.message || '모든 엔드포인트 시도 실패',
        details: lastResponse ? `마지막 응답: ${lastResponse.substring(0, 500)}` : '응답 없음',
        suggestion: 'KOSIS API 키와 엔드포인트를 확인해주세요. KOSIS 공유서비스에서 API 사용법을 확인하세요.'
      });
      
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
