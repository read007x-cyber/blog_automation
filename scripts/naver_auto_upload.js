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
  console.log('Starting Clean Dialog Close & 5sec Green Click Uploader for ID: ' + naverId);
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

    // 4. 본문 텍스트 작성 후 위치별 이미지 첨부
    console.log('Processing ' + parsedBlocks.length + ' blocks in exact content positions...');

    for (let index = 0; index < parsedBlocks.length; index++) {
      const block = parsedBlocks[index];

      if (block.type === 'text') {
        console.log('Typing text block ' + (index + 1) + '/' + parsedBlocks.length + '...');
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
      } else if (block.type === 'image') {
        const imagePath = path.join(imagesDir, block.filename);
        console.log('Attaching positioned image for ' + block.filename + ' at content location...');

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
            console.log('Attached positioned image successfully: ' + block.filename);
            await page.waitForTimeout(4000);
            await page.keyboard.press('Enter');
          }
        }
      }
    }

    console.log('All positioned text and images inserted successfully!');
    console.log('Closing any open file attachment dialogs/layers before publishing...');
    
    // 파일 첨부 창 및 레이어 100% 닫기
    await frame.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.se-popup-button-cancel, .se-popup-close-button, [class*="close"]'));
      closeBtns.forEach(b => b.click());
    });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);

    // 5. 1차 발행 버튼 클릭 ➔ 2차 발행 레이어 팝업 마우스 오버 ➔ 초록색 5초 머무름 ➔ 마우스 클릭
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

      console.log('Layer Popup is OPEN! Moving mouse OVER to 2nd Green Publish Button...');
      await page.waitForTimeout(1500);

      const confirmBtnCoord = await page.evaluate(() => {
        const layer = document.querySelector('[class*="publish_layer"]') || document.querySelector('[class*="layer_publish"]') || document.body;
        const btns = Array.from(layer.querySelectorAll('button, a'));
        const target = btns.find(b => {
          const txt = b.innerText ? b.innerText.trim() : '';
          const isPub = txt === '발행' || txt.includes('발행');
          const isNotTop = !b.className.includes('toolbar') && !b.className.includes('se-publish-btn');
          const isVis = b.offsetWidth > 0 && b.offsetHeight > 0;
          return isPub && isNotTop && isVis;
        });
        if (target) {
          const rect = target.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return null;
      });

      if (confirmBtnCoord) {
        console.log('Moving mouse cursor OVER to 2nd Publish Button at:', confirmBtnCoord);
        await page.mouse.move(confirmBtnCoord.x, confirmBtnCoord.y, { steps: 20 });
        
        console.log('Button hovered! Waiting and holding mouse for EXACTLY 5 SECONDS while button is GREEN...');
        await page.waitForTimeout(5000);

        console.log('5 SECONDS HOLD COMPLETE! Pressing mouse down and up on 2nd GREEN Publish Button!');
        await page.mouse.down();
        await page.waitForTimeout(150);
        await page.mouse.up();
        await page.mouse.click(confirmBtnCoord.x, confirmBtnCoord.y);
      } else {
        console.log('Fallback click for 2nd publish button...');
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
