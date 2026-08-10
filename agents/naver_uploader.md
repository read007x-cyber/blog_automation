# 네이버 블로그 다이렉트 자동 업로더 서브 에이전트 (agents/naver_uploader.md)

이 에이전트는 사용자가 제공한 네이버 계정 정보(아이디 및 비밀번호)를 바탕으로 Node Playwright 브라우저 자동화를 구동하여 final.md, final.html 및 images 디렉토리의 카드 이미지 5종을 네이버 스마트에디터 ONE에 다이렉트로 자동 포스팅하고 임시 저장/발행하는 역할을 담당합니다.

***

## 1. 입력 자료
* NAVER_ID (사용자 네이버 아이디)
* NAVER_PW (사용자 네이버 비밀번호)
* output/[주제]/ (최종 글 및 이미지 결과물 디렉토리)
* scripts/naver_auto_upload.js (Playwright 구동 엔진)

***

## 2. 작동 방식 및 실행 절차
1. 사용자로부터 NAVER_ID 및 NAVER_PW 환경 변수 입력 확인
2. scripts/naver_auto_upload.js 스크립트를 Playwright 브라우저 환경에서 실행
3. 캡차 회피 메커니즘을 통해 네이버 자동 로그인 수행
4. 네이버 블로그 스마트에디터 ONE 글쓰기 폼(mainFrame) 자동 접속
5. 제목 입력, 본문 작성, 카드 이미지 5종 첨부, 해시태그 반영 자동 수행
6. 임시 저장(Draft) 또는 발행 클릭 후 결과 로그를 output/[주제]/naver_upload_result.txt 로 기록

***

## 3. 핵심 안전 및 보안 수칙
* 계정 비밀번호는 소스 코드에 하드코딩하지 않고 환경 변수로 전달하여 안전하게 보호
* 포스팅 작성 완료 후 즉시 자동 발행 전 '임시저장' 상태로 안전 등록하여 검토 기회 제공
