const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = '/Users/jsh/main/output/아메리칸 투어리스트 여행용 캐리어 추천과 인기순으로 비교 분석/images';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const htmlThumbnail = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Pretendard', sans-serif; }
body { width: 1080px; height: 1080px; background: linear-gradient(135deg, #1e1b4b, #0f172a); display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ffffff; padding: 80px; position: relative; }
.category { color: #f59e0b; font-size: 28px; font-weight: 600; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
.title { font-size: 54px; font-weight: 800; text-align: center; line-height: 1.35; margin-bottom: 32px; word-break: keep-all; color: #ffffff; }
.subtitle { color: #cbd5e0; font-size: 28px; text-align: center; font-weight: 400; max-width: 820px; line-height: 1.5; }
.accent { position: absolute; bottom: 60px; right: 60px; background: rgba(255, 255, 255, 0.08); padding: 16px 28px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); color: #f59e0b; font-size: 22px; font-weight: bold; }
</style>
</head>
<body>
<div class="category">[제품 리뷰 / 여행 가방]</div>
<div class="title">아메리칸 투어리스트 캐리어 추천</div>
<div class="subtitle">인기 모델 큐리오 사운드박스 프론텍 벨톤 비교 분석</div>
<div class="accent">🧳 Luggage Review</div>
</body>
</html>
`;

const htmlBody1 = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Pretendard', sans-serif; }
body { width: 900px; height: 550px; background: #0f172a; color: #f8fafc; padding: 40px; display: flex; flex-direction: column; justify-content: center; }
.header { font-size: 28px; font-weight: 700; color: #f59e0b; margin-bottom: 30px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
.card-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #38bdf8; }
.item { font-size: 16px; color: #cbd5e0; margin-bottom: 10px; line-height: 1.5; }
</style>
</head>
<body>
<div class="header">■ 대표 스테디셀러: 큐리오 vs 사운드박스</div>
<div class="grid">
<div class="card">
<div class="card-title">큐리오 (Curio)</div>
<div class="item">* 스피커 모티브 원형 음각 패턴</div>
<div class="item">* 20인치, 25인치, 30인치 다양한 선택</div>
<div class="item">* 복원력 우수한 PP 소재 채택</div>
<div class="item">* 합리적인 가격대의 국민 캐리어</div>
</div>
<div class="card">
<div class="card-title">사운드박스 (Soundbox)</div>
<div class="item">* LP 레코드판 디자인 감성</div>
<div class="item">* 레드닷 디자인 어워드 수상작</div>
<div class="item">* 수납용량 지퍼 확장 기능 지지</div>
<div class="item">* 튼튼함과 가벼운 무게의 조화</div>
</div>
</div>
</body>
</html>
`;

const htmlBody2 = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Pretendard', sans-serif; }
body { width: 900px; height: 550px; background: #0f172a; color: #f8fafc; padding: 40px; display: flex; flex-direction: column; justify-content: center; }
.header { font-size: 28px; font-weight: 700; color: #a855f7; margin-bottom: 35px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
.steps { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.step-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px 18px; flex: 1; text-align: center; }
.step-num { width: 40px; height: 40px; background: #9333ea; color: #ffffff; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 700; margin: 0 auto 16px auto; font-size: 18px; }
.step-title { font-size: 18px; font-weight: 700; color: #e2e8f0; margin-bottom: 8px; }
.step-desc { font-size: 14px; color: #94a3b8; line-height: 1.4; }
.arrow { font-size: 24px; color: #64748b; font-weight: bold; }
</style>
</head>
<body>
<div class="header">■ 여행 일정별 캐리어 인치 규격 선택법</div>
<div class="steps">
<div class="step-card">
<div class="step-num">20</div>
<div class="step-title">20인치 기내용</div>
<div class="step-desc">1박 2일 또는 2박 3일 단기 국내외 여행</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">24</div>
<div class="step-title">24~25인치 화물용</div>
<div class="step-desc">3박 5일 또는 4박 6일 표준 해외여행</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">28</div>
<div class="step-title">28인치 이상 대형</div>
<div class="step-desc">1주일 이상 장기 체류 및 가족 통합 수납</div>
</div>
</div>
</body>
</html>
`;

const htmlBody3 = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Pretendard', sans-serif; }
body { width: 900px; height: 550px; background: #0f172a; color: #f8fafc; padding: 40px; display: flex; flex-direction: column; justify-content: center; }
.header { font-size: 28px; font-weight: 700; color: #34d399; margin-bottom: 25px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
.nodes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.node { background: #1e293b; border: 1px solid #475569; border-radius: 12px; padding: 24px 14px; text-align: center; }
.node-title { font-size: 16px; font-weight: 700; color: #34d399; margin-bottom: 10px; }
.node-desc { font-size: 13px; color: #cbd5e0; line-height: 1.4; }
</style>
</head>
<body>
<div class="header">■ 캐리어 구매 시 꼭 챙겨야 할 핵심 기능 4가지</div>
<div class="nodes">
<div class="node">
<div class="node-title">전면 개방 포켓</div>
<div class="node-desc">노트북 및 세면도구 세워 수납</div>
</div>
<div class="node">
<div class="node-title">스토퍼 휠</div>
<div class="node-desc">대중교통 탑승 시 바퀴 정지 제어</div>
</div>
<div class="node">
<div class="node-title">수납 확장 지퍼</div>
<div class="node-desc">최대 20퍼센트 이상 용량 증대</div>
</div>
<div class="node">
<div class="node-title">TSA 정품 잠금</div>
<div class="node-desc">해외 세관 검사 파손 방지 파열</div>
</div>
</div>
</body>
</html>
`;

const htmlBody4 = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Pretendard', sans-serif; }
body { width: 900px; height: 550px; background: #0f172a; color: #f8fafc; padding: 40px; display: flex; flex-direction: column; justify-content: center; }
.header { font-size: 28px; font-weight: 700; color: #f59e0b; margin-bottom: 25px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
.quote-box { background: #1e293b; border-radius: 12px; border-left: 6px solid #f59e0b; padding: 36px; font-size: 22px; font-weight: 700; color: #f8fafc; line-height: 1.6; word-break: keep-all; }
</style>
</head>
<body>
<div class="header">■ 아메리칸 투어리스트 캐리어 총평</div>
<div class="quote-box">
"여행의 시작과 끝을 함께하는 가장 든든하고 스타일리시한 동반자 — 아메리칸 투어리스트 캐리어."
</div>
</body>
</html>
`;

const tasks = [
  { name: 'thumbnail.png', html: htmlThumbnail, width: 1080, height: 1080 },
  { name: 'body_1.png', html: htmlBody1, width: 900, height: 550 },
  { name: 'body_2.png', html: htmlBody2, width: 900, height: 550 },
  { name: 'body_3.png', html: htmlBody3, width: 900, height: 550 },
  { name: 'body_4.png', html: htmlBody4, width: 900, height: 550 },
];

(async () => {
  const browser = await chromium.launch();
  for (const t of tasks) {
    const page = await browser.newPage({ viewport: { width: t.width, height: t.height } });
    await page.setContent(t.html);
    const savePath = path.join(outputDir, t.name);
    await page.screenshot({ path: savePath });
    console.log(`Generated: ${savePath}`);
    await page.close();
  }
  await browser.close();
})();
