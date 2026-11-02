# 빛 상자 무대 형식 (`content/<id>/stage.json`)

> 대본(`script.json`, 동화극장 사본)은 **무엇을 읽을지**, `stage.json` 은 **그동안 상자에 무엇이 보일지**를 적는다.
> 대본은 고치지 않는다. 장면 열쇠(`scenes[].key`)와 줄 순서로만 이어 붙인다.

## 1. 뼈대

```json
{
  "tale": "rabbit",
  "boxes": {
    "<상자 키>": {
      "layers": { "far": "art/rabbit/village_far.webp", "mid": "…", "near": "…", "frame": "…" },
      "dk":     { "far": 0.08, "mid": 0.42, "near": 0.70, "frame": 0.86 },
      "glowAt": [58, 22],
      "fx": "fireflies"
    }
  },
  "dolls": {
    "<인형 키>": { "poses": { "<자세>": "art/rabbit/rabbit_stand.webp" }, "w": 17, "lantern": false }
  },
  "scenes": {
    "<대본 장면 key>": {
      "box": "<상자 키>",
      "light": "<프리셋 키>",
      "power": 1.0,
      "place": { "<인형 키>": "<자세>@x,y" },
      "cues": [ { "line": 2, "match": "거북이가 엉금", "do": ["turtle:walk:34,9>50,13"] } ]
    }
  },
  "end": { "fadeOut": 8000 }
}
```

### 필드
- `boxes.*.layers`: 흰 종이 층 그림. 뒤에서 앞으로 `far · far2 · mid · ground · near · frame` 중 필요한 것만(`far2`·`ground` 는 6층 시범, `village` 만 사용 중: `far2` = 가까운 산, `mid` = 집·나무만, `ground` = 인형이 서는 낮은 언덕). 크기는 모두 4:3(2048×1536), 알파 포함, 색 없음.
- `boxes.*.dk`: 불 켜졌을 때 층 어둡기(0=빛 그대로, 1=검정). 없으면 기본값(PLAN.md §5-2 표). 상자마다 조정 가능.
- `boxes.*.glowAt`: 광원(달·해·등불) 중심, 무대 % 좌표. 꺼졌을 때 그 자리에 흰 달 원판이 보인다(시안 `.moon-off`).
- `boxes.*.fx`: `fireflies`(기본) · `snow` · `bubbles` · `stars` · `none`.
- `dolls.*.w`: 무대 폭 대비 % 크기. 자세가 달라도 같은 값(동화극장 §4-1 크기 일관성).
- `dolls.*.poses`: 자세 하나에 그림 하나, 걷기·오르기는 **프레임 그림 배열**(`["…_walk.webp", "…_walk2.webp", …]`, 2026-11-02 사용자 결정). 걷는 동안 `frameMs`(기본 320ms)마다 차례로 바뀌고, 멈추면 첫 장으로 돌아온다.
- `dolls.*.lantern`: 인형 곁에 등불 빛(시안의 고슴도치 등불).
- `scenes.*.light`: 빛 프리셋 키(PLAN.md §5-3). 
- `scenes.*.power`: 빛 세기 0.4~1.0. 무서운 순간은 0.7 이하.
- `scenes.*.place`: 장면이 열릴 때(빛이 바뀌는 동안) 인형을 놓는다. `자세@x,y` 의 x,y 는 발 위치(왼쪽 %, 아래에서 %).
- `scenes.*.cues`: 그 줄이 시작될 때 실행할 동사 — 자동 읽어 주기는 녹음 **직전**, 부모와 함께 읽기는 보호자가 그 줄로 **넘기는 순간**. 같은 `stage.json` 으로 두 모드가 돈다. `line` 은 그 장면 안 줄 번호(0부터), `match` 는 그 줄 글의 앞부분(대본이 바뀌면 `check_stage` 가 잡도록).
- `end.fadeOut`: 마지막 줄 뒤 빛이 꺼지는 시간(ms).

