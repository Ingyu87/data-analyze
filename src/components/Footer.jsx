import React, { useState } from 'react';

const PrivacyPolicyContent = () => (
  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
    <p className="text-slate-400 text-xs">시행일자: 2026년 6월 27일</p>
    <p>
      <strong>데이터 연금술사: 언리미티드 (v16)</strong>(이하 &apos;본 서비스&apos;)은(는) 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
    </p>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제1조 (개인정보의 처리 목적)</h4>
      <p>
        본 서비스는 별도의 회원가입이나 로그인 절차 없이 누구나 자유롭게 이용할 수 있는 <strong>무가입 서비스</strong>입니다. 본 서비스는 다음의 목적 이외의 용도로는 개인정보를 처리하거나 활용하지 않습니다.
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>데이터 분석 및 시각화</strong>: 이용자가 직접 업로드한 데이터 파일(CSV, Excel, TXT)을 브라우저 내에서 파싱하여 인터랙티브 그래프를 생성하고 통계 정보를 제공합니다.</li>
        <li><strong>인공지능(AI) 기반 데이터 설명</strong>: 이용자가 업로드한 데이터의 통계적 요약값(데이터명, 평균값, 최대/최소값, 데이터 포인트 수, 추세 등)을 Google Gemini API에 전달하여 초등학생의 눈높이에 맞는 데이터 설명을 생성합니다. (※ 원본 파일 전체나 개인 식별 정보는 AI API로 전송되지 않으며, 분석에 필요한 통계 수치만 전송됩니다.)</li>
      </ul>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제2조 (개인정보의 처리 및 보유기간)</h4>
      <p>
        본 서비스는 별도의 서버 데이터베이스(DB)를 운영하여 이용자의 개인정보나 업로드한 데이터 파일을 저장 또는 보유하지 않습니다.
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>데이터 임시 저장</strong>: 이용자가 업로드한 데이터와 분석 결과는 웹 브라우저의 임시 세션 메모리(<code>sessionStorage</code>)에만 보관됩니다.</li>
        <li><strong>파기 시점</strong>: 이용자가 웹 브라우저의 탭을 닫거나 창을 종료하면 <code>sessionStorage</code>에 보관된 모든 임시 데이터는 즉시 자동 파기(소멸)됩니다.</li>
      </ul>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제3조 (처리하는 개인정보 항목)</h4>
      <p>
        본 서비스는 회원가입이 필요 없으므로 이름, 아이디, 비밀번호, 이메일, 전화번호 등 어떠한 개인식별정보도 수집하거나 처리하지 않습니다.
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>이용하는 브라우저 정보</strong>: 서비스 화면의 새로고침 시 데이터 유지 스냅샷 및 AI 윤리 가이드 동의 여부 확인을 위해 브라우저 로컬 저장소(<code>sessionStorage</code>)의 임시 키-값만을 활용합니다.</li>
      </ul>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>본 서비스는 개인정보를 온라인으로 수집, 보관, 처리하지 않으므로 만 14세 미만 아동의 회원가입이나 개인정보 수집에 따른 법정대리인의 동의 절차를 별도로 요구하지 않습니다.</li>
        <li>본 서비스는 초등학교 수학 교육과정(&apos;자료와 가능성&apos; 영역) 등을 위한 교육용 도구이므로, 만 14세 미만 아동이 이용할 시에는 학교 교사의 지도 또는 가정통신문 안내 등을 통한 보호자의 관심 아래 안전하게 활용할 것을 권장합니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제5조 (개인정보의 파기 절차 및 방법)</h4>
      <p>
        본 서비스는 원칙적으로 개인정보를 보유하지 않으며, 브라우저 세션에 임시 저장된 데이터의 파기 방법은 다음과 같습니다.
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>파기 절차</strong>: 이용자가 브라우저 창/탭을 닫거나, 사이트 내의 [뒤로가기] 또는 [새로 시작] 버튼을 누르면 브라우저 메모리에 저장된 데이터가 즉시 비워집니다.</li>
        <li><strong>파기 방법</strong>: 전자적 파일 형태로 브라우저 캐시 및 <code>sessionStorage</code>에 임시 기록된 데이터는 복구할 수 없는 방식으로 영구 삭제됩니다.</li>
      </ul>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제6조 (개인정보의 안전성 확보조치)</h4>
      <p>
        본 서비스는 개인정보 보호법 제29조에 따라 데이터의 안전성을 확보하기 위해 다음과 같은 조치를 취하고 있습니다.
      </p>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li><strong>데이터 전송 암호화</strong>: 전 구간 보안 통신(HTTPS) 프로토콜을 적용하여 브라우저와 클라우드 서버리스 함수 간의 모든 데이터 송수신을 안전하게 암호화합니다.</li>
        <li><strong>안전한 인프라 운영</strong>: 보안 인증을 획득한 전문 클라우드 플랫폼(Vercel)을 기반으로 운영되며, AI API Key 등 민감한 자격 증명은 서버 사이드 환경 변수로 은닉하여 안전하게 관리합니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>이용자 및 법정대리인은 언제든지 브라우저의 캐시 및 사이트 데이터를 삭제하거나 브라우저 창을 닫음으로써 임시 보관된 상태값(세션 스냅샷 등)을 즉시 삭제할 수 있습니다.</li>
        <li>수집하는 개인정보가 없으므로 별도의 열람, 정정, 삭제, 처리정지 등의 서면 요청 절차를 필요로 하지 않습니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제8조 (개인정보 보호책임자)</h4>
      <p>
        본 서비스는 이용자의 데이터를 보호하고 고충을 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>성명</strong>: 백인규 (개발자)</li>
        <li><strong>소속</strong>: 서울가동초등학교</li>
        <li><strong>직위</strong>: 교사</li>
        <li><strong>연락처</strong>: 02-448-5766 (학교 교무실 내선)</li>
      </ul>
      <p className="text-xs text-slate-400 mt-2">
        ※ 개인정보 보호를 위해 교사의 개인 휴대전화 번호는 기재하지 않으며, 소속 학교 교무실 연락처를 활용합니다.
      </p>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제9조 (개인정보 처리방침 변경)</h4>
      <p>이 개인정보 처리방침은 <strong>2026년 6월 27일</strong>부터 적용됩니다.</p>
    </div>
  </div>
);

