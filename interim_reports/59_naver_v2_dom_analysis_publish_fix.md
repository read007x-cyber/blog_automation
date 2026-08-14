# 네이버 블로그 자동 발행 v2 DOM 분석 기반 완전 보완 리포트

본 리포트는 네이버 블로그 에디터의 실제 DOM 구조를 정밀 분석하여 발행 실패의 근본 원인을 규명하고, CSS Modules 해시 접미사 대응 셀렉터로 발행 로직을 완전 재작성하여 최초 발행 성공을 달성한 내역을 기록합니다.

***

## 1. 근본 원인 진단

* 원인 1. CSS 클래스명 완전 불일치:
  * 기존 스크립트가 사용하던 모든 셀렉터(.btn_publish, .se-publish-btn, .se-popup-publish, .se-publish-layer)가 현재 네이버 에디터에 존재하지 않음
  * 네이버가 React 기반 CSS Modules(해시 접미사 포함)로 에디터를 재구축하여 클래스명이 `publish_btn__m9KHH`, `confirm_btn__WEaBq` 등으로 변경됨
* 원인 2. 복원 알림 팝업이 발행 팝업을 물리적으로 차단:
  * "작성 중인 글이 있습니다" 팝업(se-popup-alert-confirm)이 에디터 위에 오버레이되어 발행 버튼 클릭 이벤트를 차단
  * 기존 Escape 키 1회 전송으로는 완전 해제되지 않음
* 원인 3. URL 전환 감지 패턴 불일치:
  * 발행 성공 시 URL이 `blog.naver.com/{userId}/{logNo}` 형태로 바뀌는데, 기존에는 `List.naver`만 감지하여 성공을 인식하지 못함

## 2. DOM 분석 결과 (실측 데이터)

* 페이지 구조: page → iframe[name="mainFrame"](전체 화면 차지) → 에디터 React 앱
* 1차 발행 버튼:
  * 셀렉터: `button[class*="publish_btn__"]`
  * 실측 클래스: `publish_btn__m9KHH`
  * 위치: mainFrame 내부 우측 상단 (x:1180, y:7, 70×30)
* 발행 설정 닫기 버튼:
  * 셀렉터: `button[class*="publish_fold_btn__"]`
  * 실측 클래스: `publish_fold_btn__DtZcG`
  * 위치: (x:1209, y:233, 25×25)
* 2차 최종 발행 버튼:
  * 셀렉터: `button[class*="confirm_btn__"]`
  * 실측 클래스: `confirm_btn__WEaBq` (부모: `btn_area__fO7mp`)
  * 위치: mainFrame 내부 우측 하단 (x:1119, y:536, 110×40)

## 3. 보완 내용 (v2 스크립트)

* 복원 팝업 3회 반복 제거 + DOM 강제 삭제:
  1. se-popup-button-cancel 클릭 → Escape 전송 → DOM remove() 순차 실행 × 3회
  2. 최종 se-popup-alert, se-popup-dim 잔여 요소 강제 제거
* CSS Modules 해시 접미사 부분 매칭 셀렉터 사용:
  1. `button[class*="publish_btn__"]` → 해시 접미사 변동에 안전
  2. `button[class*="confirm_btn__"]` → 해시 접미사 변동에 안전
* 발행 패널 열림 확인 로직 추가:
  1. confirm_btn 가시성 체크로 발행 패널이 실제 열렸는지 검증
  2. 미노출 시 1차 발행 버튼 재클릭
* 완전한 마우스 이벤트 시퀀스 (방법 A):
  1. mouseover → mouseenter → mousemove → mousedown → mouseup → click 전체 이벤트 체인 재현
* 4중 발행 방법 병행 적용:
  1. 방법 A: DOM evaluate 완전 마우스 이벤트 시퀀스
  2. 방법 B: Playwright locator click(force:true)
  3. 방법 C: 물리 마우스 좌표 호버 5초 체류 + down/up/click
  4. 방법 D: focus() + Enter 키
* URL 전환 감지 개선:
  1. PostList.naver, PostView.naver, blog.naver.com/{userId}/{logNo} 패턴 모두 감지
  2. 감지 실패 시 mainFrame URL 2차 확인

## 4. 발행 성공 증적

* 발행 URL: https://blog.naver.com/read007x/224378187371
* mainFrame 전환 URL: PostView.naver?blogId=read007x&logNo=224378187371&isAfterWrite=true
* 검수 스크린샷: output/아쿠아슈즈 인기와 가성비 비교 분석/naver_upload_result.png
* 관련 스크립트: scripts/naver_auto_upload.js
