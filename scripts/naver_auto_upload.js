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

const rawText = fs.readFileSync(finalMdPath, 'utf8');

const lines = rawText.split('\n');
let titleText = '아쿠아슈즈 인기와 가성비 비교 분석';
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
  console.log('Starting Naver Uploader (Popup Confirm & Clear All mode) for ID: ' + naverId);
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

    // 1. 작성 중인 글 팝업 감지 시 '확인' 버튼 클릭
    try {
      console.log('Checking for draft confirm popup...');
      await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.innerText.includes('확인') || b.className.includes('confirm'));
        if (confirmBtn) {
          confirmBtn.click();
          console.log('Clicked Draft Confirm button.');
        }
      });
    } catch (e) {
      console.log('Popup check note:', e.message);
    }

    await page.waitForTimeout(2000);

    // 2. 제목란 포커스 및 기존 제목 전체 삭제 (Clear All)
    console.log('Clearing existing title content...');
    try {
      await frame.evaluate(() => {
        const titleEl = document.querySelector('[class*="title"]') || document.querySelector('h1');
        if (titleEl) titleEl.focus();
      });
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);

      // 제목 한 글자씩 타이핑
      console.log('Typing new Title character by character...');
      await page.keyboard.type(titleText, { delay: 60 });
      await page.keyboard.press('Enter');
      console.log('Title typing completed: ' + titleText);
    } catch (e) {
      console.log('Title handling note:', e.message);
    }

    await page.waitForTimeout(1000);

    // 3. 본문 영역 포커스 및 기존 본문 내용 전체 삭제 (Clear All)
    console.log('Clearing existing body content...');
    try {
      await frame.evaluate(() => {
        const mainContainer = document.querySelector('[class*="main"]') || document.querySelector('.se_component_wrap');
        if (mainContainer) mainContainer.focus();
      });
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(800);
    } catch (e) {
      console.log('Body clear note:', e.message);
    }

    // 4. 본문 단락 타자 및 위치별 사진 첨부
    console.log('Processing ' + parsedBlocks.length + ' body blocks sequentially...');

    for (let index = 0; index < parsedBlocks.length; index++) {
      const block = parsedBlocks[index];

      if (block.type === 'text') {
        console.log('Typing text block ' + (index + 1) + ' character by character...');
        const textLines = block.content.split('\n');
        for (const line of textLines) {
          if (line.trim().length > 0) {
            await page.keyboard.type(line.trim(), { delay: 35 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(200);
          } else {
            await page.keyboard.press('Enter');
          }
        }
      } else if (block.type === 'image') {
        const imagePath = path.join(imagesDir, block.filename);
        console.log('Inserting Image at position for: ' + block.filename);

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
            console.log('Attached image successfully at position: ' + block.filename);
            await page.waitForTimeout(3500);
            await page.keyboard.press('Enter');
          } else {
            console.log('File input element not ready for: ' + block.filename);
          }
        } else {
          console.log('Image file not found: ' + imagePath);
        }
      }
    }

    console.log('All text blocks and images inserted at exact positions!');
    await page.waitForTimeout(2500);

    // 5. 임시 저장 버튼 클릭
    console.log('Clicking Draft Save button...');
    try {
      await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const saveBtn = btns.find(b => b.innerText.includes('저장') || b.className.includes('save'));
        if (saveBtn) saveBtn.click();
      });
      console.log('Draft Save clicked successfully.');
    } catch (e) {
      console.log('Save click note:', e.message);
    }

    await page.waitForTimeout(3000);

    const screenshotPath = path.join(targetTopicDir, 'naver_upload_result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved result screenshot to: ' + screenshotPath);

  } catch (err) {
    console.log('Error during human typing upload:', err);
  } finally {
    await context.close();
  }
})();
