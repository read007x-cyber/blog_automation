const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = '/Users/jsh/main/output/클로드 코드의 핵심 기능 5가지/images';
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
body { width: 1080px; height: 1080px; background: linear-gradient(135deg, #1a1a2e, #16213e); display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ffffff; padding: 80px; position: relative; }
.category { color: #a0aec0; font-size: 28px; font-weight: 600; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
.title { font-size: 56px; font-weight: 800; text-align: center; line-height: 1.3; margin-bottom: 32px; word-break: keep-all; }
.subtitle { color: #cbd5e0; font-size: 30px; text-align: center; font-weight: 400; max-width: 800px; line-height: 1.5; }
.accent { position: absolute; bottom: 60px; right: 60px; background: rgba(255, 255, 255, 0.08); padding: 16px 28px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); font-family: monospace; color: #6366f1; font-size: 22px; font-weight: bold; }
</style>
</head>
<body>
<div class="category">[AI 개발 / 도구 리뷰]</div>
<div class="title">클로드 코드 핵심 기능 5가지</div>
<div class="subtitle">터미널 기반 AI 코딩 에이전트의 혁신과 개발 생산성의 변화 분석</div>
<div class="accent">&gt;_ Claude Code CLI</div>
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
.card-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.old { color: #f43f5e; }
.new { color: #34d399; }
.item { font-size: 16px; color: #cbd5e0; margin-bottom: 10px; line-height: 1.5; }
</style>
</head>
<body>
<div class="header">■ 방식 비교: 기존 AI 도구 vs 클로드 코드</div>
<div class="grid">
<div class="card">
<div class="card-title old">기존 AI 코딩 도구</div>
<div class="item">* 웹챗 질문 및 코드 답변 생성</div>
<div class="item">* 답변 코드를 드래그 및 복사</div>
<div class="item">* 에디터 이동 및 대상 파일 탐색</div>
<div class="item">* 직접 코드 붙여넣기 및 저장</div>
<div class="item">* 터미널 이동 후 테스트 수동 실행</div>
</div>
<div class="card">
<div class="card-title new">클로드 코드 (Claude Code)</div>
<div class="item">* 터미널 자연어 지시 입력</div>
<div class="item">* 프로젝트 파일 자율 탐색</div>
<div class="item">* 대상 파일 직접 자동 수정</div>
<div class="item">* 테스트 스크립트 다이렉트 실행</div>
<div class="item">* 단 1단계 통합 자율 처리</div>
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
<div class="header">■ 자율 피드백 워크플로우 4단계</div>
<div class="steps">
<div class="step-card">
<div class="step-num">1</div>
<div class="step-title">로그 분석</div>
<div class="step-desc">버그 리포트 수신 및 오류 원인 수집</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">2</div>
<div class="step-title">서브에이전트</div>
<div class="step-desc">독립 하위 에이전트 생성 및 작업 분동</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">3</div>
<div class="step-title">코드 수정</div>
<div class="step-desc">가설 수립 후 다이렉트 코드 변경</div>
</div>
<div class="arrow">→</div>
<div class="step-card">
<div class="step-num">4</div>
<div class="step-title">결과 검증</div>
<div class="step-desc">테스트 실행 및 자율 피드백 검증</div>
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
.header { font-size: 28px; font-weight: 700; color: #38bdf8; margin-bottom: 25px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
.mcp-container { background: #1e293b; border-radius: 16px; padding: 30px; border: 1px solid #334155; display: flex; flex-direction: column; gap: 20px; }
.center-box { background: #0284c7; color: #ffffff; padding: 16px; border-radius: 10px; text-align: center; font-weight: 700; font-size: 20px; letter-spacing: 1px; }
.nodes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.node { background: #0f172a; border: 1px solid #475569; border-radius: 10px; padding: 16px 10px; text-align: center; }
.node-title { font-size: 15px; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
.node-desc { font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
<div class="header">■ MCP (Model Context Protocol) 오픈 연동 구조</div>
<div class="mcp-container">
<div class="center-box">Claude Code Engine (MCP Client)</div>
<div class="nodes">
<div class="node">
<div class="node-title">GitHub Issues</div>
<div class="node-desc">이슈 연동 및 PR 작성</div>
</div>
<div class="node">
<div class="node-title">JIRA Tracker</div>
<div class="node-desc">작업 티켓 연동</div>
</div>
<div class="node">
<div class="node-title">Sentry Logs</div>
<div class="node-desc">실시간 오차 추적</div>
</div>
<div class="node">
<div class="node-title">SQL Database</div>
<div class="node-desc">정형 데이터 조회</div>
</div>
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
.code-box { background: #1e293b; border-radius: 12px; border: 1px solid #475569; padding: 24px; font-family: monospace; }
.file-name { color: #f59e0b; font-size: 18px; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.code-line { font-size: 15px; color: #cbd5e0; margin-bottom: 10px; line-height: 1.6; }
.highlight { color: #34d399; }
</style>
</head>
<body>
<div class="header">■ CLAUDE.md 지속적 메모리 설정 카드</div>
<div class="code-box">
<div class="file-name">📄 CLAUDE.md (Project Root Memory)</div>
<div class="code-line"><span class="highlight">* 팀 코딩 스타일:</span> TypeScript Strict 모드 및 ES6 패턴 준수</div>
<div class="code-line"><span class="highlight">* 테스트 규칙:</span> Jest 기반의 단단위 커버리지 80퍼센트 이상 유지</div>
<div class="code-line"><span class="highlight">* 라이브러리 제한:</span> 허가되지 않은 외부 패키지 설치 금지</div>
<div class="code-line"><span class="highlight">* 세션 자동 반영:</span> 실행 시 영구 메모리로 자동 반영하여 규칙 지속 준수</div>
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
