# 듀얼 ESM/CJS 빌드 지원 — 설계 문서

- **날짜**: 2026-08-01
- **상태**: 승인됨

## 배경

`@bboss/uuid62`는 현재 `tsc` 단일 컴파일로 CommonJS(`dist/index.js`)만 출력한다. ESM 전용 프로젝트(Vite, 최신 번들러 등)에서 이 패키지를 import할 때 상호운용성 마찰이 생긴다. 런타임 동작 변경 없이, 패키징만 확장해 `require()`와 `import` 양쪽을 모두 네이티브로 지원한다.

## 목표

- 기존 CommonJS 소비자(`require('@bboss/uuid62')`)를 깨지 않고 ESM 소비자(`import ... from '@bboss/uuid62'`)를 네이티브로 지원
- 빌드 산출물이 실제로 두 형식 모두에서 정상 동작함을 자동으로 검증
- 소스(`src/`)와 알고리즘 로직은 변경하지 않음 (순수 패키징/빌드 구성 변경)

## 비목표 (범위 밖)

- Node.js 전용 제한(`checkNodeEnvironment()`) 제거 — 별도 아이디어, 이번 작업에 포함 안 함
- 브라우저 지원
- 버전 bump, CHANGELOG 릴리스 태그, npm 배포 — 구현 완료 후 사용자가 별도 요청 시 진행

## 아키텍처

`src/`는 단일 소스로 유지하고, `tsc`를 두 개의 tsconfig로 두 번 실행해 `dist/cjs/`와 `dist/esm/`에 각각 출력하는 구조로 전환한다.

```
dist/
├── cjs/
│   ├── index.js        (CommonJS, require)
│   ├── utils.js
│   ├── index.d.ts
│   └── package.json    { "type": "commonjs" }
└── esm/
    ├── index.js         (ESM, import)
    ├── utils.js
    ├── index.d.ts
    └── package.json    { "type": "module" }
```

서브폴더 분리 + 폴더별 `package.json`의 `"type"` 필드로 Node.js가 각 산출물을 올바른 모듈 형식으로 해석하도록 한다(듀얼 패키지 해저드 회피).

## 빌드 설정

- `tsconfig.base.json` — 공통 컴파일 옵션(strict, target ES2020, lib ES2020, declaration, declarationMap, sourceMap, skipLibCheck, esModuleInterop, forceConsistentCasingInFileNames, resolveJsonModule, allowSyntheticDefaultImports, rootDir `./src`)을 모아둔다.
- `tsconfig.cjs.json` — `tsconfig.base.json`을 extends, `module: "CommonJS"`, `outDir: "./dist/cjs"`
- `tsconfig.esm.json` — `tsconfig.base.json`을 extends, `module: "ES2020"`(또는 동등한 ES 모듈 타깃), `outDir: "./dist/esm"`
- 기존 최상위 `tsconfig.json`은 두 설정이 공유하는 base 역할로 재구성하거나, IDE/타입체크용으로 유지하면서 실제 빌드는 위 두 파일을 사용하도록 분리한다.

### 상대 import의 확장자 문제

Node.js ESM 로더는 상대 경로 import에 명시적 확장자를 요구한다. 현재 `src/index.ts`는 `from './utils'`처럼 확장자 없이 import한다. 이를 `from './utils.js'`로 변경한다 — TypeScript는 이를 `utils.ts`로 타입 매칭하고, 컴파일 시 두 빌드(cjs/esm) 모두에서 import 경로가 그대로 보존되어 실제 컴파일 산출물 파일명(`utils.js`)과 일치하게 된다. 이 변경이 `tsconfig.cjs.json`의 타입체크를 깨지 않도록 `moduleResolution` 값을 조정해야 할 수 있으며, 정확한 조합은 구현 단계에서 `tsc --noEmit`으로 검증한다.

### 빌드 스크립트

`package.json`의 `build` 스크립트를 다음 순서로 확장한다:

1. `rimraf dist`
2. `tsc -p tsconfig.cjs.json`
3. `tsc -p tsconfig.esm.json`
4. 산출물 폴더별 `package.json` 마커 파일 생성/복사 (`dist/cjs/package.json`, `dist/esm/package.json`) — 정적 파일을 리포에 두고 빌드 시 복사하거나, 짧은 Node 스크립트로 직접 write
5. 듀얼 빌드 스모크 테스트 실행 (아래)

## package.json 변경

```json
{
  "main": "dist/cjs/index.js",
  "types": "dist/cjs/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/cjs/index.d.ts",
      "require": "./dist/cjs/index.js",
      "import": "./dist/esm/index.js"
    }
  },
  "files": [
    "dist/**/*",
    "README.md",
    "LICENSE"
  ]
}
```

- `main`/`types`는 레거시(`exports` 미지원) 도구를 위해 그대로 CJS 산출물을 가리키도록 유지한다.
- `exports` 조건부 맵이 최신 도구에서는 `require`/`import`를 각각 올바른 산출물로 라우팅한다.
- `files`는 기존 `dist/**/*` 패턴이 `dist/cjs`, `dist/esm` 모두를 자동으로 포함하므로 변경 불필요.

## 검증: 듀얼 빌드 스모크 테스트

`scripts/verify-dual-build.js`(빌드 후 실행되는 순수 Node 스크립트, Jest 스위트와 별개)를 추가한다:

- `require('../dist/cjs')`로 CJS 산출물을 로드
- `await import('../dist/esm/index.js')`로 ESM 산출물을 로드
- 양쪽에서 동일 UUID에 대해 `encode`/`decode`가 같은 결과를 내는지, `v4()`/`generateBase62()`가 예외 없이 22자 Base62 문자열을 반환하는지 assert
- 실패 시 non-zero exit code로 `yarn build`를 실패시켜, 잘못된 패키징이 배포(태그 푸시 → publish workflow) 전에 걸러지도록 한다

## 테스트

기존 `test/index.test.ts`(Jest + ts-jest)는 `src/index.ts`를 직접 import하므로 이번 변경의 영향을 받지 않으며 수정 불필요. 새 스모크 테스트는 빌드 산출물(`dist/`)만을 대상으로 하는 별도 계층이다.

## 문서 업데이트

- **CLAUDE.md** — Commands 섹션의 `yarn build` 설명과 Architecture 섹션의 빌드 출력 설명을 듀얼 빌드 구조에 맞게 갱신
- **README.md** — 사용 예시에 ESM `import` 방식 예시 추가 (기존 CJS `require`/legacy 예시와 병기)
- **CHANGELOG.md** — 새 버전 항목에 듀얼 ESM/CJS 빌드 지원 추가 기록 (버전 번호 자체는 이번 구현 완료 후 릴리스 시점에 결정)

## 에러 처리 / 실패 모드

- 두 `tsc` 컴파일 중 하나라도 실패하면 `build` 스크립트는 그 지점에서 즉시 실패한다(스크립트 체이닝은 `&&` 사용).
- 스모크 테스트 실패는 빌드 실패로 처리되어 CI(`yarn test`가 아닌 `yarn build` 단계, 또는 publish workflow의 사전 단계)에서 감지된다.
- 런타임 동작(인코딩/디코딩 알고리즘, 에러 메시지)은 이번 변경으로 전혀 바뀌지 않는다 — 순수 패키징 변경이므로 기존 Jest 테스트의 모든 기대값은 그대로 유효하다.
