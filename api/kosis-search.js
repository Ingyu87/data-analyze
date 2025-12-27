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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:17',message:'API key check',data:{hasApiKey:!!apiKey,apiKeyLength:apiKey?.length||0,searchQuery,statId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

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
      const trimmedApiKey = apiKey.trim();
      const trimmedQuery = searchQuery.trim();
      const encodedApiKey = encodeURIComponent(trimmedApiKey);
      const encodedQuery = encodeURIComponent(trimmedQuery);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:31',message:'Before URL encoding',data:{apiKeyLength:trimmedApiKey.length,apiKeyStart:trimmedApiKey.substring(0,10),query:trimmedQuery,encodedApiKeyLength:encodedApiKey.length,encodedQueryLength:encodedQuery.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const searchUrls = [
        // 방법 1: statisticsSearch.do (searchNm 파라미터 사용 - 필수일 수 있음)
        `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&searchNm=${encodedQuery}`,
        // 방법 2: statisticsSearch.do (keyword와 searchNm 둘 다)
        `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&keyword=${encodedQuery}&searchNm=${encodedQuery}`,
        // 방법 3: statisticsSearch.do (keyword만, jsonVD 없음)
        `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${encodedApiKey}&format=json&keyword=${encodedQuery}`,
        // 방법 4: statisticsList.do (orgId=101 통계청, keyword 사용)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&orgId=101&keyword=${encodedQuery}`,
        // 방법 5: statisticsList.do (orgId=301 교육부, keyword 사용)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&orgId=301&keyword=${encodedQuery}`,
        // 방법 6: statisticsList.do (전체 조직, keyword 사용)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&keyword=${encodedQuery}`,
        // 방법 7: statisticsList.do (orgId 없이, jsonVD 없음)
        `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${encodedApiKey}&format=json&keyword=${encodedQuery}`,
      ];
      
      let lastError = null;
      let lastResponse = null;
      
      for (let i = 0; i < searchUrls.length; i++) {
        const searchUrl = searchUrls[i];
        try {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:50',message:'Before API call',data:{attempt:i+1,url:searchUrl,urlLength:searchUrl.length,hasApiKeyParam:searchUrl.includes('apiKey='),hasKeywordParam:searchUrl.includes('keyword='),hasOrgId:searchUrl.includes('orgId=')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          console.log(`KOSIS API 시도 ${i + 1}: ${searchUrl.substring(0, 100)}...`);
          
          const response = await fetch(searchUrl, {
            headers: {
              'Accept': 'application/json',
            },
            timeout: 10000
          });
          
          const responseText = await response.text();
          console.log(`KOSIS API 응답 ${i + 1} (${response.status}):`, responseText.substring(0, 500));
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:82',message:'After API response',data:{attempt:i+1,status:response.status,url:searchUrl.substring(0,150),responseLength:responseText.length,responsePreview:responseText.substring(0,300),isArray:responseText.trim().startsWith('['),isObject:responseText.trim().startsWith('{'),fullResponse:responseText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          
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
              
              // KOSIS API 응답 파싱 시도
              let data;
              try {
                data = JSON.parse(responseText);
              } catch (parseErr) {
                // JSON 파싱 실패 - KOSIS API가 JavaScript 객체 리터럴 형식으로 응답할 수 있음
                // 예: {err:"20",errMsg:"..."} -> {"err":"20","errMsg":"..."}
                console.log('JSON 파싱 실패, JavaScript 객체 리터럴로 시도:', parseErr.message);
                
                // 안전하게 eval 사용 (응답이 신뢰할 수 있는 소스에서 오므로)
                try {
                  // 응답을 함수로 감싸서 평가 (보안상 더 안전)
                  const func = new Function('return ' + responseText);
                  data = func();
                } catch (evalErr) {
                  // eval도 실패하면 원본 오류 사용
                  throw new Error(`JSON 파싱 실패: ${parseErr.message}. 응답: ${responseText.substring(0, 200)}`);
                }
              }
              console.log('KOSIS API 성공, 데이터 구조:', Array.isArray(data) ? `Array(${data.length})` : Object.keys(data));
              console.log('KOSIS API 전체 응답:', JSON.stringify(data).substring(0, 1000));
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:76',message:'After JSON parse',data:{attempt:i+1,isArray:Array.isArray(data),dataLength:Array.isArray(data)?data.length:0,dataKeys:Array.isArray(data)?[]:Object.keys(data),firstItem:Array.isArray(data)&&data.length>0?data[0]:null,hasErr:Array.isArray(data)&&data.length>0&&data[0]?.err?true:false,errCode:Array.isArray(data)&&data.length>0?data[0]?.err:null,errMsg:Array.isArray(data)&&data.length>0?data[0]?.errMsg:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
              
              // 배열 응답인 경우 (오류 메시지 포함 가능)
              if (Array.isArray(data)) {
                // 첫 번째 요소가 오류인지 확인
                if (data.length > 0 && data[0] && typeof data[0] === 'object') {
                  const firstItem = data[0];
                  // 오류 코드 확인
                  if (firstItem.err || firstItem.errMsg || firstItem.error) {
                    const errCode = firstItem.err || firstItem.error;
                    const errMsg = firstItem.errMsg || firstItem.message || '알 수 없는 오류';
                    console.error('KOSIS API 오류 응답:', errCode, errMsg);
                    
                    // 오류 코드별 처리
                    if (errCode === '20' || errMsg.includes('필수') || errMsg.includes('누락')) {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:92',message:'Missing parameter error detected',data:{attempt:i+1,errCode,errMsg,url:searchUrl,willTryNext:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                      // 필수 파라미터 누락 - 다른 엔드포인트 시도
                      lastError = new Error(`필수 파라미터 누락: ${errMsg}`);
                      lastResponse = responseText;
                      continue;
                    } else if (errCode === '-200' || errCode === '-201' || errCode === '-202' || 
                               errMsg.includes('인증') || errMsg.includes('API') || errMsg.includes('key')) {
                      return res.status(401).json({
                        success: false,
                        error: 'KOSIS API 키 오류',
                        message: 'API 키가 올바르지 않거나 만료되었습니다. KOSIS 공유서비스에서 키를 확인해주세요.',
                        errCode: errCode,
                        errMsg: errMsg
                      });
                    } else {
                      // 다른 오류 - 마지막 시도가 아니면 계속
                      lastError = new Error(`KOSIS API 오류 (${errCode}): ${errMsg}`);
                      lastResponse = responseText;
                      continue;
                    }
                  }
                }
                
                // 오류가 아니면 데이터 반환
                const validData = data.filter(item => !item.err && !item.error);
                if (validData.length > 0) {
                  return res.status(200).json({ 
                    success: true, 
                    data: validData,
                    debug: {
                      url: searchUrl.substring(0, 150),
                      totalItems: data.length,
                      validItems: validData.length
                    }
                  });
                } else {
                  // 모든 항목이 오류인 경우
                  lastError = new Error('모든 응답 항목이 오류입니다');
                  lastResponse = responseText;
                  continue;
                }
              }
              
              // 객체 응답인 경우
              // 응답 코드 확인 (KOSIS API 오류 코드)
              const retCode = data.RET_CODE || data.retCode || data.RetCode || data.code || data.err;
              const errMsg = data.errMsg || data.message || data.error;
              
              // 오류 응답 확인
              if (data.err || data.error || errMsg) {
                const errCode = data.err || data.error || retCode;
                console.error('KOSIS API 오류:', errCode, errMsg);
                
                if (errCode === '20' || errMsg?.includes('필수') || errMsg?.includes('누락')) {
                  lastError = new Error(`필수 파라미터 누락: ${errMsg}`);
                  lastResponse = responseText;
                  continue;
                } else if (errCode === '-200' || errCode === '-201' || errCode === '-202' || 
                           errMsg?.includes('인증') || errMsg?.includes('API') || errMsg?.includes('key')) {
                  return res.status(401).json({
                    success: false,
                    error: 'KOSIS API 키 오류',
                    message: 'API 키가 올바르지 않거나 만료되었습니다. KOSIS 공유서비스에서 키를 확인해주세요.',
                    errCode: errCode,
                    errMsg: errMsg
                  });
                } else {
                  lastError = new Error(`KOSIS API 오류 (${errCode}): ${errMsg}`);
                  lastResponse = responseText;
                  continue;
                }
              }
              
              if (retCode === '-100' || retCode === '100' || retCode === '-1') {
                console.log('KOSIS API: 검색결과 없음 또는 오류 코드:', retCode);
                return res.status(200).json({ 
                  success: true, 
                  data: [],
                  message: '검색 결과가 없습니다',
                  retCode: retCode
                });
              }
              
              // 정상 응답 반환
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
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:185',message:'Server: JSON parse error',data:{attempt:i+1,parseError:parseError.message,responseText:responseText.substring(0,500),responseLength:responseText.length,firstChars:responseText.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:215',message:'All attempts failed',data:{totalAttempts:searchUrls.length,lastError:lastError?.message,lastResponsePreview:lastResponse?.substring(0,500),apiKeyLength:apiKey?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
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
        // 방법 1: TBL_ID 사용 (통계표 ID)
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&tblId=${encodedStatId}`,
        // 방법 2: userStatsId 사용
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${encodedApiKey}&format=json&jsonVD=Y&userStatsId=${encodedStatId}`,
        // 방법 3: TBL_ID 사용 (jsonVD 없음)
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${encodedApiKey}&format=json&tblId=${encodedStatId}`,
        // 방법 4: userStatsId 사용 (jsonVD 없음)
        `https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=${encodedApiKey}&format=json&userStatsId=${encodedStatId}`,
        // 방법 5: 간단한 형식
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/kosis-search.js:297',message:'Server: Top-level error',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return res.status(500).json({ 
      error: 'KOSIS API 호출 실패', 
      message: error.message,
      details: 'KOSIS API 키가 올바른지, API 엔드포인트가 변경되지 않았는지 확인해주세요.'
    });
  }
}
