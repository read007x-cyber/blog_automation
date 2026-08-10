const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Opening persistent browser session for manual Naver login (5 Minutes Timeout)...');
  const userDataDir = path.join(__dirname, '..', 'scratch', 'naver_user_data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://nid.naver.com/nidlogin.login');

  console.log('Please log in manually on the opened browser window.');
  console.log('Waiting up to 5 minutes for login completion...');

  try {
    // 5분(300,000ms) 동안 수동 로그인 완료 대기
    await page.waitForFunction(() => {
      return !location.href.includes('nidlogin.login');
    }, { timeout: 300000 });

    console.log('Login completion detected! Current URL: ' + page.url());
    console.log('Session cookies saved permanently in: ' + userDataDir);
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('Session login waiting notice:', e.message);
  } finally {
    await context.close();
    console.log('Browser closed. Session state saved.');
  }
})();
