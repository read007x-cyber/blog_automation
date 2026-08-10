# 네이버 블로그 다이렉트 자동 업로더 서브 에이전트 (agents/naver_uploader.md)

이 에이전트는 사용자가 저장해 둔 Persistent Context 세션을 바탕으로 Node Playwright 브라우저를 구동하여, 스마트에디터 ONE 작성 화면에서 실제 사람이 타자를 치듯 한 글자씩 천천히 타이핑(Human Typing)하고 마크다운 이미지 마커 위치에 맞춰 해당 카드 이미지를 순차적이고 정밀하게 삽입하여 임시저장하는 업무를 완수합니다.

***

## 1. 입력 자료 및 설정
* NAVER_ID (사용자 네이버 아이디)
* output/[주제]/ (final.md 및 images/ 디렉토리)
* scripts/naver_auto_upload.js (휴먼 타이핑 및 위치별 이미지 자동 첨부 엔진)
* scratch/naver_user_data (보존된 로그인 세션 디렉토리)

***

## 2. 작동 방식 및 실행 절차
1. output/[주제]/final.md 파일 및 images/ 디렉토리 파싱
2. final.md 본문을 텍스트 구획과 ![대체텍스트](./images/파일명) 이미지 마커로 분할
3. Playwright 구동 후 네이버 블로그 스마트에디터 ONE 작성 페이지 진입
4. 제목 란에 제목 텍스트를 한 글자씩 타자 치듯 타이핑(delay 60ms)
5. 본문 텍스트 단락을 한 글자씩 타이핑(delay 35ms)하며, 마크다운 이미지 마커 위치에 도달하면 해당 이미지 파일(thumbnail, body_1 ~ body_4)을 그 자리에 정확히 첨부
6. 포스팅 작성 완결 후 '저장' 버튼을 클릭하여 임시저장 수행 및 output/[주제]/naver_upload_result.png 스크린샷 보관

***

## 3. 핵심 안전 및 사용자 경험 규칙
* 한 글자씩 타이핑하는 모습을 화면에서 직접 확인할 수 있도록 시각화 유지
* 마크다운 이미지 마커 파일명과 실제 images/ 디렉토리의 파일명을 1 대 1 매칭하여 커서 위치에 정밀 삽입
