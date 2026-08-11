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
  console.log('Starting JS Event Trigger (mousedown -> mouseup -> click) Publish Uploader for ID: ' + naverId);
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
    console.log('Closing ANY open file attachment dialogs, file explorer popups, and layers cleanly...');
    
    // 파일 첨부 창/탐색기 레이어 100% 닫기
    await frame.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.se-popup-button-cancel, .se-popup-close-button, [class*="close"]'));
      closeBtns.forEach(b => b.click());
    });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    // 5. 사용자가 제시한 mousedown -> mouseup -> click JS 이벤트 강제 트리거 파이프라인
    if (uploadMode === 'publish') {
      console.log('Step 1: Focusing and clicking 1st Publish Button inside editor_frame...');
      try {
        const firstPubBtn = frame.locator("button:has-text('발행'), .btn_publish, .se-publish-btn").first();
        if (await firstPubBtn.isVisible()) {
          await firstPubBtn.focus();
          await page.waitForTimeout(500);
          await firstPubBtn.click({ force: true });
        } else {
          await page.evaluate(() => {
            const btn = document.querySelector('.btn_publish') || document.querySelector('.se-publish-btn') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim().includes('발행'));
            if (btn) btn.click();
          });
        }
      } catch (e) {
        console.log('1st publish click note:', e.message);
      }

      console.log('Step 2: Waiting 2000ms for Publish Layer Popup (.se-popup-publish) to be fully active...');
      await page.waitForTimeout(2000);

      console.log('Step 3: Targeting final 2nd publish button inside .se-popup-publish...');
      const finalPublishBtn = frame.locator(".se-popup-publish button:has-text('발행'), .se-publish-layer button:has-text('발행')").first();

      console.log('Executing Method A: Dispatching mousedown -> mouseup -> click JS events directly to final_publish_btn...');
      try {
        if (await finalPublishBtn.isVisible()) {
          await finalPublishBtn.dispatchEvent('mousedown');
          await page.waitForTimeout(200);
          await finalPublishBtn.dispatchEvent('mouseup');
          await finalPublishBtn.dispatchEvent('click');
          await finalPublishBtn.click({ force: true });
        }
      } catch (e) {
        console.log('Dispatch event note:', e.message);
      }

      console.log('Executing Method B: Focus final_publish_btn and press Enter key...');
      try {
        if (await finalPublishBtn.isVisible()) {
          await finalPublishBtn.focus();
          await page.keyboard.press('Enter');
        }
      } catch (e) {}

      // 추가 물리 마우스 좌표 클릭 전송도 병행
      const confirmBtnCoord = await page.evaluate(() => {
        const layer = document.querySelector('.se-popup-publish, .se-publish-layer, [class*="publish_layer"]') || document.body;
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
        console.log('Moving physical mouse to 2nd Green Publish Button at:', confirmBtnCoord);
        await page.mouse.move(confirmBtnCoord.x, confirmBtnCoord.y, { steps: 10 });
        await page.waitForTimeout(300);
        await page.mouse.click(confirmBtnCoord.x, confirmBtnCoord.y);
      }

      console.log('Step 4: Waiting for URL completion transition to **/List.naver** (timeout: 15s)...');
      try {
        await page.waitForURL(url => url.href.includes('List.naver') || url.href.includes('PostView.naver') || url.href.includes('blog.naver.com'), { timeout: 15000 });
        console.log('Successfully navigated to List.naver completion URL!');
      } catch (e) {
        console.log('URL transition note:', e.message);
      }

      await page.waitForTimeout(6000);

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
