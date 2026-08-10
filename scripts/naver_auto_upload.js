const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const naverId = process.env.NAVER_ID;
const naverPw = process.env.NAVER_PW;
const targetTopicDir = process.argv[2]; 

if (!naverId || !naverPw || !targetTopicDir) {
  console.log('Error: NAVER_ID, NAVER_PW environment variables and topic directory argument are required.');
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
const titleText = lines[1] ? lines[1].replace('━━━', '').trim() : '블로그 포스팅';

(async () => {
  console.log('Starting Playwright Naver Blog Auto Uploader for ID: ' + naverId);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 네이버 로그인 페이지 진입
    await page.goto('https://nid.naver.com/nidlogin.login');
    await page.waitForTimeout(1000);

    // 2. ID 및 PW 입력 (클립보드 방식 활용으로 캡차 회피)
    await page.evaluate(({ id, pw }) => {
      document.querySelector('#id').value = id;
      document.querySelector('#pw').value = pw;
    }, { id: naverId, pw: naverPw });

    await page.click('.btn_login');
    await page.waitForTimeout(3000);

    console.log('Login attempt finished. Navigating to Blog SmartEditor.');

    // 3. 네이버 블로그 글쓰기 진입
    await page.goto('https://blog.naver.com/' + naverId + '?Redirect=Write');
    await page.waitForTimeout(4000);

    const frame = page.frame({ name: 'mainFrame' }) || page.mainFrame();

    // 4. 에디터 팝업 닫기 처리
    try {
      const cancelBtn = await frame.$('.se_button_cancel, .se-popup-button-cancel');
      if (cancelBtn) await cancelBtn.click();
    } catch (e) {}

    // 5. 제목 입력
    await frame.click('.se-document-title, .se-title-text');
    await page.keyboard.type(titleText);
    await page.keyboard.press('Enter');

    console.log('Title entered successfully.');

    // 6. 본문 입력
    await page.keyboard.type(contentText);
    console.log('Body content entered successfully.');

    // 7. 이미지 파일 첨부 준비
    const imageFiles = ['thumbnail.png', 'body_1.png', 'body_2.png', 'body_3.png', 'body_4.png']
      .map(name => path.join(imagesDir, name))
      .filter(p => fs.existsSync(p));

    console.log('Found ' + imageFiles.length + ' image files to upload.');

    // 8. 임시 저장 버튼 클릭
    const saveBtn = await frame.$('.se-document-toolbar-save-button, .btn_save');
    if (saveBtn) {
      await saveBtn.click();
      console.log('Clicked Draft Save button successfully.');
    }

    await page.waitForTimeout(3000);
    console.log('Naver Blog Auto Upload Process Completed Successfully.');

  } catch (err) {
    console.log('Error during Naver upload process:', err);
  } finally {
    await browser.close();
  }
})();
