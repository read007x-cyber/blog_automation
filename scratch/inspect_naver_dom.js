const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const userDataDir = path.join(__dirname, 'naver_user_data');
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

  console.log('=== 네이버 블로그 에디터 DOM 구조 정밀 분석 시작 ===\n');
  await page.goto('https://blog.naver.com/read007x?Redirect=Write');
  await page.waitForTimeout(8000);

  // 복원 알림 해제
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  } catch (e) {}

  // [분석 1] 최상위 페이지의 전체 iframe 구조
  console.log('\n=== [분석 1] 최상위 페이지 iframe 구조 ===');
  const iframes = await page.evaluate(() => {
    const frames = Array.from(document.querySelectorAll('iframe'));
    return frames.map(f => ({
      name: f.name || '(없음)',
      id: f.id || '(없음)',
      src: f.src ? f.src.substring(0, 120) : '(없음)',
      width: f.offsetWidth,
      height: f.offsetHeight
    }));
  });
  console.log('최상위 페이지 iframe 목록:', JSON.stringify(iframes, null, 2));

  // [분석 2] mainFrame 진입
  console.log('\n=== [분석 2] mainFrame 진입 및 내부 구조 ===');
  let mainFrame = page.frame({ name: 'mainFrame' });
  if (!mainFrame) {
    const allFrames = page.frames();
    mainFrame = allFrames.find(f => f.url().includes('PostWriteForm') || f.url().includes('Write'));
    console.log('mainFrame not found by name, fallback search:', mainFrame ? mainFrame.url() : 'NOT FOUND');
  } else {
    console.log('mainFrame URL:', mainFrame.url());
  }

  if (mainFrame) {
    // [분석 3] mainFrame 내부 iframe 존재 여부
    console.log('\n=== [분석 3] mainFrame 내부 iframe 구조 ===');
    const innerIframes = await mainFrame.evaluate(() => {
      const frames = Array.from(document.querySelectorAll('iframe'));
      return frames.map(f => ({
        name: f.name || '(없음)',
        id: f.id || '(없음)',
        src: f.src ? f.src.substring(0, 120) : '(없음)',
        width: f.offsetWidth,
        height: f.offsetHeight
      }));
    });
    console.log('mainFrame 내부 iframe 목록:', JSON.stringify(innerIframes, null, 2));

    // [분석 4] mainFrame에서 '발행' 관련 버튼 전수 검색
    console.log('\n=== [분석 4] mainFrame 내부 "발행" 관련 버튼 전수 검색 ===');
    const publishButtons = await mainFrame.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button, a, span, div'));
      const results = [];
      for (const el of allButtons) {
        const text = (el.innerText || el.textContent || '').trim();
        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        if (text.includes('발행') || ariaLabel.includes('발행') || title.includes('발행') ||
            el.className.includes('publish') || el.className.includes('발행')) {
          results.push({
            tag: el.tagName,
            className: el.className.substring(0, 150),
            id: el.id || '',
            text: text.substring(0, 50),
            ariaLabel: ariaLabel,
            title: title,
            visible: el.offsetWidth > 0 && el.offsetHeight > 0,
            rect: (() => {
              const r = el.getBoundingClientRect();
              return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
            })()
          });
        }
      }
      return results;
    });
    console.log('mainFrame 발행 관련 요소:', JSON.stringify(publishButtons, null, 2));

    // [분석 5] .btn_publish, .se-publish-btn, 기타 관련 클래스 검색
    console.log('\n=== [분석 5] mainFrame 주요 publish 클래스 검색 ===');
    const publishClasses = await mainFrame.evaluate(() => {
      const selectors = [
        '.btn_publish', '.se-publish-btn', '.publish_btn',
        '.se-toolbar-button-publish', '[class*="publish"]',
        '.btn_reservation_list', '.se-popup-publish',
        '.se-publish-layer', '.layer_publish', '[class*="발행"]'
      ];
      const results = {};
      for (const sel of selectors) {
        try {
          const els = document.querySelectorAll(sel);
          results[sel] = Array.from(els).map(el => ({
            tag: el.tagName,
            className: el.className.substring(0, 120),
            text: (el.innerText || '').trim().substring(0, 60),
            visible: el.offsetWidth > 0 && el.offsetHeight > 0,
            rect: (() => {
              const r = el.getBoundingClientRect();
              return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
            })()
          }));
        } catch (e) {
          results[sel] = 'selector error';
        }
      }
      return results;
    });
    console.log('mainFrame publish 클래스 매칭 결과:', JSON.stringify(publishClasses, null, 2));
  }

  // [분석 6] 최상위 페이지에서도 '발행' 관련 버튼 검색
  console.log('\n=== [분석 6] 최상위 페이지 "발행" 관련 요소 검색 ===');
  const topPublishButtons = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button, a, span, div'));
    const results = [];
    for (const el of allButtons) {
      const text = (el.innerText || el.textContent || '').trim();
      if (text.includes('발행') || el.className.includes('publish')) {
        results.push({
          tag: el.tagName,
          className: el.className.substring(0, 150),
          id: el.id || '',
          text: text.substring(0, 50),
          visible: el.offsetWidth > 0 && el.offsetHeight > 0
        });
      }
    }
    return results;
  });
  console.log('최상위 페이지 발행 관련 요소:', JSON.stringify(topPublishButtons, null, 2));

  // [분석 7] 전체 프레임 목록 덤프
  console.log('\n=== [분석 7] Playwright 전체 Frame 목록 ===');
  const allFrames = page.frames();
  for (const f of allFrames) {
    console.log('  Frame name:', f.name(), '| URL:', f.url().substring(0, 120));
  }

  // 스크린샷 저장
  const ssPath = path.join(__dirname, 'naver_editor_dom_inspect.png');
  await page.screenshot({ path: ssPath, fullPage: true });
  console.log('\n스크린샷 저장 완료:', ssPath);

  // [분석 8] mainFrame에서 1차 발행 버튼 클릭 시도 후 팝업 DOM 분석
  console.log('\n=== [분석 8] 1차 발행 버튼 클릭 시도 및 팝업 DOM 분석 ===');
  if (mainFrame) {
    try {
      // 먼저 본문 영역 클릭 취소
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // 발행 버튼 클릭 시도
      const clickResult = await mainFrame.evaluate(() => {
        // 방법 1: .btn_publish
        let btn = document.querySelector('.btn_publish');
        if (btn) { btn.click(); return 'clicked .btn_publish'; }
        // 방법 2: button에서 발행 텍스트 찾기
        const btns = Array.from(document.querySelectorAll('button'));
        btn = btns.find(b => (b.innerText || '').trim() === '발행');
        if (btn) { btn.click(); return 'clicked button:text(발행) class=' + btn.className; }
        // 방법 3: se-publish-btn
        btn = document.querySelector('.se-publish-btn');
        if (btn) { btn.click(); return 'clicked .se-publish-btn'; }
        return 'NO PUBLISH BUTTON FOUND';
      });
      console.log('1차 발행 버튼 클릭 결과:', clickResult);

      await page.waitForTimeout(3000);

      // 팝업 스크린샷
      const ssPath2 = path.join(__dirname, 'naver_editor_publish_popup.png');
      await page.screenshot({ path: ssPath2, fullPage: true });
      console.log('팝업 스크린샷 저장 완료:', ssPath2);

      // 팝업 DOM 분석
      const popupDom = await mainFrame.evaluate(() => {
        const popupSelectors = [
          '.se-popup-publish', '.se-publish-layer', '.layer_publish',
          '[class*="popup-publish"]', '[class*="publish-layer"]',
          '[class*="popup_publish"]', '[class*="publish_layer"]',
          '.se-popup', '.se-layer'
        ];
        const found = {};
        for (const sel of popupSelectors) {
          try {
            const els = document.querySelectorAll(sel);
            if (els.length > 0) {
              found[sel] = Array.from(els).map(el => ({
                tag: el.tagName,
                className: el.className.substring(0, 200),
                visible: el.offsetWidth > 0 && el.offsetHeight > 0,
                display: getComputedStyle(el).display,
                visibility: getComputedStyle(el).visibility,
                childCount: el.children.length,
                innerHTML_preview: el.innerHTML.substring(0, 500)
              }));
            }
          } catch (e) {}
        }

        // 현재 visible popup 중 "발행" 텍스트 포함 버튼 찾기
        const visibleBtns = Array.from(document.querySelectorAll('button'));
        const pubBtns = visibleBtns.filter(b => {
          const t = (b.innerText || '').trim();
          return t.includes('발행') && b.offsetWidth > 0 && b.offsetHeight > 0;
        }).map(b => ({
          tag: b.tagName,
          className: b.className.substring(0, 150),
          text: (b.innerText || '').trim().substring(0, 50),
          parentClassName: b.parentElement ? b.parentElement.className.substring(0, 150) : '',
          rect: (() => {
            const r = b.getBoundingClientRect();
            return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
          })()
        }));

        return { popupSelectors: found, visiblePublishButtons: pubBtns };
      });
      console.log('\n팝업 DOM 분석 결과:', JSON.stringify(popupDom, null, 2));

    } catch (e) {
      console.log('팝업 분석 오류:', e.message);
    }
  }

  console.log('\n=== DOM 구조 정밀 분석 완료 ===');
  console.log('브라우저 창은 열린 상태로 유지됩니다.');

  // 영구 열린 상태 유지
  await new Promise(() => {});
})();
