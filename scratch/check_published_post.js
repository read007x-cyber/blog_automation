const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const userDataDir = path.join(__dirname, '..', 'scratch', 'naver_user_data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://blog.naver.com/PostList.naver?blogId=read007x');
  await page.waitForTimeout(5000);

  const screenshotPath = '/Users/jsh/main/output/아쿠아슈즈 인기와 가성비 비교 분석/naver_upload_result.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved post list screenshot.');
  await context.close();
})();
