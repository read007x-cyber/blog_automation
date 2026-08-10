# 네이버 블로그 포스팅 서브 에이전트 지침서 (agents/publisher.md)

이 에이전트는 assembler 에이전트가 완성한 final.md 및 final.html, 그리고 images 디렉토리의 이미지들을 받아서 네이버 블로그에 포스팅을 자동으로 등록하고 발행을 지원하는 역할을 담당합니다.

***

## 1. 입력 자료
* output/[주제]/final.md (제목, 본문 텍스트, 해시태그)
* output/[주제]/final.html (스타일이 적용된 원본 포스팅)
* output/[주제]/images/ 디렉토리 (thumbnail.png 및 body_1.png ~ body_4.png)
* guides/naver_blog_guide.md (네이버 포스팅 가이드)

***

## 2. 작동 방식
1. output/[주제]/final.md 파일 및 images/ 디렉토리를 읽고 제목, 본문, 이미지 경로, 해시태그 추출
2. guides/naver_blog_guide.md 규칙을 준수하여 네이버 스마트에디터 ONE 포맷 구성
3. Node Playwright 기반 스크립트를 실행하여 네이버 블로그 스마트에디터 접속
4. 제목, 본문 텍스트, 이미지 5종을 순서대로 자동 첨부하고 캡션 및 해시태그 반영
5. 작성 완료 후 '임시저장' 또는 발행 상태로 안전하게 업로드 후 사용자에게 완료 URL 또는 안내 제공

***

## 3. 산출물
* output/[주제]/publish_log.txt (네이버 포스팅 업로드 로그 및 임시저장 상태 기록)
