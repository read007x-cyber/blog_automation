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
let titleText = '';
let bodyStartIndex = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.length > 0 && !line.includes('━━━')) {
    titleText = line.replace(/\[|\]/g, '').replace(/—/g, ' ').replace(/#/g, '').trim();
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
  console.log('=== 네이버 블로그 자동 발행 스크립트 v2 (DOM 분석 기반 보완) ===');
  console.log('ID: ' + naverId + ' | Mode: ' + uploadMode);
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
    // ===================================================================
    // 1단계: 에디터 페이지 진입
    // ===================================================================
    console.log('\n[1단계] 네이버 블로그 에디터 페이지 진입...');
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
    console.log('mainFrame 컨텍스트 획득 완료. URL: ' + (frame.url() || '').substring(0, 80));

    // ===================================================================
    // 2단계: 복원 알림 팝업 확실히 제거
    // (핵심 수정: 이 팝업이 발행 팝업과 겹쳐 클릭을 차단하는 근본 원인)
    // ===================================================================
    console.log('\n[2단계] 복원 알림 팝업("작성 중인 글이 있습니다") 완전 제거...');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const dismissed = await frame.evaluate(() => {
          // se-popup-alert-confirm 복원 팝업의 "취소" 버튼 클릭
          const cancelBtn = document.querySelector('.se-popup-button-cancel');
          if (cancelBtn && cancelBtn.offsetWidth > 0) {
            cancelBtn.click();
            return 'cancel_clicked';
          }
          // 혹은 확인 버튼
          const confirmBtn = document.querySelector('.se-popup-button-confirm');
          if (confirmBtn && confirmBtn.offsetWidth > 0) {
            confirmBtn.click();
            return 'confirm_clicked';
          }
          // dim 레이어 강제 제거
          const dims = document.querySelectorAll('.se-popup-dim, .se-popup-alert-confirm, .se-popup-alert');
          if (dims.length > 0) {
            dims.forEach(d => d.remove());
            return 'dom_removed_' + dims.length;
          }
          return 'no_popup';
        });
        console.log('  시도 ' + (attempt + 1) + ': ' + dismissed);
        if (dismissed === 'no_popup') break;
      } catch (e) {}
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    // 최종 Escape 전송 및 안정화 대기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    // 팝업 완전 제거 확인
    const popupGone = await frame.evaluate(() => {
      const popup = document.querySelector('.se-popup-alert-confirm');
      if (popup) {
        popup.remove();
        const dim = document.querySelector('.se-popup-dim');
        if (dim) dim.remove();
        return 'force_removed';
      }
      return 'clean';
    });
    console.log('  팝업 최종 상태: ' + popupGone);
    await page.waitForTimeout(1000);

    // ===================================================================
    // 3단계: 제목 입력
    // ===================================================================
    console.log('\n[3단계] 제목 입력: "' + titleText.substring(0, 40) + '..."');
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
      await page.keyboard.type(titleText, { delay: 60 });
      await page.keyboard.press('Enter');
      console.log('  제목 입력 완료!');
    } catch (e) {
      console.log('  제목 입력 참고:', e.message);
    }

    await page.waitForTimeout(1000);

    // ===================================================================
    // 4단계: 본문 영역 초기화
    // ===================================================================
    console.log('\n[4단계] 본문 영역 초기화...');
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

    // ===================================================================
    // 5단계: 본문 텍스트 작성 및 이미지 첨부
    // ===================================================================
    console.log('\n[5단계] 본문 콘텐츠 입력 (' + parsedBlocks.length + '개 블록)...');

    for (let index = 0; index < parsedBlocks.length; index++) {
      const block = parsedBlocks[index];

      if (block.type === 'text') {
        console.log('  텍스트 블록 ' + (index + 1) + '/' + parsedBlocks.length);
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
        console.log('  이미지 첨부: ' + block.filename);

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
            console.log('    이미지 첨부 성공: ' + block.filename);
            await page.waitForTimeout(4000);
            await page.keyboard.press('Enter');
          }
        }
      }
    }

    console.log('  모든 콘텐츠 입력 완료!');

    // ===================================================================
    // 6단계: 파일 첨부 창/팝업 100% 닫기 (클린 상태 확보)
    // ===================================================================
    console.log('\n[6단계] 파일 첨부 창 및 팝업 100% 닫기...');
    await frame.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.se-popup-button-cancel, .se-popup-close-button, [class*="close"]'));
      closeBtns.forEach(b => { try { b.click(); } catch(e) {} });
    });
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2000);

    // 남아 있는 se-popup 모두 강제 제거
    await frame.evaluate(() => {
      const popups = document.querySelectorAll('.se-popup-alert, .se-popup-dim');
      popups.forEach(p => p.remove());
    });
    await page.waitForTimeout(1000);

    // ===================================================================
    // 7단계: 발행 실행 (DOM 분석 기반 정확한 셀렉터 사용)
    // ===================================================================
    if (uploadMode === 'publish') {
      console.log('\n[7단계] 발행 실행 시작...');

      // -----------------------------------------------------------------
      // 7-1: 에디터 본문에서 포커스를 이탈시킴 (헤더 영역 클릭)
      // -----------------------------------------------------------------
      console.log('  7-1: 에디터 포커스 이탈 (헤더 클릭)...');
      try {
        await frame.evaluate(() => {
          const header = document.querySelector('[class*="header__"]');
          if (header) header.click();
        });
      } catch (e) {}
      await page.waitForTimeout(500);

      // -----------------------------------------------------------------
      // 7-2: 1차 발행 버튼 클릭 (우측 상단 초록색 "발행" 버튼)
      // 실제 DOM 클래스: publish_btn__m9KHH (CSS Modules 해시 접미사 포함)
      // 위치: mainFrame 내부, x:1180 y:7 70x30
      // -----------------------------------------------------------------
      console.log('  7-2: 1차 발행 버튼 클릭 (CSS Modules: [class*="publish_btn__"])...');
      let firstBtnClicked = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const clicked = await frame.evaluate(() => {
            // 해시 접미사가 변할 수 있으므로 부분 매칭(contains) 사용
            const btn = document.querySelector('button[class*="publish_btn__"]');
            if (btn && btn.offsetWidth > 0) {
              btn.click();
              return true;
            }
            // 폴백: 텍스트가 정확히 "발행"인 버튼 (부모가 header 영역)
            const btns = Array.from(document.querySelectorAll('button'));
            const headerBtn = btns.find(b => {
              const t = (b.innerText || '').trim();
              return t === '발행' && b.className.includes('publish_btn');
            });
            if (headerBtn) {
              headerBtn.click();
              return true;
            }
            return false;
          });
          if (clicked) {
            console.log('    1차 발행 버튼 클릭 성공 (시도 ' + (attempt + 1) + ')');
            firstBtnClicked = true;
            break;
          }
        } catch (e) {
          console.log('    시도 ' + (attempt + 1) + ' 실패:', e.message);
        }
        await page.waitForTimeout(1000);
      }

      if (!firstBtnClicked) {
        // 물리 좌표 폴백 클릭 (DOM 분석에서 확인된 좌표: x:1215, y:22)
        console.log('    폴백: 물리 좌표(1215, 22)로 1차 발행 버튼 클릭...');
        await page.mouse.click(1215, 22);
      }

      // -----------------------------------------------------------------
      // 7-3: 발행 설정 팝업(우측 슬라이드 패널) 완전 노출 대기
      // -----------------------------------------------------------------
      console.log('  7-3: 발행 설정 패널 노출 대기 (3초)...');
      await page.waitForTimeout(3000);

      // 발행 팝업이 열렸는지 확인 (confirm_btn 가시성 체크)
      const panelOpen = await frame.evaluate(() => {
        const confirmBtn = document.querySelector('button[class*="confirm_btn__"]');
        return confirmBtn && confirmBtn.offsetWidth > 0 && confirmBtn.offsetHeight > 0;
      });
      console.log('    발행 패널 열림 확인: ' + panelOpen);

      if (!panelOpen) {
        // 패널이 안 열렸으면 1차 버튼 재클릭
        console.log('    패널 미노출! 1차 발행 버튼 재클릭 시도...');
        await frame.evaluate(() => {
          const btn = document.querySelector('button[class*="publish_btn__"]');
          if (btn) btn.click();
        });
        await page.waitForTimeout(3000);
      }

      // -----------------------------------------------------------------
      // 7-4: 남아 있는 복원 팝업 재확인 및 강제 제거
      // (발행 패널이 열린 상태에서도 복원 팝업이 겹칠 수 있음)
      // -----------------------------------------------------------------
      console.log('  7-4: 발행 전 최종 팝업 제거...');
      await frame.evaluate(() => {
        const alertPopups = document.querySelectorAll('.se-popup-alert, .se-popup-alert-confirm, .se-popup-dim');
        alertPopups.forEach(p => p.remove());
      });
      await page.waitForTimeout(500);

      // -----------------------------------------------------------------
      // 7-5: 2차 최종 발행 버튼 클릭 (팝업 하단 초록색 "✓ 발행" 버튼)
      // 실제 DOM 클래스: confirm_btn__WEaBq (부모: btn_area__fO7mp)
      // 위치: mainFrame 내부, x:1119 y:536 110x40
      // -----------------------------------------------------------------
      console.log('  7-5: 2차 최종 발행 버튼 클릭 (CSS Modules: [class*="confirm_btn__"])...');

      // 방법 A: DOM evaluate로 직접 클릭
      const confirmClickResult = await frame.evaluate(() => {
        const btn = document.querySelector('button[class*="confirm_btn__"]');
        if (btn && btn.offsetWidth > 0) {
          // 마우스 이벤트 시퀀스 완전 재현
          btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
          return { clicked: true, className: btn.className, text: btn.innerText.trim() };
        }
        return { clicked: false };
      });
      console.log('    방법 A (DOM 이벤트 시퀀스):', JSON.stringify(confirmClickResult));

      await page.waitForTimeout(1000);

      // 방법 B: Playwright locator로 직접 클릭
      try {
        const confirmLocator = frame.locator('button[class*="confirm_btn__"]').first();
        if (await confirmLocator.isVisible({ timeout: 2000 })) {
          await confirmLocator.click({ force: true });
          console.log('    방법 B (Playwright locator click): 성공');
        }
      } catch (e) {
        console.log('    방법 B 참고:', e.message);
      }

      await page.waitForTimeout(1000);

      // 방법 C: 물리 마우스 좌표 호버 5초 체류 후 클릭
      // (DOM 분석 결과 confirm_btn 좌표: x:1119 y:536 w:110 h:40)
      // mainFrame이 최상위 iframe(전체 화면)이므로 좌표를 그대로 사용
      const confirmCoord = await frame.evaluate(() => {
        const btn = document.querySelector('button[class*="confirm_btn__"]');
        if (btn && btn.offsetWidth > 0) {
          const rect = btn.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return null;
      });

      if (confirmCoord) {
        console.log('    방법 C: 물리 마우스 이동 (' + Math.round(confirmCoord.x) + ', ' + Math.round(confirmCoord.y) + ') 좌표...');
        await page.mouse.move(confirmCoord.x, confirmCoord.y, { steps: 10 });
        console.log('    5초 호버 체류...');
        await page.waitForTimeout(5000);
        console.log('    물리 마우스 클릭!');
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.mouse.click(confirmCoord.x, confirmCoord.y);
      } else {
        // 폴백 고정 좌표 사용
        console.log('    방법 C 폴백: 고정 좌표(1174, 556)로 클릭...');
        await page.mouse.move(1174, 556, { steps: 10 });
        await page.waitForTimeout(5000);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.mouse.click(1174, 556);
      }

      // 방법 D: focus 후 Enter 키
      try {
        const confirmLocator2 = frame.locator('button[class*="confirm_btn__"]').first();
        if (await confirmLocator2.isVisible({ timeout: 1000 })) {
          await confirmLocator2.focus();
          await page.keyboard.press('Enter');
          console.log('    방법 D (focus + Enter): 전송');
        }
      } catch (e) {}

      // -----------------------------------------------------------------
      // 7-6: 발행 완료 URL 전환 대기
      // -----------------------------------------------------------------
      console.log('  7-6: 발행 완료 URL 전환 대기 (20초)...');
      let publishSuccess = false;
      try {
        // 발행 성공 시: 최상위 URL이 blog.naver.com/{userId}/{logNo} 또는 PostView로 변경됨
        await page.waitForURL(
          url => {
            const href = url.href;
            return href.includes('PostList.naver') ||
                   href.includes('PostView.naver') ||
                   /blog\.naver\.com\/\w+\/\d+/.test(href);
          },
          { timeout: 20000 }
        );
        publishSuccess = true;
        console.log('    발행 성공! 현재 URL: ' + page.url());
      } catch (e) {
        // URL 전환 감지 실패 시에도 mainFrame URL로 2차 확인
        const currentFrameUrl = frame.url();
        console.log('    URL 전환 감지 시간 초과. 현재 top URL: ' + page.url());
        console.log('    mainFrame URL: ' + currentFrameUrl);

        if (currentFrameUrl.includes('PostView') || page.url().match(/blog\.naver\.com\/\w+\/\d+/)) {
          publishSuccess = true;
          console.log('    mainFrame URL 기반으로 발행 성공 확인!');
        } else if (currentFrameUrl.includes('PostWriteForm')) {
          console.log('    아직 에디터 화면. 발행 미완료. confirm_btn 재클릭 시도...');
          try {
            const stillVisible = await frame.evaluate(() => {
              const btn = document.querySelector('button[class*="confirm_btn__"]');
              if (btn && btn.offsetWidth > 0) {
                btn.click();
                return true;
              }
              return false;
            });
            if (stillVisible) {
              console.log('    최종 재시도: confirm_btn 재클릭');
              await page.waitForTimeout(15000);
              if (frame.url().includes('PostView') || page.url().match(/blog\.naver\.com\/\w+\/\d+/)) {
                publishSuccess = true;
              }
            }
          } catch (e) {}
        }
      }
      console.log('  발행 결과: ' + (publishSuccess ? '성공' : '확인 필요'));

      await page.waitForTimeout(3000);

      // 블로그 포스트 목록 페이지로 이동하여 결과 확인
      console.log('\n[8단계] 블로그 포스트 목록으로 이동하여 결과 확인...');
      await page.goto('https://blog.naver.com/PostList.naver?blogId=' + naverId);
      await page.waitForTimeout(6000);

      const screenshotPath = path.join(targetTopicDir, 'naver_upload_result.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('결과 스크린샷 저장: ' + screenshotPath);

    } else {
      // 임시 저장 모드
      console.log('\n[7단계] 임시 저장 모드: 저장 버튼 클릭...');
      try {
        await frame.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const saveBtn = btns.find(b => (b.innerText || '').includes('저장') || b.className.includes('save'));
          if (saveBtn) saveBtn.click();
        });
      } catch (e) {}
    }

  } catch (err) {
    console.log('실행 오류:', err);
  }

  console.log('\n=== 스크립트 완료. 브라우저 창 영구 유지 중... ===');
  await new Promise(() => {});
})();
