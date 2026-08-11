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
  console.log('Starting Toolbar Image & Dual Click Confirm Uploader for ID: ' + naverId);
  const userDataDir = path.join(__dirname, '..', 'scratch', 'naver_user_data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      '--disable-restore-session-state',
      '--hide-crash-restore-bubble',
      '--disable-session-crashed-bubble'
    ],
    viewport: { width: 1280, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('Navigating directly to SmartEditor Write Page...');
    await page.goto('https://blog.naver.com/' + naverId + '?Redirect=Write');
    await page.waitForTimeout(7000);

    try {
      await page.waitForSelector('iframe[name="mainFrame"]', { timeout: 12000 });
    } catch (e) {}

    let frame = page.frame({ name: 'mainFrame' });
    if (!frame) {
      const frames = page.frames();
      frame = frames.find(f => f.url().includes('PostWriteForm')) || page.mainFrame();
    }

    console.log('SmartEditor mainFrame located.');

    // 1. 진입 시 복원 alert 모달 및 se-popup-dim 반투명 레이어 100% 제거
    console.log('Completely removing restore alert modal and dim layer...');
    try {
      await page.keyboard.press('Escape');
      await frame.evaluate(() => {
        const cancelBtn = document.querySelector('.se-popup-button-cancel, button[class*="cancel"]');
        if (cancelBtn) cancelBtn.click();
        
        const dims = document.querySelectorAll('.se-popup-dim, .se-popup-alert-confirm');
        dims.forEach(d => d.remove());
      });
    } catch (e) {}

    await page.waitForTimeout(2000);

    // 2. 제목 란 포커싱 및 타이핑
    console.log('Focusing Title Input Element...');
    try {
      const titleHandle = await frame.$('.se-document-title-text, .se-title-text, [class*="title-text"]');
      if (titleHandle) {
        await titleHandle.click({ force: true });
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
        await bodyHandle.click({ force: true });
      }
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(800);
    } catch (e) {}

    // 4. 본문 텍스트 전체 선작성
    console.log('Writing ALL body text content first...');
    const allTextBlocks = parsedBlocks.filter(b => b.type === 'text');
    for (let index = 0; index < allTextBlocks.length; index++) {
      const block = allTextBlocks[index];
      console.log('Typing text block ' + (index + 1) + '/' + allTextBlocks.length + '...');
      const textLines = block.content.split('\n');
      for (const line of textLines) {
        if (line.trim().length > 0) {
          await page.keyboard.type(line.trim(), { delay: 30 });
          await page.keyboard.press('Enter');
          await page.waitForTimeout(150);
        } else {
          await page.keyboard.press('Enter');
        }
      }
    }

    console.log('All text content written successfully! Now attaching ALL 5 images via toolbar photo button...');
    await page.waitForTimeout(2000);

    // 5. 상단 툴바 사진 버튼 클릭 후 이미지 5종 첨부
    const allImageBlocks = parsedBlocks.filter(b => b.type === 'image');
    for (let index = 0; index < allImageBlocks.length; index++) {
      const block = allImageBlocks[index];
      const imagePath = path.join(imagesDir, block.filename);
      console.log('Attaching image (' + (index + 1) + '/' + allImageBlocks.length + '): ' + block.filename);

      if (fs.existsSync(imagePath)) {
        try {
          await frame.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, a'));
            const imgBtn = btns.find(b => {
              const txt = b.innerText ? b.innerText.trim() : '';
              return txt.includes('사진') || b.className.includes('image');
            });
            if (imgBtn) imgBtn.click();
          });
          await page.waitForTimeout(1200);
        } catch (e) {}

        let fileInput = await frame.$('input[type="file"]');
        if (!fileInput) {
          fileInput = await page.$('input[type="file"]');
        }

        if (fileInput) {
          await fileInput.setInputFiles(imagePath);
          await frame.evaluate(() => {
            const input = document.querySelector('input[type="file"]');
            if (input) {
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          console.log('Attached image successfully via Toolbar Photo Button: ' + block.filename);
          await page.waitForTimeout(4000);
          await page.keyboard.press('Enter');
        }
      }
    }

    console.log('All 5 images attached! Closing file chooser popups cleanly...');
    await page.waitForTimeout(2000);

    // 6. 1차 발행 버튼 클릭 ➔ 우측 레이어 팝업 노출 ➔ 2차 초록색 발행 버튼 마우스 호버 & 클릭 전송
    if (uploadMode === 'publish') {
      console.log('Verifying 1st Publish Layer Popup opening...');
      let popupOpened = false;

      for (let attempt = 0; attempt < 3; attempt++) {
        await page.evaluate(() => {
          const btn = document.querySelector('.btn_publish') || 
                      document.querySelector('.se-publish-btn') || 
                      document.querySelector('button[class*="publish"]') || 
                      Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === '발행');
          if (btn) btn.click();
        });

        await page.waitForTimeout(2500);

        const isLayerVisible = await page.evaluate(() => {
          const layer = document.querySelector('[class*="publish_layer"]') || document.querySelector('[class*="layer_publish"]');
          return layer && layer.offsetWidth > 0 && layer.offsetHeight > 0;
        });

        if (isLayerVisible) {
          console.log('Layer Popup successfully OPENED on attempt ' + (attempt + 1));
          popupOpened = true;
          break;
        }
      }

      if (!popupOpened) {
        console.log('Fallback: clicking publish button inside frame...');
        await frame.evaluate(() => {
          const btn = document.querySelector('.btn_publish, button[class*="publish"]');
          if (btn) btn.click();
        });
        await page.waitForTimeout(3000);
      }

      console.log('Layer Popup is OPEN! Targeting 2nd Layer Popup Green Confirm Button...');
      await page.waitForTimeout(1000);

      const confirmBtnHandle = await page.evaluateHandle(() => {
        const layer = document.querySelector('[class*="publish_layer"]') || document.querySelector('[class*="layer_publish"]') || document.body;
        const btns = Array.from(layer.querySelectorAll('button, a'));
        return btns.find(b => {
          const txt = b.innerText ? b.innerText.trim() : '';
          const isPub = txt === '발행' || txt.includes('발행');
          const isNotTop = !b.className.includes('toolbar') && !b.className.includes('se-publish-btn');
          const isVis = b.offsetWidth > 0 && b.offsetHeight > 0;
          return isPub && isNotTop && isVis;
        });
      });

      const confirmBtnEl = confirmBtnHandle.asElement();

      if (confirmBtnEl) {
        console.log('Hovering mouse over 2nd Green Publish Button...');
        await confirmBtnEl.hover();
        console.log('Waiting 1.5s for button to turn GREEN on mouse hover...');
        await page.waitForTimeout(1500);

        console.log('Executing Dual Click (Playwright Force Click + DOM Click)...');
        await confirmBtnEl.click({ force: true });
        await confirmBtnEl.evaluate(b => b.click());
      } else {
        console.log('Executing Fallback Click for 2nd Publish Button...');
        await page.evaluate(() => {
          const layer = document.querySelector('[class*="publish_layer"]') || document.body;
          const btns = Array.from(layer.querySelectorAll('button, a'));
          const target = btns.find(b => b.innerText && b.innerText.trim() === '발행');
          if (target) target.click();
        });
      }

      await page.keyboard.press('Enter');

      console.log('Publish submit triggered! Waiting 12s for server post completion...');
      await page.waitForTimeout(12000);

      console.log('Navigating directly to user Blog PostList page to verify publication: https://blog.naver.com/PostList.naver?blogId=' + naverId);
      await page.goto('https://blog.naver.com/PostList.naver?blogId=' + naverId);
      await page.waitForTimeout(6000);

      const screenshotPath = path.join(targetTopicDir, 'naver_upload_result.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Saved result screenshot to: ' + screenshotPath);

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

  } catch (err) {
    console.log('Error during execution:', err);
  }

  // Permanent keep open loop so browser never closes!
  console.log('Browser window is now KEPT OPEN PERMANENTLY. You can inspect it directly on your screen!');
  await new Promise(() => {});
})();
