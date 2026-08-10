# 이미지 메이커 에이전트 수행 리포트

본 리포트는 agents/image_maker.md 지침 및 guides/image_guide.md 규격에 따라 블로그 초안(output/클로드 코드의 핵심 기능 5가지/draft.md)의 대표 섬네일 및 본문 카드를 생성하고 캡처 검수를 진행하는 과정입니다.

***

## 1. 캡처 대상 목록 및 구성 계획

* 대표 섬네일: output/클로드 코드의 핵심 기능 5가지/images/thumbnail.png (1080px 1대1 정사각형, 블루 퍼플 그라데이션)
* 본문 이미지 1: output/클로드 코드의 핵심 기능 5가지/images/body_1.png (터미널 다이렉트 명령 박스)
* 본문 이미지 2: output/클로드 코드의 핵심 기능 5가지/images/body_2.png (서브에이전트 자율 피드백 단계별 다이어그램)
* 본문 이미지 3: output/클로드 코드의 핵심 기능 5가지/images/body_3.png (MCP 구조 연동 비교 체계)
* 본문 이미지 4: output/클로드 코드의 핵심 기능 5가지/images/body_4.png (CLAUDE.md 지속적 메모리 포인트 카드)

***

## 2. 작업 순서 및 검수 지침

1. Python Playwright 기반의 HTML CSS PNG 캡처 스크립트 작성 및 실행
2. view_file 도구를 이용한 시각적 자체 검수 루프 수행 (여백, 잘림, 비뚤어짐 점검)
3. draft.md 파일 내의 [IMAGE: ...] 마커를 치환 업데이트
4. ASCII 하이픈 미사용 규칙 철저히 검증