const TermsOfServiceContent = () => (
  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
    <p className="text-slate-400 text-xs">시행일자: 2026년 6월 27일</p>
    <p>
      본 이용약관(이하 &apos;약관&apos;)은 <strong>데이터 연금술사: 언리미티드 (v16)</strong>(이하 &apos;본 서비스&apos;)이 제공하는 교육용 웹 애플리케이션 서비스의 이용에 관한 사항을 규정합니다.
    </p>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제1조 (목적)</h4>
      <p>
        이 약관은 본 서비스가 제공하는 무료 교육용 웹 애플리케이션 서비스(이하 &apos;서비스&apos;)를 이용함에 있어 서비스 제공자와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
      </p>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제2조 (정의)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li><strong>&apos;서비스&apos;</strong>란 본 플랫폼에서 제공하는 교육용 웹 애플리케이션(<code>데이터 연금술사: 언리미티드</code>)을 말합니다.</li>
        <li><strong>&apos;이용자&apos;</strong>란 본 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 교사, 학생, 학부모 및 일반 사용자를 말합니다.</li>
        <li><strong>&apos;AI 윤리 핵심가이드&apos;</strong>란 이용자가 본 서비스를 이용하기 전 확인하고 준수해야 하는 인공지능 윤리 수칙을 말합니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제3조 (약관의 명시와 개정)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>본 서비스는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면이나 하단 링크에 게시합니다.</li>
        <li>본 서비스는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
        <li>약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 내에 그 적용일자 7일 이전부터 공지합니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제4조 (서비스의 제공 및 이용)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>본 서비스는 데이터 분석, 시각화(차트 렌더링), AI 기반 데이터 설명 및 피드백 생성 등 교육 목적의 무료 웹 애플리케이션을 제공합니다.</li>
        <li>서비스의 이용은 전액 무료이며, 별도의 유료 결제나 광고 시청 등이 필요하지 않습니다.</li>
        <li>본 서비스는 회원가입이나 로그인 절차 없이 누구나 자유롭게 이용할 수 있는 <strong>무가입 서비스</strong>입니다.</li>
        <li>본 서비스는 초등학교 등 공교육 및 학습 지원 활동을 목적으로 개발되었으며, 상업적 목적으로 운영되거나 이용되어서는 안 됩니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제5조 (서비스의 중단)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>본 서비스는 시스템 점검, 서버 교체 및 고장, 통신 두절, 외부 API(Google Gemini API, KOSIS API 등)의 장애 또는 정책 변경 등의 사유가 발생한 경우에는 서비스 제공을 일시적 또는 영구적으로 중단할 수 있습니다.</li>
        <li>본 서비스는 무료로 제공되는 교육용 서비스이므로, 서비스 중단으로 인해 이용자에게 발생하는 별도의 보상이나 책임은 제공되지 않습니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제6조 (이용자의 의무 및 윤리 수칙)</h4>
      <p>이용자는 본 서비스를 이용할 때 다음 행위를 하여서는 안 됩니다.</p>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li><strong>허위 및 악성 데이터 업로드</strong>: 타인의 권리를 침해하거나 개인정보가 포함된 데이터 파일, 또는 악성 코드가 포함된 파일 등을 업로드하는 행위</li>
        <li><strong>AI 윤리 위반</strong>: 생성형 AI 기능을 악용하여 비윤리적이거나, 폭력적이거나, 욕설·비방 등이 포함된 부적절한 보고서를 작성하거나 피드백을 유도하는 행위</li>
        <li><strong>시스템 운영 방해</strong>: 비정상적인 트래픽을 유발하여 외부 API 서비스나 웹앱 서버리스 함수에 과도한 부하를 주는 해킹 및 공격 행위</li>
        <li><strong>무단 도용 및 복제</strong>: 서비스 내의 소스코드나 리소스를 사전에 승낙 없이 상업적 목적으로 도용하는 행위</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제7조 (저작권 및 결과물의 활용)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>본 서비스가 작성한 소스코드, 디자인, UI 구성요소 및 설명 자료에 대한 저작권은 개발자(백인규 교사)에게 귀속합니다.</li>
        <li>이용자는 본 서비스를 통해 도출된 데이터 분석 결과, 차트 이미지, AI 설명 및 피드백 보고서를 교육적 목적(학교 수업, 과제 제출, 연구 활동 등)으로 자유롭게 복제, 인용, 배포할 수 있습니다. 단, 이를 상업적 용도로 재판매하거나 배포하여 이익을 얻는 행위는 금지됩니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제8조 (면책조항)</h4>
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>본 서비스는 무료 교육용 서비스로서, 서비스 이용 중 발생하는 기술적 문제나 브라우저 호환성 문제에 대해 책임을 지지 않습니다.</li>
        <li>본 서비스가 제공하는 데이터 분석 결과, 트렌드 예측치 및 AI 피드백은 통계적 계산 및 인공지능 학습 모델에 기반한 보조 자료입니다. AI가 제공하는 설명이나 예측치에 대해 절대적인 정확성이나 영속성을 보증하지 않으므로, 이용자는 반드시 결과를 비판적으로 확인하고 주체적으로 판단해야 합니다.</li>
        <li>KOSIS 통계포털이나 Google Gemini 등 외부 API 서비스의 장애로 인해 발생하는 서비스 제한은 본 서비스의 귀속 사유가 아니며 면책됩니다.</li>
      </ol>
    </div>

    <div>
      <h4 className="text-base font-bold text-purple-300 mt-6 mb-2">제9조 (분쟁해결)</h4>
      <p>
        본 서비스와 이용자 간에 발생한 분쟁에 관하여는 대한민국 법을 적용하며, 소송이 제기되는 경우 서비스 제공자의 소재지(개발 교사 소속 학교 소재지)를 관할하는 법원을 관할법원으로 합니다.
      </p>
    </div>
  </div>
);

