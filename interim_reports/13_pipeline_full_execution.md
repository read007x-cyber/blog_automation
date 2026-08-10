# 파이프라인 전체 실행 리포트

본 리포트는 메인 오케스트레이터(Main.md) 지침에 따라 "클로드 코드의 핵심 기능 5가지" 주제에 대한 전체 4Step 블로그 작성 자동화 파이프라인을 실행하는 과정을 기록합니다.

***

## 1. 파이프라인 실행 개요

* 주제: 클로드 코드의 핵심 기능 5가지
* 오케스트레이팅 지침: Main.md
* 대상 서브 에이전트: researcher, writer, image_maker, assembler

***

## 2. 단계별 진행 예정사항

1. Step 1: 웹 리서치 수행 (researcher 에이전트) → output/[주제]/research.md
2. Step 2: 포스팅 글 초안 작성 (writer 에이전트) → output/[주제]/draft.md
3. Step 3: 카드 이미지 자동 캡처 및 마커 치환 (image_maker 에이전트) → output/[주제]/images/ 및 draft.md 치환
4. Step 4: 최종 결합 및 미리보기 HTML 생성 (assembler 에이전트) → output/[주제]/final.md, final.html

***

## 3. 하이픈 미사용 준수

* 파이프라인 전체 산출물 및 문서 내에서 ASCII 하이픈 문자를 전면 배제합니다.