### 동사
| 꼴 | 뜻 |
|---|---|
| `<인형>:in:left\|right` | 옆에서 걸어 들어와 `place` 자리에 섬 |
| `<인형>:walk:x,y>x,y[:초]` | 걷기(기본 14초, 0.7초 통통) |
| `<인형>:pose:<자세>` | 자세 교차 0.6초 |
| `<인형>:out:left\|right` | 걸어 나감 |
| `<인형>:lantern:on\|off` | 곁 등불 |
| `light:<프리셋>[:세기]` | 장면 중간 빛 바꾸기(2.4초) |
| `fx:<종류>` | 효과 바꾸기 |

시간이 걸리는 동사는 기다리지 않는다(소리가 먼저다). 다음 줄의 큐가 오면 진행 중이던 걷기는 목표 자리로 0.6초에 마무리된다. 화면이 꺼져 있으면 동사는 상태만 바꾸고 그리지 않는다.

함께 읽기에서 앞 줄로 돌아가면 동사를 거꾸로 실행하지 않고, 엔진이 줄마다 쌓아 둔 무대 스냅숏(빛·세기·인형 자리·자세·등불)으로 0.6초에 옮긴다. 그래서 동사는 '되돌리기'를 따로 적지 않는다.

## 2. 예: 토끼와 거북이 (`rabbit`, 잠자리 다듬기 후 9장면 53줄)

대본은 [`STORY_EDIT.md`](STORY_EDIT.md) §2대로 다듬은 것이다(응원석 장면 뺌, 나무 그늘 + 토끼의 꿈 합침). `cues` 의 `line` 은 **다듬은 대본** 기준 번호다.

### 상자 4벌
| 상자 | far | mid | near | frame | 쓰는 장면 |
|---|---|---|---|---|---|
| `village` 숲속 마을 | 먼 산 둘 | 버섯 지붕 집 셋 · 출발선 | 풀숲 · 꽃 | 나무 터널 | R01, R02, R04 |
| `hill` 언덕길 | 먼 산 | 굽은 언덕길 | 갈대 | 가지 틀 | R05, R08 |
| `shade` 나무 그늘 | 먼 언덕 | 큰 나무 한 그루(잎에 오린 구멍) | 풀 | 잎 틀 | R06(+꿈), R09 |
| `finish` 결승선 | 먼 산 | 결승 깃발 줄 | 구경하는 친구들 실루엣 한 장(오리·소·돼지·강아지·양) | 나무 터널 | R10, R11 |

### 인형
| 인형 | 자세 | 비고 |
|---|---|---|
| `rabbit` | stand · run · sleep | 귀 안쪽을 오려 빛이 샘 |
| `turtle` | walk · stand | 등딱지 무늬를 오린 구멍 |
| `owl` | perch | 자장가 부엉이(우체부 장면은 뺐으므로 나는 자세 없음) |

### 장면별 빛
| 장면 | card | 상자 | 빛 | 세기 | 인형·큐 |
|---|---|---|---|---|---|
| R01_morning | 숲속 아침 | village | dawn | 1.0 | 거북이 in(줄 2), 토끼 in(줄 4) |
| R02_challenge | 달리기 약속 | village | dusk | 1.0 | 둘이 마주 섬 |
| R04_start | 요이~ 땅! | village | dusk | 1.0 | 줄 3 "토끼는 쌩~" 에서 토끼 run out:right, 거북이 walk |
| R05_dash | 쌩쌩 토끼 | hill | dusk | 1.0 | 토끼 run 왼→오른 |
| R06_shade | 나무 그늘 | shade | dusk → moon(줄 3) → **dream**(줄 5) → moon(줄 6) | 0.8 | 토끼 sleep, 부엉이 perch |
| R08_turtle | 엉금엉금 거북이 | hill | dusk | 1.0 | 거북이 walk, 줄 3 언덕에서 walk 위로 |
| R09_tiptoe | 쉿, 살금살금 | shade | night_forest | 0.9 | 거북이 walk 지나감, 줄 3 "해가 뉘엿뉘엿" light:night_forest:0.8 |
| R10_finish | 마지막 한 발 | finish | night_forest | 1.0 | 거북이 walk 결승선, 토끼 run |
| R11_party | 숲속 잔치 | finish | hearth | 1.0 | 둘 다 stand, 거북이 lantern:on → 끝에 빛 8초 꺼짐 |