const Footer = () => {
  const [modalType, setModalType] = useState(null); // 'privacy' | 'terms' | null

  const handleClose = () => setModalType(null);

  return (
    <>
      <footer className="mt-16 w-full border-t border-white/10 bg-black/10 backdrop-blur-sm py-8 px-4 text-center text-xs text-purple-200/70">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div className="flex gap-4 font-semibold text-purple-200">
            <button
              onClick={() => setModalType('terms')}
              className="hover:text-white transition-colors cursor-pointer hover:underline"
            >
              이용약관
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => setModalType('privacy')}
              className="hover:text-white transition-colors cursor-pointer hover:underline font-bold text-emerald-400 hover:text-emerald-300"
            >
              개인정보처리방침
            </button>
          </div>

          <div className="space-y-1">
            <p>
              개인정보 보호책임자: 백인규 교사 (서울가동초등학교) | 문의: 02-448-5766 (교무실)
            </p>
            <p>
              © 2026 데이터 연금술사: 언리미티드. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Overlay */}
      {modalType && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={handleClose}
        >
          <div 
            className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col text-left overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
              <h3 className="text-lg font-bold text-white">
                {modalType === 'privacy' ? '🛡️ 개인정보처리방침' : '📜 서비스 이용약관'}
              </h3>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl font-semibold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
              {modalType === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-slate-950 flex justify-end">
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
