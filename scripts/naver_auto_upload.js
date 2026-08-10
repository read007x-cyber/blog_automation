const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const naverId = process.env.NAVER_ID || 'read007x';
const targetTopicDir = process.argv[2];

if (!targetTopicDir) {
  console.log('Error: topic directory argument is required.');
  process.exit(1);
}

const finalMdPath = path.join(targetTopicDir, 'final.md');
const imagesDir = path.join(targetTopicDir, 'images');

if (!fs.existsSync(finalMdPath)) {
  console.log('Error: final.md file not found in ' + targetTopicDir);
  process.exit(1);
}

const contentText = fs.readFileSync(finalMdPath, 'utf8');
const lines = contentText.split('\n').filter(l => l.trim().length > 0);
const titleText = lines[1] ? lines[1].replace('━━━', '').trim() : '아쿠아슈즈 인기와 가성비 비교 분석';

(async () => {
  console.log('Starting Auto Uploader using Persistent Session for ID: ' + naverId);
  const userDataDir = path.join(__dirname, '..', 'scratch', 'naver_user_data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. 네이버 블로그 스마트에디터 ONE 작성 진입 (저장된 세션 활용)
    console.log('Navigating directly to Blog Write Page using stored session...');
    await page.goto('https://blog.naver.com/' + naverId + '?Redirect=Write');
    await page.waitForTimeout(6000);

    const currentUrl = page.url();
    console.log('Current Page URL: ' + currentUrl);

    if (currentUrl.includes('nidlogin.login')) {
      console.log('Session expired or not logged in yet. Please run naver_login_session.js once to save session.');
      process.exit(1);
    }

    // 2. 스마트에디터 프레임 확보
    let frame = page.frame({ name: 'mainFrame' });
    if (!frame) {
      const frames = page.frames();
      frame = frames.find(f => f.url().includes('PostWriteForm')) || page.mainFrame();
    }

    console.log('Located SmartEditor mainFrame.');

    // 3. 팝업 및 도움말 닫기
    try {
      await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const cancelBtn = btns.find(b => b.innerText.includes('취소') || b.className.includes('cancel'));
        if (cancelBtn) cancelBtn.click();
      });
    } catch (e) {}

    await page.waitForTimeout(1500);

    // 4. 제목 입력
    try {
      await frame.evaluate(() => {
        const titleEl = document.querySelector('[class*="title"]') || document.querySelector('h1');
        if (titleEl) titleEl.focus();
      });
      await page.keyboard.type(titleText);
      await page.keyboard.press('Enter');
      console.log('Title typed successfully: ' + titleText);
    } catch (e) {
      console.log('Title typing error:', e.message);
    }

    await page.waitForTimeout(1000);

    // 5. 본문 입력
    try {
      await page.keyboard.type(contentText);
      console.log('Body content typed successfully.');
    } catch (e) {
      console.log('Body typing error:', e.message);
    }

    await page.waitForTimeout(2000);

    // 6. 이미지 첨부
    const imageFiles = ['thumbnail.png', 'body_1.png', 'body_2.png', 'body_3.png', 'body_4.png']
      .map(name => path.join(imagesDir, name))
      .filter(p => fs.existsSync(p));

    const fileInput = await frame.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(imageFiles);
      console.log('Uploaded 5 image files successfully.');
    }

    await page.waitForTimeout(3000);

    // 7. 임시 저장 버튼 클릭
    try {
      await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const saveBtn = btns.find(b => b.innerText.includes('저장') || b.className.includes('save'));
        if (saveBtn) saveBtn.click();
      });
      console.log('Draft Save clicked successfully.');
    } catch (e) {
      console.log('Save button click error:', e.message);
    }

    await page.waitForTimeout(3000);

    const screenshotPath = path.join(targetTopicDir, 'naver_upload_result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved result screenshot to: ' + screenshotPath);

  } catch (err) {
    console.log('Error during process:', err);
  } finally {
    await context.close();
  }
})();
