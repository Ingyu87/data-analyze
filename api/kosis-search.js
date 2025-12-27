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
      // API 키는 URL 인코딩 필요 (특수문자 포함 가능)
      const encodedApiKey = encodeURIComponent(apiKey.trim());
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      
      const searchUrls = [
        // 방법 1: 키워드 검색 (가장 일반적인 방법)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&keyword=${encodedQuery}`,
        // 방법 2: 통계표 목록 조회 (userStatsId 사용)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&userStatsId=${encodedQuery}`,
        // 방법 3: 통계표 검색 API
        `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&keyword=${encodedQuery}`,
        // 방법 4: 간단한 형식 (jsonVD 없음)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=json&keyword=${encodedQuery}`,
        // 방법 5: XML 형식도 시도 (JSON으로 파싱 시도)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=xml&keyword=${encodedQuery}`,
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
              // XML 응답인 경우 처리
              if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<')) {
                console.log('KOSIS API XML 응답 감지, JSON으로 변환 시도');
                // XML은 나중에 처리하거나 다른 방법 시도
                lastError = new Error('XML 형식 응답 (JSON 파싱 불가)');
                lastResponse = responseText;
                continue;
              }
              
              const data = JSON.parse(responseText);
              console.log('KOSIS API 성공, 데이터 구조:', Object.keys(data));
              console.log('KOSIS API 전체 응답:', JSON.stringify(data).substring(0, 1000));
              
              // 응답 코드 확인 (KOSIS API 오류 코드)
              const retCode = data.RET_CODE || data.retCode || data.RetCode || data.code;
              if (retCode === '-100' || retCode === '100' || retCode === '-1') {
                console.log('KOSIS API: 검색결과 없음 또는 오류 코드:', retCode);
                return res.status(200).json({ 
                  success: true, 
                  data: [],
                  message: '검색 결과가 없습니다',
                  retCode: retCode
                });
              }
              
              // API 키 오류 확인
              if (retCode === '-200' || retCode === '-201' || retCode === '-202' || 
                  responseText.includes('인증') || responseText.includes('API') || 
                  responseText.includes('key') || responseText.includes('Key')) {
                console.error('KOSIS API 키 오류:', retCode, responseText.substring(0, 200));
                return res.status(401).json({
                  success: false,
                  error: 'KOSIS API 키 오류',
                  message: 'API 키가 올바르지 않거나 만료되었습니다. KOSIS 공유서비스에서 키를 확인해주세요.',
                  retCode: retCode
                });
              }
              
              // 응답 구조 확인 및 반환
              return res.status(200).json({ 
                success: true, 
                data,
                debug: {
                  url: searchUrl.substring(0, 150),
                  dataKeys: Object.keys(data),
                  retCode: retCode
                }
              });
            } catch (parseError) {
              console.error('JSON 파싱 오류:', parseError);
              console.error('응답 텍스트:', responseText.substring(0, 500));
              lastError = new Error(`JSON 파싱 실패: ${parseError.message}`);
              lastResponse = responseText;
              continue;
            }
          } else {
            const errorPreview = responseText.substring(0, 500);
            lastError = new Error(`KOSIS API HTTP 오류 (${response.status}): ${errorPreview}`);
            lastResponse = responseText;
            console.error('KOSIS API HTTP 오류:', response.status, errorPreview);
            
            // 401, 403은 API 키 문제일 가능성
            if (response.status === 401 || response.status === 403) {
              return res.status(response.status).json({
                success: false,
                error: 'KOSIS API 인증 오류',
                message: 'API 키가 올바르지 않거나 권한이 없습니다. KOSIS 공유서비스에서 키를 확인해주세요.',
                details: errorPreview
              });
            }
          }
        } catch (err) {
          console.error(`KOSIS API 시도 ${i + 1} 실패:`, err.message);
          lastError = err;
          continue;
        }
      }
      
      // 모든 시도 실패
      console.error('모든 KOSIS API 엔드포인트 시도 실패');
      console.error('마지막 오류:', lastError?.message);
      console.error('마지막 응답:', lastResponse?.substring(0, 1000));
      
      return res.status(500).json({ 
        success: false,
        error: 'KOSIS API 호출 실패', 
        message: lastError?.message || '모든 엔드포인트 시도 실패',
        details: lastResponse ? `마지막 응답: ${lastResponse.substring(0, 1000)}` : '응답 없음',
        suggestion: '다음을 확인해주세요:\n1. KOSIS API 키가 올바른지 확인 (공백, 특수문자 포함 여부)\n2. Vercel 환경변수에 KOSIS_API_KEY가 설정되어 있는지 확인\n3. KOSIS 공유서비스에서 API 키 상태 확인\n4. API 키가 만료되지 않았는지 확인',
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : '없음'
      });
      
    } else if (statId) {
      // 통계표 데이터 조회
      const encodedApiKey = encodeURIComponent(apiKey.trim());
      const encodedStatId = encodeURIComponent(statId.trim());
      
      const dataUrls = [
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&userStatsId=${encodedStatId}`,
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${encodedApiKey}&format=json&userStatsId=${encodedStatId}`,
        `https://kosis.kr/openapi/statisticsData.do?apiKey=${encodedApiKey}&format=json&userStatsId=${encodedStatId}`
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
