const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = '/Users/jsh/main/output/오션월드 할인 입장 방법 비교 분석/images';
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
body { width: 1080px; height: 1080px; background: linear-gradient(135deg, #0284c7, #0f172a); display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ffffff; padding: 80px; position: relative; }
.category { color: #38bdf8; font-size: 28px; font-weight: 600; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
.title { font-size: 54px; font-weight: 800; text-align: center; line-height: 1.35; margin-bottom: 32px; word-break: keep-all; color: #ffffff; }
.subtitle { color: #cbd5e0; font-size: 28px; text-align: center; font-weight: 400; max-width: 820px; line-height: 1.5; }
.accent { position: absolute; bottom: 60px; right: 60px; background: rgba(255, 255, 255, 0.08); padding: 16px 28px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); color: #38bdf8; font-size: 22px; font-weight: bold; }
</style>
</head>
<body>
<div class="category">[여행 / 워터파크 팁]</div>
<div class="title">오션월드 할인 입장 방법</div>
<div class="subtitle">제휴 카드 D멤버십 온라인 예매 및 비용 절감 꿀팁 비교</div>
<div class="accent">🌊 Ocean World Discount</div>
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
<div class="header">■ 대표 할인 비교: 제휴 카드 vs D 멤버십</div>
<div class="grid">
<div class="card">
<div class="card-title">제휴 신용카드 할인</div>
<div class="item">* KB국민, BC, 신한, 농협 등 지원</div>
<div class="item">* 본인 및 동반인 최대 50퍼센트 할인</div>
<div class="item">* 현장 결제 및 카드사 이벤트 참여</div>
<div class="item">* 전월 실적 미달 여부 사전 확인 필요</div>
</div>
<div class="card">
<div class="card-title">소노 D 멤버십 회원</div>
<div class="item">* 공식 모바일 앱 신규 가입 혜택</div>
<div class="item">* 실적 조건 없이 35퍼센트 쿠폰 발급</div>
<div class="item">* 카드가 없는 이용객에게 최고 대안</div>
<div class="item">* 모바일 바코드 즉시 입장 가능</div>
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
<div class="header">■ 스마트한 오션월드 이용 4단계 절차</div>
<div class="steps">
<div class="step-card">
<div class="step-num">1</div>
<div class="step-title">1단계 할인비교</div>
<div class="step-desc">카드 할인 vs 온라인 특가 비교</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">2</div>
<div class="step-title">2단계 셔틀예약</div>
<div class="step-desc">무료 셔틀버스 전일 16시전 예약</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">3</div>
<div class="step-title">3단계 짐챙기기</div>
<div class="step-desc">아쿠아슈즈 & 개인 타월 준비</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">4</div>
<div class="step-title">4단계 오픈런</div>
<div class="step-desc">개장 직후 인기 어트랙션 공략</div>
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
<div class="header">■ 워터파크 필수 준비물 & 지출 절감 4가지</div>
<div class="nodes">
<div class="node">
<div class="node-title">아쿠아슈즈 필수</div>
<div class="node-desc">미착용 시 입장 불가 미끄럼 방지</div>
</div>
<div class="node">
<div class="node-title">개인 타월 지참</div>
<div class="node-desc">타월 유료화 대여료 지출 절감</div>
</div>
<div class="node">
<div class="node-title">개인 구명조끼</div>
<div class="node-desc">8천원 대여료 절약용 지참 권장</div>
</div>
<div class="node">
<div class="node-title">햇빛 차단 모자</div>
<div class="node-desc">야외 파도풀 필수 수영모 캡모자</div>
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
<div class="header">■ 오션월드 추천 핵심 소회</div>
<div class="quote-box">
"거대한 파도풀과 짜릿한 슬라이드 — 소중한 사람들과 더 알뜰하고 시원하게 즐기는 오션월드."
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
