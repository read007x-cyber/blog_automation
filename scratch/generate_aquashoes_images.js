const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = '/Users/jsh/main/output/아쿠아슈즈 인기와 가성비 비교 분석/images';
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
body { width: 1080px; height: 1080px; background: linear-gradient(135deg, #0d9488, #0f172a); display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ffffff; padding: 80px; position: relative; }
.category { color: #2dd4bf; font-size: 28px; font-weight: 600; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
.title { font-size: 54px; font-weight: 800; text-align: center; line-height: 1.35; margin-bottom: 32px; word-break: keep-all; color: #ffffff; }
.subtitle { color: #cbd5e0; font-size: 28px; text-align: center; font-weight: 400; max-width: 820px; line-height: 1.5; }
.accent { position: absolute; bottom: 60px; right: 60px; background: rgba(255, 255, 255, 0.08); padding: 16px 28px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); color: #2dd4bf; font-size: 22px; font-weight: bold; }
</style>
</head>
<body>
<div class="category">[제품 리뷰 / 물놀이 용품]</div>
<div class="title">아쿠아슈즈 인기와 가성비 비교</div>
<div class="subtitle">밸롭 배럴 위크나인 계곡 및 워터파크 추천 분석</div>
<div class="accent">👟 Aqua Shoes Guide</div>
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
.header { font-size: 28px; font-weight: 700; color: #2dd4bf; margin-bottom: 30px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
.card-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #fbbf24; }
.item { font-size: 16px; color: #cbd5e0; margin-bottom: 10px; line-height: 1.5; }
</style>
</head>
<body>
<div class="header">■ 3대 브랜드 특징: 밸롭 / 배럴 vs 위크나인</div>
<div class="grid">
<div class="card">
<div class="card-title">밸롭 & 배럴 (프리미엄)</div>
<div class="item">* 계곡 바위 전용 고강도 접지력 밑창</div>
<div class="item">* 발가락 보호용 전면 범퍼 가드</div>
<div class="item">* 트렌디한 디자인 및 패션 겸용</div>
<div class="item">* 내구성 우수하여 장기 사용 가능</div>
</div>
<div class="card">
<div class="card-title">위크나인 (가성비 대장)</div>
<div class="item">* 1만원대에서 2만원대 알뜰한 가격</div>
<div class="item">* 수분 즉시 배출 다중 배수 구멍</div>
<div class="item">* 가벼운 경량 메쉬 소재 적용</div>
<div class="item">* 온 가족 워터파크 나들이 추천</div>
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
<div class="header">■ 물놀이 장소별 맞춤 아쿠아슈즈 선택법</div>
<div class="steps">
<div class="step-card">
<div class="step-num">1</div>
<div class="step-title">계곡 & 갯바위</div>
<div class="step-desc">두꺼운 밑창 & 범퍼 보호 슈즈</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">2</div>
<div class="step-title">워터파크 & 풀장</div>
<div class="step-desc">경량 메쉬 & 빠른 배수 구멍</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">3</div>
<div class="step-title">해변 모래사장</div>
<div class="step-desc">모래 유입 차단 밀착 삭스형</div>
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
<div class="header">■ 아쿠아슈즈 구매 시 필수 체크 4가지</div>
<div class="nodes">
<div class="node">
<div class="node-title">배수 구멍</div>
<div class="node-desc">신발 내부 수분 즉시 배출 기능</div>
</div>
<div class="node">
<div class="node-title">미끄럼 방지</div>
<div class="node-desc">이끼 바위 마찰력 고무 밑창</div>
</div>
<div class="node">
<div class="node-title">정사이즈 선택</div>
<div class="node-desc">물속 밀림 방지 맨발 밀착 착용</div>
</div>
<div class="node">
<div class="node-title">밑창 두께</div>
<div class="node-desc">자갈 밟았을 때 발바닥 통증 방지</div>
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
<div class="header">■ 아쿠아슈즈 추천 총평</div>
<div class="quote-box">
"안전하고 시원한 여름 물놀이의 완벽한 시작 — 내 발에 딱 맞는 아쿠아슈즈."
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
