# 블로그 작성 자동화 오케스트레이터 (Main.md)

***

## 1. 프로젝트 목적
사용자가 제시한 주제에 대해 웹 리서치부터 포스팅 집필, 이미지 생성, HTML 변환, 네이버 블로그 다이렉트 자동 포스팅까지 자율 수행하는 블로그 오케스트레이션 시스템

***

## 2. 폴더 구조
* agents/ : 서브 에이전트 지침서 디렉토리 (researcher, writer, image_maker, assembler, publisher, naver_uploader)
* guides/ : 작성 규칙 및 디자인 가이드 문서 디렉토리 (image_guide.md, naver_blog_guide.md 등)
* scripts/ : 자동화 실행 스크립트 디렉토리 (naver_auto_upload.js 등)
* output/ : 주제별 결과물 저장 디렉토리 ([주제]/research.md, draft.md, images/, final.md, final.html, naver_upload_result.txt)

***

## 3. 작업 단계 (6Step 워크플로우)
* Step 1: agents 디렉토리의 researcher 지침 기반 웹 리서치 → output/[주제]/research.md
* Step 2: agents 디렉토리의 writer 지침 기반 본문 작성 → output/[주제]/draft.md
* Step 3: agents 디렉토리의 image_maker 지침 기반 이미지 생성 및 draft.md 마커 치환 → output/[주제]/images/
* Step 4: agents 디렉토리의 assembler 지침 기반 최종 통합 → output/[주제]/final.md, final.html
* Step 5: agents 디렉토리의 publisher 지침 기반 네이버 스마트에디터 포맷 조율 → output/[주제]/publish_log.txt
* Step 6: agents 디렉토리의 naver_uploader 지침 기반 Playwright 구동 네이버 다이렉트 자동 포스팅 → output/[주제]/naver_upload_result.txt

***

## 4. 핵심 원칙
* 메인 에이전트는 직접 리서치나 집필을 하지 않고 서브 에이전트에 전적으로 과업 위임
* 계정 비밀번호 등 민감 정보는 환경 변수로 전달하여 안전 관리
* 각 단계 전환 시 사용자에게 진행 상황을 짧게 안내
* 문서 및 코드 작성 시 하이픈 미사용 규칙 준수
