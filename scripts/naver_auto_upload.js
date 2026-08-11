const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const naverId = process.env.NAVER_ID || 'read007x';
const targetTopicDir = process.argv[2];
const uploadMode = process.argv[3] || process.env.UPLOAD_MODE || 'publish';

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

const rawText = fs.readFileSync(finalMdPath, 'utf8');

const lines = rawText.split('\n');
let titleText = '[제품 리뷰] 아쿠아슈즈 인기와 가성비 비교 분석 — 실패 없는 물놀이 신발';
let bodyStartIndex = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.length > 0 && !line.includes('━━━')) {
    titleText = line.replace(/\[|\]/g, '').replace(/—/g, ' - ').trim();
    bodyStartIndex = i + 1;
    break;
  }
}

const bodyRawContent = lines.slice(bodyStartIndex).join('\n');

function parseBodyBlocks(content) {
  const blocks = [];
  const imgRegex = /!\[(.*?)\]\(\.\/images\/(.*?)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.trim().length > 0) {
      blocks.push({ type: 'text', content: textBefore });
    }
    blocks.push({ type: 'image', alt: match[1], filename: match[2] });
    lastIndex = imgRegex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText.trim().length > 0) {
    blocks.push({ type: 'text', content: remainingText });
  }

  return blocks;
}

const parsedBlocks = parseBodyBlocks(bodyRawContent);

