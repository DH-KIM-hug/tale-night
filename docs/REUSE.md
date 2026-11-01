# 동화극장(paper-tale-theater)에서 가져오는 것

> 원본: `DH-KIM-hug/paper-tale-theater`. 이 레포는 그 레포를 **읽기만** 한다. 대본·녹음을 고칠 일이 생기면 동화극장 쪽에서 고치고 다시 가져온다(원본은 하나).
> 동화극장은 오픈소스가 아니다(`COPYRIGHT.md`). 같은 저작자의 형제 앱이므로 가져와 쓰되, 이 레포도 같은 저작권 문구를 둔다.

## 1. 가져오는 방법

서브모듈은 쓰지 않는다(동화극장은 파일 약 2만 개·`audio/el` 만 397MB). 대신 동기화 도구로 **필요한 것만 복사**한다.

```bash
node tools/sync_from_theater.mjs ../paper-tale-theater rabbit sun_wind ugly_duckling turnip
```

도구가 하는 일
1. `tales/<id>/read_script_el.json` → `content/<id>/script.json` (영어가 있으면 `read_script_en.json` → `script_en.json`)
2. `tales/<id>/read_narration_el.js` 를 읽어 `"줄 글": "audio/el/<id>/<배역>_<해시>.mp3"` 맵을 만들고, 경로를 `audio/<id>/<배역>_<해시>.mp3` 로 바꿔 `content/<id>/clips.js` 로 쓴다. 값이 배열(이어 붙이기)인 줄도 그대로 둔다.
3. 맵이 가리키는 mp3 만 `audio/<id>/` 로 복사한다(놀이판 전용 클립은 안 가져옴).
4. `home_narration_el.js` 에서 그 동화 제목 클립 하나를 `audio/titles/<id>.mp3` 로.
5. `tales/catalog.js` 에서 `id · title · origin · readMin · readEn` 만 뽑아 `content/catalog.json` 에 합친다.
6. 검사: 대본의 모든 줄에 클립이 있는지(없으면 목록 출력 후 실패 — 이 앱은 기계 음성으로 읽지 않는다), 파일 크기 합, 원본 레포의 커밋 해시를 `content/<id>/SOURCE` 에 적는다.

실측(2026-11-01, 원본 HEAD 기준): 토끼와 거북이 90개 5.6MB, 해와 바람 69개 4.0MB, 미운 아기 오리 92개 5.9MB, 커다란 순무 68개 4.0MB. 빠진 파일 0.

## 2. 대본에서 쓰는 필드와 버리는 필드

`read_script_el.json` 형식은 동화극장 `docs/READ_MODE.md` §3.

| 필드 | 쓰나 | 이 앱에서 |
|---|---|---|
| `title`, `moral` | 씀 | 제목 표시·Media Session. `moral` 은 화면·소리에 내지 않는다(동화극장과 같음) |
| `scenes[].key` | 씀 | `stage.json` 의 장면 열쇠 |
| `scenes[].card` | 씀 | 장면 카드 글자 |
| `scenes[].lines[].text` | 씀 | 클립 찾기 열쇠·자막 |
| `scenes[].lines[].simultaneous` | 씀 | 합창(여러 클립 동시) |
| `scenes[].set`, `enter`, `lines[].before/after` | **버림** | 동화극장 동화 js 의 동사라 여기서는 뜻이 없다. 같은 역할을 `stage.json` 이 맡는다 |
| `segs` | 배역만 씀 | 함께 읽기 '인물 대사는 녹음으로'에서 배역이 `nar` 가 아닌 줄을 고를 때 |
| `src`, `from`, `voices_from`, `notes`, `acts` | 버림 | 녹음 만들 때만 쓰는 정보 |

## 3. 재생 엔진 (`audio.js` 에서 가져올 것)

동화극장 `audio.js`(713줄) 중 잠자리 듣기에 필요한 부분만 `engine/audio.js` 로 옮긴다.

| 가져옴 | 이유 |
|---|---|
| `Narrator.speak(text, { recordedOnly: true, simultaneous })` | 줄 재생. 녹음 없으면 건너뜀 |
| `mediaNarration(on)` | 첫 누름에서 내레이션 `<audio>` 와 합창용 요소에 iOS 재생 허락 받기 |
| `unlock()` + keepAlive(무음 반복 `<audio>`), `navigator.audioSession.type = 'playback'` | 화면이 꺼져도 끊기지 않게 |
| `narHold(on)` | 멈춤/다시 |
| Media Session 처리 | 잠금 화면 제목·표지·멈춤/재생 + **다음(nexttrack)** 추가 |

| 빼는 것 | 이유 |
|---|---|
| Web Audio 효과음·음악·`holdMelody` | 잠금 중 나오지 않고(동화극장 READ_MODE §10-4), 잠자리에는 조용한 쪽이 맞다 |
| 브라우저 TTS 대체 | `recordedOnly` 만 쓴다 |

줄 재생 루프는 동화극장 `engine/tale.js` 의 `readPlay` 규칙을 그대로 옮긴다: 줄 사이 700ms, 장면 끝 1500ms, 화면이 가려지면(`document.hidden`) 쉼 없이 `ended` 로 바로 잇기, 시간 제한 = 녹음 길이 + 3초(길이를 모르면 8초 + 글자당 0.25초).

## 4. 이어 듣기 규칙 (자동 읽어 주기만, `docs/BEDTIME_PLAN.md` 그대로)

- 한 페이지 플레이어에서 오디오 한 흐름으로 이어 재생(페이지 이동 없음).
- 랜덤 후보: 잠기지 않은 동화, 같은 회차 중복 없음, 최근 들은 8편은 뒤로.
- 편 수 1·2·3·5(기본 2). '○분 뒤 끄기'는 없음.
- 동화 사이: 3초 쉼 → 다음 제목 녹음 → 1초 → 첫 줄. 넘김 효과음 없음.
- 마지막 편 뒤 3초 쉼 → 오디오 세션 끄기(내레이션 `src` 비움, keepAlive 멈춤, Media Session `none`).
- 저장: `localStorage` 키 `paperShadow.bedtime = { count, playlist }`, 함께 읽기 이어 읽기 위치는 `paperShadow.together = { id, scene }`.

이 앱에서 더하는 것은 하나뿐이다: 동화가 바뀔 때 **빛 상자가 꺼졌다가 새 상자로 다시 켜지는 연출**(화면이 켜져 있을 때만; 꺼져 있으면 소리만 이어짐).

## 5. 새 녹음이 필요할 때

원칙은 "없음"이다. 그래도 필요해지면(예: PLAN §11-8 '잘 자' 한 줄, 대본의 오탈자):
1. 동화극장 레포에서 `read_script_el.json` 을 고치거나 홈 문구를 더한다.
2. 동화극장 레포에서 `python3 tools/elevenlabs/gen_tale.py <id> --read`(또는 `gen_home.py`)로 만든다. API 키는 `~/.config/elevenlabs/key`(어느 레포에도 두지 않음). 배역 목소리는 그 동화 `voice_script_el.json` 의 `voices` 그대로라 목소리가 섞이지 않는다.
3. 이 레포에서 `sync_from_theater.mjs` 를 다시 돌린다.
