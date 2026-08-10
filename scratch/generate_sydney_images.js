const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = '/Users/jsh/main/output/호주 시드니 4박 5일 여행 준비 및 꿀팁/images';
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
body { width: 1080px; height: 1080px; background: linear-gradient(135deg, #0f172a, #1e1b4b); display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ffffff; padding: 80px; position: relative; }
.category { color: #38bdf8; font-size: 28px; font-weight: 600; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
.title { font-size: 54px; font-weight: 800; text-align: center; line-height: 1.35; margin-bottom: 32px; word-break: keep-all; color: #ffffff; }
.subtitle { color: #cbd5e0; font-size: 28px; text-align: center; font-weight: 400; max-width: 820px; line-height: 1.5; }
.accent { position: absolute; bottom: 60px; right: 60px; background: rgba(255, 255, 255, 0.08); padding: 16px 28px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); color: #38bdf8; font-size: 22px; font-weight: bold; }
</style>
</head>
<body>
<div class="category">[호주 여행 / 시드니 포스팅]</div>
<div class="title">시드니 4박 5일 여행 코스</div>
<div class="subtitle">직접 다녀오며 깨달은 필수 비자, 대중교통 및 알짜 꿀팁 총정리</div>
<div class="accent">✈️ Sydney Travel Guide</div>
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
.header { font-size: 28px; font-weight: 700; color: #38bdf8; margin-bottom: 30px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
.card-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #fbbf24; }
.item { font-size: 16px; color: #cbd5e0; margin-bottom: 10px; line-height: 1.5; }
</style>
</head>
<body>
<div class="header">■ 사전 준비: ETA 비자 vs 교통카드 결제</div>
<div class="grid">
<div class="card">
<div class="card-title">호주 ETA 전자비자</div>
<div class="item">* 공식 Australian ETA 앱으로 신청</div>
<div class="item">* 여권 유효기간 최소 6개월 이상 필수</div>
<div class="item">* 출국 1주 전 사전 신청 완료 권장</div>
<div class="item">* 무비자 입국 불가하므로 필수 지참</div>
</div>
<div class="card">
<div class="card-title">대중교통 컨택리스 결제</div>
<div class="item">* 실물 오팔카드 구매 필요 없이 사용</div>
<div class="item">* 해외 결제 지원 신용카드 다이렉트 태그</div>
<div class="item">* Apple Pay 및 Google Pay 지원</div>
<div class="item">* 승하차 시 Tap On & Tap Off 필수</div>
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
.steps { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.step-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px 16px; flex: 1; text-align: center; }
.step-num { width: 36px; height: 36px; background: #9333ea; color: #ffffff; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 700; margin: 0 auto 14px auto; }
.step-title { font-size: 16px; font-weight: 700; color: #e2e8f0; margin-bottom: 8px; }
.step-desc { font-size: 13px; color: #94a3b8; line-height: 1.4; }
.arrow { font-size: 24px; color: #64748b; font-weight: bold; }
</style>
</head>
<body>
<div class="header">■ 시드니 4박 5일 추천 코스 동선</div>
<div class="steps">
<div class="step-card">
<div class="step-num">1</div>
<div class="step-title">1일차 시내</div>
<div class="step-desc">서큘러 키 & 오페라하우스 야경</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">2</div>
<div class="step-title">2일차 자연</div>
<div class="step-desc">블루마운틴 국립공원 일일 투어</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">3</div>
<div class="step-title">3일차 해변</div>
<div class="step-desc">본다이비치 & 서리힐스 카페거리</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">4</div>
<div class="step-title">4일차 명소</div>
<div class="step-desc">QVB 쇼핑 & 천문대 언덕 일몰</div>
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
<div class="header">■ 시드니 여행 필수 준비물 4가지</div>
<div class="nodes">
<div class="node">
<div class="node-title">호주 3구 어댑터</div>
<div class="node-desc">240V 삼발이 I형 멀티플러그 필수</div>
</div>
<div class="node">
<div class="node-title">자외선 차단용품</div>
<div class="node-desc">SPF 선크림 및 선글라스 준비</div>
</div>
<div class="node">
<div class="node-title">트래블월렛 카드</div>
<div class="node-desc">캐시리스 결제 및 현금 최소화</div>
</div>
<div class="node">
<div class="node-title">음식물 세관신고</div>
<div class="node-desc">입국서 Yes 체크 및 육류 제한</div>
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
<div class="header">■ 시드니 여행 핵심 감성 문구</div>
<div class="quote-box">
"푸른 바다와 웅장한 오페라하우스 — 잊을 수 없는 남반구의 바람을 만나는 시드니 4박 5일의 기록."
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
