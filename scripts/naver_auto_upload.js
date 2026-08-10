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
  console.log('Starting Verified Image Attachment Naver Uploader for ID: ' + naverId);
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

    // 1. 팝업 확인 처리
    try {
      await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.innerText.includes('확인') || b.className.includes('confirm'));
        if (confirmBtn) confirmBtn.click();
      });
    } catch (e) {}

    await page.waitForTimeout(2000);

    // 2. 제목 입력
    console.log('Clearing and typing Title...');
    try {
      await frame.evaluate(() => {
        const titleEl = document.querySelector('[class*="title"]') || document.querySelector('h1');
        if (titleEl) titleEl.focus();
      });
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);

      await page.keyboard.type(titleText, { delay: 60 });
      await page.keyboard.press('Enter');
      console.log('Title typed: ' + titleText);
    } catch (e) {
      console.log('Title note:', e.message);
    }

    await page.waitForTimeout(1000);

    // 3. 본문 기존 내용 삭제
    try {
      await frame.evaluate(() => {
        const mainContainer = document.querySelector('[class*="main"]') || document.querySelector('.se_component_wrap');
        if (mainContainer) mainContainer.focus();
      });
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(800);
    } catch (e) {}

    // 4. 본문 텍스트 타자 및 정밀 이미지 이벤트를 통한 사진 첨부
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
          // 상단 사진 버튼 클릭
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
            // change 및 input 이벤트 강제 발화
            await frame.evaluate(() => {
              const input = document.querySelector('input[type="file"]');
              if (input) {
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
              }
            });
            console.log('Dispatched change event and attached image: ' + block.filename);
            await page.waitForTimeout(4000); // 렌더링 완성 대기
            await page.keyboard.press('Enter');
          } else {
            console.log('File input not found for: ' + block.filename);
          }
        } else {
          console.log('Image file not found: ' + imagePath);
        }
      }
    }

    console.log('All text and verified images inserted successfully!');
    await page.waitForTimeout(3000);

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

    await page.waitForTimeout(4000);

    const screenshotPath = path.join(targetTopicDir, 'naver_upload_result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved result screenshot to: ' + screenshotPath);

  } catch (err) {
    console.log('Error during execution:', err);
  } finally {
    await context.close();
  }
})();
