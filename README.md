# Crew Calendar Preview

Kiro Crew 안에서 실행하는 화면 전용 캘린더 앱입니다. 현재는 샘플 데이터만 사용하며 실제 일정·예약 변경이나 에이전트 실행은 하지 않습니다.

## 시작하기

Node.js 22.18 이상과 실행 중인 Kiro Crew가 필요합니다.

```sh
npm --prefix ui ci --ignore-scripts
npm test
npm run package
```

`npm run package`는 타입 검사·빌드 후 설치용 파일을 `.build/crew-calendar/`에 모읍니다.

처음 설치할 때:

```sh
kirocrew app install "$PWD/.build/crew-calendar"
kirocrew app enable crew-calendar
```

Kiro 사이드바의 **Calendar Preview**에서 엽니다. 앱 경로는 `/apps/crew-calendar`입니다. 이미 설치된 앱에는 Kiro의 업데이트 기능을 사용하고 소스로 `.build/crew-calendar/`를 지정합니다. `app install`은 기존 앱을 덮어쓰지 않습니다.

프로젝트 루트에서 직접 설치하지 않습니다. Kiro 설치기는 Git 제외 규칙을 읽지 않으므로 반드시 실행 파일만 모은 패키지를 사용합니다.

## 구조

```text
app.json                    Kiro 앱 메타데이터·권한
scripts/package.mjs         실행 파일만 담는 패키징
ui/assets/                  실제 앱 아이콘
ui/src/App.tsx              Kiro 진입점·프리뷰 조립
ui/src/calendar/            달력 화면·표시용 타입·시간/배치 계산
ui/src/preview/             샘플 데이터·상태 전환
ui/src/platform/kiro/       호스트 아이콘 호환·SDK 타입
```

`calendar/`는 샘플 목록을 직접 불러오지 않습니다. 화면은 항목과 기준 시각을 전달받고, 시간 계산에도 기준 시각을 명시적으로 전달합니다. 현재 타입은 한 주 안에서 사용하는 표시 모델이며, 실제 공급자 API의 계약은 아닙니다.

Kiro가 React와 SDK를 제공하므로 별도 `main.tsx`나 웹 서버 없이 기본 React export를 ESM으로 빌드합니다. CSS는 `?inline`으로 번들에 포함하고 `.cc-calendar` 범위 안에서만 적용됩니다.

## 명령

- `npm run build`: TypeScript 검사와 UI 빌드
- `npm test`: 날짜·배치 계산 및 패키징 경계 검증
- `npm run package`: 빌드 후 설치용 패키지 생성
- `kirocrew app disable crew-calendar`: 로컬 앱 비활성화

패키지에는 `app.json`, `ui/dist/`, `ui/assets/`만 포함됩니다. 샘플 데이터는 화면 실행에 필요하므로 JS 번들에 포함됩니다. 개발 문서, 소스 원문, 스크린샷, 의존성 폴더는 패키지에 포함하지 않습니다.

## 프리뷰 범위

주간/목록 전환, 날짜 이동, 레이어 필터, 항목 상세, 샘플 결과물과 빈/부분 오류 상태를 제공합니다. 실제 연결이 필요한 버튼은 비활성화되어 있습니다. 샘플 주는 2026년 9월 28일–10월 4일이며 기준 시각은 수요일 11:40 KST로 고정되어 있습니다. 실제 현재 시각이나 시간대 연동으로 간주하지 않습니다.

선택한 Calendar Spark 아이콘은 `ui/assets/calendar-spark.svg`에 있습니다. 공개 레지스트리 배포나 실제 데이터 연결은 아직 하지 않았습니다.

## 통합 화면

상단의 캘린더 / 연결된 작업 / 자동 예약 탭으로 이동합니다. 캘린더 항목 상세에서 연결된 작업을 열 수 있으며, 작업 화면은 대화 입력과 결과물 미리보기를 제공합니다. 입력한 메시지는 실제 Crew에 보내지 않습니다.

자동 예약 ON/OFF, 개별 시간 변경·취소·다시 예약, 예정된 자동 예약 일시정지는 메모리 내 샘플 상태만 변경합니다. OFF는 신규 자동 생성 설정만 끄고 기존 예약은 남겨둡니다. 재로딩하면 기본 샘플로 돌아가며, 외부 API나 저장소를 사용하지 않습니다.