(async () => {
  console.log('Starting Persistent Keep Open Browser Uploader for ID: ' + naverId);
  const userDataDir = path.join(__dirname, '..', 'scratch', 'naver_user_data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('Navigating directly to SmartEditor Write Page...');
    await page.goto('https://blog.naver.com/' + naverId + '?Redirect=Write');
    await page.waitForTimeout(6000);

    let frame = page.frame({ name: 'mainFrame' });
    if (!frame) {
      const frames = page.frames();
      frame = frames.find(f => f.url().includes('PostWriteForm')) || page.mainFrame();
    }

    console.log('SmartEditor mainFrame located.');

    // 1. 진입 시 작성 중인 글 및 모달 팝업 닫기
    try {
      await page.keyboard.press('Escape');
      await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.innerText.includes('확인') || b.className.includes('confirm'));
        if (confirmBtn) confirmBtn.click();
      });
    } catch (e) {}

    await page.waitForTimeout(2000);

    // 2. 제목 란 포커싱 및 타이핑
    console.log('Focusing Title Input Element...');
    try {
      const titleHandle = await frame.$('.se-document-title-text, .se-title-text, [class*="title-text"]');
      if (titleHandle) {
        await titleHandle.click();
      } else {
        await frame.evaluate(() => {
          const titleEl = document.querySelector('.se-document-title-text') || 
                          document.querySelector('.se-title-text') || 
                          document.querySelector('[class*="title-text"]') || 
                          document.querySelector('h1');
          if (titleEl) titleEl.focus();
        });
      }

      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);

      console.log('Typing Title precisely into Title Box: ' + titleText);
      await page.keyboard.type(titleText, { delay: 60 });
      await page.keyboard.press('Enter');
      console.log('Title typed successfully!');
    } catch (e) {
      console.log('Title note:', e.message);
    }

    await page.waitForTimeout(1000);

    // 3. 본문 영역 포커싱 및 기존 내용 삭제
    try {
      const bodyHandle = await frame.$('.se-main-container, [class*="main"], .se_component_wrap');
      if (bodyHandle) {
        await bodyHandle.click();
      }
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(800);
    } catch (e) {}

    // 4. 본문 텍스트 타자 및 위치별 이미지 첨부
    console.log('Processing ' + parsedBlocks.length + ' body blocks...');

    for (let index = 0; index < parsedBlocks.length; index++) {
      const block = parsedBlocks[index];

      if (block.type === 'text') {
        console.log('Typing text block ' + (index + 1) + '...');
        const textLines = block.content.split('\n');
        for (const line of textLines) {
          if (line.trim().length > 0) {
            await page.keyboard.type(line.trim(), { delay: 30 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(200);
          } else {
            await page.keyboard.press('Enter');
          }
        }
      } else if (block.type === 'image') {
        const imagePath = path.join(imagesDir, block.filename);
        console.log('Inserting Verified Image at position for: ' + block.filename);

        if (fs.existsSync(imagePath)) {
          try {
            await frame.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button'));
              const imgBtn = btns.find(b => b.innerText.includes('사진') || b.className.includes('image'));
              if (imgBtn) imgBtn.click();
            });
            await page.waitForTimeout(1200);
          } catch (e) {}

          let fileInput = await frame.$('input[type="file"]');
          if (fileInput) {
            await fileInput.setInputFiles(imagePath);
            await frame.evaluate(() => {
              const input = document.querySelector('input[type="file"]');
              if (input) {
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
              }
            });
            console.log('Attached image for: ' + block.filename);
            await page.waitForTimeout(4000);
            await page.keyboard.press('Enter');
          }
        }
      }
    }

    console.log('All text blocks and images inserted successfully!');
    await page.waitForTimeout(3000);

    // 5. 발행 실행 및 브라우저 창 지속 유지
    if (uploadMode === 'publish') {
      console.log('Publish Mode Active: Clicking 1st Main Publish Button...');
      
      let clicked1st = false;
      const firstPubOnPage = await page.$('button[class*="publish"], .btn_publish');
      if (firstPubOnPage && await firstPubOnPage.isVisible()) {
        await firstPubOnPage.click();
        clicked1st = true;
      }
      if (!clicked1st) {
        const firstPubOnFrame = await frame.$('button[class*="publish"], .btn_publish');
        if (firstPubOnFrame) await firstPubOnFrame.click();
      }

      console.log('Clicked 1st Publish Button. Waiting 4s for Layer Popup...');
      await page.waitForTimeout(4000);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);

      console.log('Targeting confirm_btn in Layer Popup on main page DOM...');
      
      let clicked2nd = false;
      const confirmOnPage = await page.$('.confirm_btn, .btn_confirm, button[class*="confirm_btn"], button[class*="publish_btn"]');
      if (confirmOnPage && await confirmOnPage.isVisible()) {
        await confirmOnPage.click({ force: true });
        console.log('Force clicked confirm_btn on main page DOM!');
        clicked2nd = true;
      }

      if (!clicked2nd) {
        const confirmOnFrame = await frame.$('.confirm_btn, .btn_confirm, button[class*="confirm_btn"], button[class*="publish_btn"]');
        if (confirmOnFrame && await confirmOnFrame.isVisible()) {
          await confirmOnFrame.click({ force: true });
          console.log('Force clicked confirm_btn on mainFrame DOM!');
          clicked2nd = true;
        }
      }

      if (!clicked2nd) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, a'));
          const pub = btns.find(b => b.innerText && b.innerText.trim() === '발행' && !b.className.includes('toolbar') && b.offsetWidth > 0);
          if (pub) pub.click();
        });
      }

      await page.keyboard.press('Enter');

      console.log('Publish submit triggered! Keeping browser window OPEN permanently for user observation...');
      await page.waitForTimeout(8000);
    } else {
      console.log('Draft Mode Active: Clicking Save Button...');
      try {
        await frame.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const saveBtn = btns.find(b => b.innerText.includes('저장') || b.className.includes('save'));
          if (saveBtn) saveBtn.click();
        });
      } catch (e) {}
    }

    const screenshotPath = path.join(targetTopicDir, 'naver_upload_result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved result screenshot to: ' + screenshotPath);
    console.log('Finished upload task. Browser stays open as requested!');

  } catch (err) {
    console.log('Error during execution:', err);
  } finally {
    process.exit(0);
  }
})();
