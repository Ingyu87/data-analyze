# 데이터 연금술사: 언리미티드 (v16)

데이터 분석 도구 - PDF, Excel, CSV, 이미지 파일을 업로드하여 데이터를 분석하고 시각화합니다. **AI 기반 초등학생용 설명** 기능을 포함합니다.

## 주요 기능

- 📄 **다양한 파일 형식 지원**: PDF, Excel (XLSX/XLS), CSV, 텍스트 파일, 이미지
- 📊 **KOSIS 국가통계포털 검색**: 국가통계포털에서 직접 통계 데이터를 검색하고 분석
- 🎯 **자동 데이터 파싱**: 파일에서 데이터를 자동으로 추출하고 분석
- 📈 **데이터 시각화**: Plotly를 사용한 인터랙티브 차트 (꺾은선/막대/원/그림 그래프)
- 🔍 **트렌드 분석**: 단일 데이터셋의 트렌드 분석 및 미래 예측
- 🔗 **상관관계 분석**: 두 데이터셋 간의 상관관계 분석
- 🤖 **AI 기반 설명**: Upstage AI를 활용한 초등학생용 친절한 설명 생성

## 기술 스택

- **React 18** - UI 프레임워크
- **Vite** - 빌드 도구
- **Plotly.js** - 데이터 시각화
- **PDF.js** - PDF 파일 처리
- **SheetJS (XLSX)** - Excel 파일 처리
- **Upstage AI** - AI 기반 설명 생성
- **Tailwind CSS** - 스타일링 (CDN)

## 설치 및 실행

### 개발 환경

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 파일 생성)
UPSTAGE_API_KEY=your_api_key_here
KOSIS_API_KEY=your_kosis_api_key_here

# 개발 서버 실행
npm run dev
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## Vercel 배포

이 프로젝트는 Vercel에 배포할 수 있습니다.

### 배포 방법

1. GitHub에 프로젝트를 푸시합니다:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. [Vercel](https://vercel.com)에 로그인하고 새 프로젝트를 생성합니다.

3. GitHub 저장소를 연결합니다.

4. Vercel이 자동으로 설정을 감지합니다:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **환경 변수 설정** (중요!):
   - Vercel 대시보드 → Settings → Environment Variables
   - **Name**: `UPSTAGE_API_KEY`
   - **Value**: `your_upstage_api_key_here` (실제 API 키 입력)
   - **Environment**: Production, Preview, Development 모두 선택
   - **Name**: `KOSIS_API_KEY`
   - **Value**: `your_kosis_api_key_here` (KOSIS API 키 입력)
   - **Environment**: Production, Preview, Development 모두 선택

6. 배포를 완료합니다.

### 환경 변수

**⚠️ 중요: API 키는 절대 GitHub에 올리지 마세요!**

#### 로컬 개발 환경

1. `.env.local` 파일을 생성하세요:
   ```bash
   UPSTAGE_API_KEY=your_api_key_here
   KOSIS_API_KEY=your_kosis_api_key_here
   ```

2. `.env.example` 파일을 참고하세요 (템플릿만 제공, 실제 키는 없음)

#### Vercel 배포 시

1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Environment Variables로 이동
3. 다음 환경 변수 추가:
   - **Name**: `UPSTAGE_API_KEY`
   - **Value**: `your_upstage_api_key_here` (실제 API 키 입력)
   - **Environment**: Production, Preview, Development 모두 선택
   - **Name**: `KOSIS_API_KEY`
   - **Value**: `your_kosis_api_key_here` (KOSIS API 키 입력)
   - **Environment**: Production, Preview, Development 모두 선택

4. 저장 후 재배포

**보안 주의사항:**
- ✅ `.env.local`은 `.gitignore`에 포함되어 있어 GitHub에 올라가지 않습니다
- ✅ API 키는 서버 사이드(Vercel 서버리스 함수)에서만 사용됩니다
- ❌ 클라이언트 코드에 API 키를 직접 작성하지 마세요
- ❌ GitHub에 API 키를 커밋하지 마세요

## 프로젝트 구조

```
data-analyze/
├── api/                      # Vercel 서버리스 함수
│   ├── ai-explain.js         # AI 설명 생성 API
│   └── kosis-search.js       # KOSIS 통계 검색 API
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── Icons.jsx        # 아이콘 컴포넌트
│   │   ├── Intro.jsx        # 인트로 화면
│   │   ├── KosisSearch.jsx  # KOSIS 통계 검색 화면
│   │   ├── Staging.jsx      # 파일 스테이징 화면
│   │   ├── Extraction.jsx   # 그래프 채굴 화면
│   │   ├── Result.jsx       # 결과 화면
│   │   ├── ChartRender.jsx  # 차트 렌더링
│   │   └── Lockdown.jsx     # 금지 단어 감지 화면
│   ├── utils/               # 유틸리티 함수
│   │   ├── safety.js        # 안전성 검사
│   │   ├── fileReaders.js   # 파일 읽기
│   │   ├── dataParser.js    # 데이터 파싱
│   │   ├── analysis.js      # 데이터 분석
│   │   ├── explanation.js   # 기본 설명 생성
│   │   └── aiService.js     # AI 서비스 호출
│   ├── constants/           # 상수
│   │   └── index.js         # 앱 설정 및 상수
│   ├── App.jsx              # 메인 앱 컴포넌트
│   ├── App.css              # 앱 스타일
│   ├── main.jsx             # 진입점
│   └── index.css            # 글로벌 스타일
├── index.html               # HTML 템플릿
├── package.json             # 프로젝트 설정
├── vite.config.js          # Vite 설정
├── vercel.json             # Vercel 배포 설정
├── .env.example            # 환경 변수 템플릿
└── README.md               # 프로젝트 문서
```

## API 구조

### AI 설명 API (`/api/ai-explain`)

**POST** 요청으로 AI 기반 설명을 생성합니다.

**요청 본문:**
```json
{
  "type": "single" | "correlation",
  "data": {
    // type이 "single"인 경우
    "dataName": "데이터 이름",
    "slope": 1.5,
    "avgValue": 10.5,
    "maxValue": 20.0,
    "minValue": 5.0,
    "trend": "상승",
    "nextVal": 12.0,
    "dataPoints": 10
    
    // type이 "correlation"인 경우
    "data1Name": "데이터1",
    "data2Name": "데이터2",
    "correlation": 0.85,
    "data1Stats": { "avgValue": 10, "maxValue": 20, "minValue": 5 },
    "data2Stats": { "avgValue": 15, "maxValue": 25, "minValue": 10 },
    "realWorldExample": "실생활 예시"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "summary": "요약",
    "detailedExplanation": "상세 설명",
    "analogy": "비유",
    "evidence": ["근거1", "근거2"],
    "futurePrediction": "미래 예측",
    "predictionEvidence": ["예측 근거1", "예측 근거2"]
  }
}
```

## 보안

- API 키는 **서버 사이드에서만** 사용됩니다
- 클라이언트는 서버리스 함수를 통해 간접적으로 AI API를 호출합니다
- 환경 변수는 Vercel 대시보드에서 관리합니다
- `.env.local` 파일은 Git에 커밋되지 않습니다

## 라이선스

MIT

## 개발자

가동초 백인규 (Seoul Gadong-cho Baek In-gyu)