### stage.json 일부

(형식 설명용. 실제 값은 `content/rabbit/stage.json` — 인형 크기·높이는 화면에서 보고 맞춘 값이 들어 있다.)

```json
{
  "tale": "rabbit",
  "boxes": {
    "shade": {
      "layers": { "far": "art/rabbit/shade_far.webp", "mid": "art/rabbit/shade_mid.webp",
                  "near": "art/rabbit/shade_near.webp", "frame": "art/rabbit/shade_frame.webp" },
      "glowAt": [70, 18], "fx": "fireflies"
    }
  },
  "dolls": {
    "rabbit": { "poses": { "stand": "art/rabbit/rabbit_stand.webp", "run": "art/rabbit/rabbit_run.webp",
                           "sleep": "art/rabbit/rabbit_sleep.webp" }, "w": 15 },
    "owl":    { "poses": { "perch": "art/rabbit/owl_perch.webp" }, "w": 8 }
  },
  "scenes": {
    "R06_shade": {
      "box": "shade", "light": "dusk", "power": 0.8,
      "place": { "rabbit": "sleep@42,10", "owl": "perch@64,58" },
      "cues": [
        { "line": 3, "match": "구름도 뭉게뭉게",      "do": ["light:moon:0.8"] },
        { "line": 5, "match": "토끼가 꿈을 꿔요",      "do": ["light:dream"] },
        { "line": 6, "match": "하지만 진짜 토끼는",    "do": ["light:moon:0.8"] }
      ]
    }
  },
  "end": { "fadeOut": 8000 }
}
```

## 3. 그림 요구 (작업자·프롬프트용)

앱의 **모든 그림**이 이 규칙을 따른다(동화 상자·인형뿐 아니라 표지 제목 글자, 스플래시 극장 틀과 앱 이름 글자). 홈 타일·아이콘·잠금 화면 표지는 이 그림들로 앱이 만들거나 찍는다(PLAN §5-5).

- **흰 종이만.** 모든 층·인형은 흰(또는 아주 옅은 크림) 종이 한 색. 색·그라데이션·광택 없음. 빛 색은 앱이 입힌다.
- 동화극장 `DESIGN_SYSTEM.md` 재료 원칙 유지: 가위로 오릴 수 있는 형태, 깨끗한 절단면, 종이 섬유결, 경계에만 얕은 웜 그림자(`#2E241C`). 외곽 그림자는 넣지 않는다(앱이 `drop-shadow` 를 붙인다).
- 빛이 새는 곳은 **투명 구멍**으로 오린다(창문, 잎 사이, 인형의 눈·귀 안쪽·등딱지 무늬). 구멍이 많을수록 불이 켜졌을 때 예쁘다.
- 층은 4:3 한 판 안에서 아래쪽을 꽉 채운다(앞 층일수록 위로 덜 올라온다). frame 은 가운데를 크게 비운 틀.
- 인형은 정사각 캔버스, 발이 아래 가운데. 같은 인형은 자세가 달라도 같은 부위 폭을 맞춘다.
- 인물·누르는 대상이 없는 대신, **인형 주변은 앞 층이 가리지 않게** 비운다(동화극장 §7-5-1 "앞 실루엣 층이 인물을 가리지 않게").
- 상자 한 벌 = 4장, 인형 한 자세 = 1장, 제목 오린 글자 1장. 토끼와 거북이 기준 상자 4벌(16장) + 인형 6장 + 제목 1장 = 23장.
- 제목 글자: 흰 종이 띠에 글자를 **구멍으로 오린** 것(글자 모양으로 빛이 샌다). 표지에서 frame 위에 얹는다.
