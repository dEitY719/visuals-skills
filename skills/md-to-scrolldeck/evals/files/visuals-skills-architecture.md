# visuals-skills — 세 스킬이 같은 계약을 지키는 방법

> 스킬 저장소 `dEitY719/visuals-skills` 의 구조 요약. 내용은 저장소의 README 와
> CLAUDE.md 에서 옮겼다.

## 1. 한 줄 요약

내용을 보여줄 수 있는 결과물로 바꾸는 스킬 세 개를 `visuals` 플러그인 하나로 묶었다.
자립형 HTML 덱·대시보드, Markdown 보고서에서 만든 세로 스크롤 덱, Excalidraw 구성도
— 셋 다 여섯 개 코딩 에이전트 하네스에 설치된다. [README](https://github.com/dEitY719/visuals-skills/blob/main/README.md) · [CLAUDE.md](https://github.com/dEitY719/visuals-skills/blob/main/CLAUDE.md)

## 2. 경계는 주제가 아니라 결과물이다

어떤 스킬을 쓸지는 주제로 고르지 않는다. 결과물로 고른다.

- `.excalidraw` 파일이 필요하면 `excalidraw-diagram`.
- Markdown 을 넣고 세로 스크롤 덱을 받으려면 `md-to-scrolldeck`.
- 그 밖의 시각 결과물은 전부 `visualize` 가 기본값이다.

각 SKILL.md 는 끝의 "Related Skills" 절에서 이 경계를 다시 말한다. 셋 중 하나를
고치면 나머지 둘도 함께 맞춘다. [CLAUDE.md — What this repo is](https://github.com/dEitY719/visuals-skills/blob/main/CLAUDE.md#what-this-repo-is)

## 3. 세 스킬이 나눠 쓰는 자산

스킬마다 쓰는 공용 자산이 다르다. 검증기는 두 스킬이 각자 사본을 갖고, 렌더 후
자체 점검은 다이어그램 스킬에만 있다.

| 스킬 | 검증기 사본 (lib/vendor) | 고정 HTML 스켈레톤 | PNG 렌더 + 자체 점검 | evals/ | help.md |
|------|:---:|:---:|:---:|:---:|:---:|
| visualize | ● | ● | | | ● |
| md-to-scrolldeck | ● | ● | | ● | ● |
| excalidraw-diagram | | | ● | | ● |

검증기 원본은 저장소 루트의 `lib/verify-html.sh` 하나다. 사본이 원본과 달라지면
`tests/vendor-drift.sh` 가 CI 를 실패시킨다. [vendor-drift.sh](https://github.com/dEitY719/visuals-skills/blob/main/tests/vendor-drift.sh) · [verify-html.sh](https://github.com/dEitY719/visuals-skills/blob/main/lib/verify-html.sh)

## 4. 여섯 하네스 지원 현황

스킬은 Claude Code 의 어휘로 쓰였지만 Claude Code 전용 기능에 거의 기대지 않는다.
파일을 읽고, 결과 파일 하나를 쓰고, 셸 명령 하나를 돌린다.

| 스킬 | Claude Code | Codex | Kimi | Gemini / Antigravity | Hermes | OpenCode |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| visualize | full | full | full | full | full | full |
| md-to-scrolldeck | full | full | full | full | full | full |
| excalidraw-diagram | full | needs image read-back | needs image read-back | needs image read-back | needs image read-back | needs image read-back |

`excalidraw-diagram` 은 Step 3 에서 PNG 를 렌더한 뒤 그 이미지를 다시 읽어 겹친 글자와
어긋난 화살표를 잡는다. 이미지를 읽지 못하는 하네스는 `.excalidraw` 와 PNG 는 만들지만,
시각 점검은 건너뛰었다고 보고해야 한다. [README — Harness support](https://github.com/dEitY719/visuals-skills/blob/main/README.md#harness-support)

## 5. 평평한 레이아웃

모든 하네스 매니페스트는 저장소 루트에 있고, 하나의 평평한 `skills/` 디렉터리를
가리킨다. 중첩된 `plugins/<name>/skills/` 레이아웃은 Claude Code 만 이해한다. 나머지
다섯 하네스는 루트의 매니페스트와 `./skills/` 만 찾으므로, 중첩하면 이 플러그인이 조용히
Claude Code 전용이 된다. 그래서 `plugins/` 디렉터리가 생기면 CI 가 실패한다.

### 5.1 매니페스트 일곱 곳

버전은 일곱 매니페스트에 적혀 있고, CI 가 일치를 검사한다. 버전을 올릴 때는 일곱 곳을
함께 올린다. 버전 관리는 저장소마다 독립이다.

## 6. 결과물 쓰기 계약

모든 스킬은 한 번 실행에 결과 파일을 정확히 하나, `Write` 호출 한 번으로 쓴다. 생성한
HTML 이나 `.excalidraw` JSON 을 채팅에 되풀이하지 않는다 — 요약과 `file://` 경로만
보고한다. 이 계약의 근거 문서는 두 개이고, 다른 references 파일은 그 둘을 가리키기만
한다. [bedrock-safe-write.md](https://github.com/dEitY719/visuals-skills/blob/main/skills/visualize/references/bedrock-safe-write.md) · [font-and-bedrock-safety.md](https://github.com/dEitY719/visuals-skills/blob/main/skills/md-to-scrolldeck/references/font-and-bedrock-safety.md)

## 7. 데이터를 지어내지 않는다

차트, 수치, 타임라인은 사용자의 실제 내용만 쓴다. 결과물에 들어간 자리표시 숫자는
결함이다.

## 8. 다음 단계

새 스킬을 더할 때는 README 에 가이드와 사용 예 링크를 둘 다 둔다. SKILL.md 를 바꾸면
`docs/skill-guides/` 의 가이드를 `/visuals:visualize` 로 다시 렌더하고,
`tests/skill-guides.sh` 로 원본과 가이드가 같은 사실을 담는지 확인한다.

## 참고 자료

- [Claude Code](https://docs.claude.com/en/docs/claude-code)
- [harness-skills references](https://github.com/dEitY719/harness-skills/tree/main/references)
- [skill-check.yml](https://github.com/dEitY719/harness-skills/blob/main/.github/workflows/skill-check.yml)
- [dotfiles](https://github.com/dEitY719/dotfiles)
