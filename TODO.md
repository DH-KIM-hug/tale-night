# 할 일 (2026-11-02 기준)

다음 세션은 이 파일과 `CLAUDE.md` 부터 읽는다. 지금 상태는 `README.md` '지금 들어 있는 것'.

## 1. 그림 88장 — 가장 먼저
- 목록·크기·규칙: [`docs/ART_LIST.md`](docs/ART_LIST.md). 무대 12벌 × 4층(48장) + 종이 인형 36장 + 스플래시 4장.
- **이미지 생성(ChatGPT·Codex)으로 만든다. 코드로 그리지 않는다**(SVG 제작은 사용자 결정으로 취소).
- 시범 1편(토끼와 거북이 `village` 상자 4층 + 토끼·거북이)을 먼저 만들어 사용자 확인 → 층마다 따로 생성할지, 한 장 생성 후 층 분리할지 정한다(PLAN §11-9).
- 넣은 뒤: `node tools/art_list.mjs`, `tools/dev/scenes.html?id=rabbit` 로 확인, 인형 크기·자리는 `content/<동화>/stage.json` 의 `w`·`x,y` 만 고친다.
- 그림을 받은 뒤 앱 아이콘·잠금 화면 표지를 빛 상자로 찍는다(PLAN §5-5). `index.html` 의 아이콘 링크, `engine/audio.js` Media Session `artwork` 도 그때 다시 넣는다.

## 2. 커다란 순무 새 1줄 녹음 (24자)
- "고양이도 강아지 꼬리를 꼭 잡았어요. 영차!" — 내레이터, `[lively, encouraging, rhythmic]`.
- ElevenLabs 키(`~/.config/elevenlabs/key`)가 있는 곳에서:
  ```bash
  python3 tools/rec_night.py <동화극장 경로> turnip
  node tools/sync_from_theater.mjs <동화극장 경로>
  node tools/check_stage.mjs
  ```
- 그 전까지는 원래 녹음 두 줄이 대신한다(edit.json `until_recorded`). 녹음 후 `stage.json` R07_cat 의 큐 줄 번호(지금 3 = "그래도 고양이가")를 새 줄 번호(2)로 고친다.

## 3. 실기기 확인
- 아이폰·아이패드: 화면을 끈 채 자동 읽기가 끝까지 가는지, 이어 듣기 다음 편으로 넘어가는지, 잠금 화면 멈춤/다음.
- 함께 읽기: 화면 꺼짐 막기(Wake Lock), 넘김 영역(→ 단추 + 무대 오른쪽 20%)이 아이 손에 눌리지 않는지.
- 오래된 아이패드에서 mask·blend 성능(PLAN §8).

## 4. 남은 기능
- 우리 재생목록(최대 5편, 순서 고르기, 편집 1초 꾹) — PLAN §4 S1, BEDTIME_PLAN §4-3.
- 구매·잠금(무료 2편 + 전체 구매, 부모 확인) — 가격 미정(PLAN §11-2).
- Capacitor 로 iOS·안드로이드 감싸기(동화극장 `tools/app/` 참고), 녹음은 앱 번들에 넣는다.
- 영어 스토어 이름 미정(권장 "Kulkul Shadow Theater").

## 5. 다음 동화
- 같은 기준으로 대본 다듬기(`docs/STORY_EDIT.md` §1) → `content/<id>/edit.json` → sync → stage.json → 그림.
- 후보: 팥죽할멈과 호랑이, 별주부전(영어 녹음 있음). 창작 동화는 첫 출시 제외(권장, 미확정).
