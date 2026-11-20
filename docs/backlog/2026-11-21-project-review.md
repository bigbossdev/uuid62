# 프로젝트 개선 검토 (2026-11-21)

`@bboss/uuid62` 1.3.0 기준(`main` @ `f49c4bc`). 각 항목은 확인한 근거, 제안, 호환성 영향을 함께 적었습니다.

우선순위: **P1** 사용자 영향/정확성 · **P2** 품질/유지보수 · **P3** 있으면 좋음
호환성: 🟢 비파괴 · 🟡 동작 변화(minor 검토) · 🔴 breaking(major)

## 요약

| # | 항목 | 우선순위 | 호환성 | 상태 |
|---|---|---|---|---|
| 1 | `decode`가 비정규(non-canonical) 입력을 허용 | P1 | 🔴 | ⬜ |
| 2 | `isValidBase62`가 "디코딩 가능한 UUID62"를 보장하지 않음 | P1 | 🟡 | ⬜ |
| 3 | 배포 소스맵이 포함되지 않은 `src/`를 가리킴 | P1 | 🟢 | ✅ #17 |
| 4 | PR용 CI 없음 / 지원 Node 버전 미검증 | P1 | 🟢 | ✅ #17 |
| 5 | ESM 타입 해석 점검 (`types`가 CJS `.d.ts` 하나만 가리킴) | P2 | 🟢 | ✅ #17 |
| 6 | 테스트 커버리지 공백 & 시간 의존 테스트 | P2 | 🟢 | ✅ #16 |
| 7 | 모듈 로드 시 브라우저 감지 throw | P2 | 🟡 | ⬜ |
| 8 | `engines.node >=16` 재검토 | P2 | 🔴 | ⬜ |
| 9 | 줄바꿈(CRLF/LF) 정책 부재 — `.gitattributes` | P3 | 🟢 | ✅ #18 |
| 10 | 의존성 자동 업데이트(Dependabot/Renovate) | P3 | 🟢 | ✅ #19 |
| 11 | 사소한 코드 정리 | P3 | 🟢 | ✅ #16 |
| 12 | CHANGELOG `Unreleased` 섹션 운영 | P3 | 🟢 | ✅ #18 |

---

## 1. `decode`가 비정규 입력을 허용 — P1 🔴

**근거**
- `decode`는 `isValidBase62`(문자 구성만 검사) 통과 후, 값이 128비트 이하이면 길이와 무관하게 받아들임.
- 같은 UUID에 대해 서로 다른 문자열이 모두 유효:
  `decode('abc') === decode('0abc') === decode('00000000000000000000000000abc')` (29자) → 모두 `…-0000000098de`.
- `encode`는 항상 22자를 내므로 `encode(decode(x)) !== x`인 입력이 존재 → 문자열 비교로 ID를 다루는 사용자(DB 키, 캐시 키)에게 혼란.

**제안**
- `decode`에서 정확히 22자만 허용(`length !== 22` → `Invalid Base62 format`).
- 비파괴 대안: `decode(str, { strict: true })` 옵션을 먼저 도입하고 다음 major에서 기본값 전환.

## 2. `isValidBase62`가 "디코딩 가능"을 보장하지 않음 — P1 🟡

**근거**
- `/^[0-9A-Za-z]+$/`만 검사. `isValidBase62('a')`, `isValidBase62('Z'.repeat(22))`(128비트 초과) 모두 `true`지만, 후자는 `decode`에서 throw.
- README 기준 사용자는 "검증 → 디코드" 패턴을 기대할 가능성이 큼.

**제안**
- 22자 + 최대값(`encode('ffffffff-ffff-ffff-ffff-ffffffffffff')`) 이하 검사를 하는 `isValidUuid62()`(가칭)를 추가하거나, #1과 함께 major에서 `isValidBase62` 의미를 강화.

## 3. 배포 소스맵이 존재하지 않는 `src/`를 가리킴 — P1 🟢 — ✅ #17

**근거**
- `dist/cjs/index.js.map`의 `"sources": ["../../src/index.ts"]`, `sourcesContent` 없음.
- `package.json` `files`에 `src/`가 없어 tarball(21 files)에 `.ts`가 없음 → 사용자 디버거/스택트레이스에서 소스맵이 깨짐(일부 번들러는 경고 출력).
- `.d.ts.map`(declarationMap)도 같은 문제로 "Go to definition"이 동작하지 않음.

**제안** (택1)
- `tsconfig.base.json`에 `"inlineSources": true` 추가, 또는
- `files`에 `src/**/*.ts` 포함(declarationMap도 살아남), 또는
- 소스맵/declarationMap 미배포.

## 4. PR용 CI 없음 / 지원 Node 버전 미검증 — P1 🟢 — ✅ #17

**근거**
- 워크플로는 `publish.yml`(태그 트리거) 하나뿐. PR에서 test/build가 자동으로 돌지 않음.
- `engines.node >=16`을 선언하지만 실제로는 로컬 Node(24)에서만 검증됨.
- `publish.yml`에 명시적 build 단계가 없어 `prepublishOnly`에 의존 — 빌드 실패가 publish 단계에서야 드러남.

**제안**
- `.github/workflows/ci.yml`: `pull_request` + `push: main` 트리거, `yarn install --immutable` → `yarn test` → `yarn build`.
- 런타임 호환 검증: 빌드 산출물(`dist`)을 대상으로 지원 Node 버전 매트릭스에서 스모크 테스트(`scripts/verify-dual-build.js` 재사용). 개발 도구(jest 30, rimraf 6.1)는 Node 18/20+를 요구하므로 테스트 자체를 Node 16에서 돌릴 수는 없음 → 빌드는 최신 LTS, 검증만 매트릭스.
- `publish.yml`에 `yarn build` 단계 명시.

## 5. ESM 타입 해석 점검 — P2 🟢 — ✅ #17

**근거**
- `exports["."].types`가 `import`/`require` 모두 `dist/cjs/index.d.ts`를 가리킴. `dist/esm/*.d.ts`는 배포되지만 사용되지 않음.
- `moduleResolution: node16/nodenext` 환경의 ESM 사용자에게 CJS 타입이 보이는 "Masquerading as CJS" 패턴 가능성. 현재 default export 객체와 named export가 같은 이름이라 실사용 문제는 작을 수 있으나 미검증.
- 검토 중 `@arethetypeswrong/cli` 실행은 로컬 권한 정책으로 수행하지 못함.

**제안**
- 조건별 `types` 분리:
  ```json
  ".": {
    "import": { "types": "./dist/esm/index.d.ts", "default": "./dist/esm/index.js" },
    "require": { "types": "./dist/cjs/index.d.ts", "default": "./dist/cjs/index.js" }
  }
  ```
- `attw --pack .`를 CI(#4)에 추가.

## 6. 테스트 공백 & 시간 의존 테스트 — P2 🟢 — ✅ #16

**근거** (`test/index.test.ts`, 14개 테스트)
- 미검증 경계 사례: 대문자/하이픈 없는 UUID, all-zero / all-`f` UUID, 짧은 입력 `decode`, 128비트 초과 에러 메시지, 빈 문자열, 비문자열 입력(`encode(123 as any)`), default export 객체.
- `performance: should handle 1000 operations quickly` — 실행 시간 기준 테스트는 느린 CI 러너에서 플래키해질 수 있음.
- 커버리지 임계값(`coverageThreshold`) 미설정.

**제안**
- 위 경계 사례 추가, 성능 테스트는 제거하거나 별도 벤치마크 스크립트로 분리.
- `jest.config.js`에 `coverageThreshold` (예: 100% lines/branches — 코드가 작아 현실적).
- (선택) 랜덤 UUID 수천 개 round-trip 속성 테스트.

## 7. 모듈 로드 시 브라우저 감지 throw — P2 🟡

**근거**
- `index.ts`가 import 즉시 `checkNodeEnvironment()` 실행 → `window`/`document`가 있으면 throw.
- 영향: Jest `testEnvironment: 'jsdom'`을 쓰는 사용자 테스트, `window`를 폴리필하는 SSR 환경, Electron renderer 등에서 **import만으로** 크래시.
- `encode`/`decode`는 순수 `BigInt` 연산이라 실제로 Node 의존이 없고, `v4`만 `crypto.randomUUID()`가 필요(`globalThis.crypto.randomUUID`는 최신 브라우저·Node 19+에도 존재).

**제안**
- 단기: 검사를 `v4()` 호출 시점으로 이동하거나 제거.
- 장기: 브라우저 지원을 정식화(`globalThis.crypto.randomUUID` 우선, 없으면 `node:crypto`) — 패키지 포지셔닝("Node.js only") 변경이므로 별도 결정 필요.

## 8. `engines.node >=16` 재검토 — P2 🔴

**근거**
- Node 16/18은 EOL. 현재 지원 범위를 CI에서 보장하지 못함(#4).
- 상향 시 `engines` 변경은 일반적으로 major로 취급.

**제안**
- 다음 major에서 `>=20`(또는 `>=18`)으로 상향, #4의 매트릭스와 일치시키기.

## 9. 줄바꿈 정책 부재 — P3 🟢 — ✅ #18

**근거**
- `.gitattributes` 없음. Windows 작업 시 커밋마다 `LF will be replaced by CRLF` 경고 발생(`yarn.lock`, `.yarn/releases/*.cjs`, tsconfig 등).

**제안**
- `.gitattributes`: `* text=auto eol=lf`, `.yarn/releases/** binary` 등.

## 10. 의존성 자동 업데이트 — P3 🟢 — ✅ #19

**근거**
- 이번 수동 업데이트에서 jest 29→30, TS 5→6 등 큰 폭의 변경이 한꺼번에 발생.
- TypeScript 7은 ts-jest 지원(peer `typescript <7`) 대기 중.

**제안**
- `.github/dependabot.yml`(npm devDependencies, GitHub Actions) 주간 업데이트. `typescript` major는 ignore 규칙으로 고정 후 수동 처리.

## 11. 사소한 코드 정리 — P3 🟢 — ✅ #16

- `decode`의 `index === -1` → `Invalid Base62 character` 분기는 앞선 정규식 검사 때문에 도달 불가능한 코드.
- `decode`의 `BASE62_CHARS.indexOf`(문자당 O(62)) → 룩업 테이블로 교체 가능(성능 영향은 미미).
- `encode`의 `if (hex === 0n)` 특수 처리는 루프 + `padStart`로 이미 처리되므로 불필요.
- `.gitignore`의 `jest.config.js.map` 항목은 현재 구조에서 의미 없음.
- 루트 `tsconfig.json`의 `outDir: ./dist`는 빌드에 쓰이지 않는데 존재해 혼동 여지 → `noEmit: true`로 명시하고 `include`에 `test/` 포함(에디터 타입 체크용).

## 12. CHANGELOG `Unreleased` 섹션 — P3 🟢 — ✅ #18

**근거**
- 1.3.0 이후 변경(문서, devDependencies, TS 6 마이그레이션)이 CHANGELOG에 기록되지 않음. 릴리스 시 한꺼번에 정리해야 함.

**제안**
- `## [Unreleased]` 섹션을 두고 PR마다 갱신.

---

## 진행 현황 (2026-11-21)

- 1단계 비파괴 묶음 완료: #16(테스트·정리), #17(CI·소스맵·타입), #18(`.gitattributes`·CHANGELOG), #19(Dependabot)
- `npm publish` provenance: 이미 trusted publishing(OIDC)으로 자동 생성 중 — 1.3.0에 SLSA provenance 존재, 별도 작업 불필요
- 남은 항목: #2·#7(동작 변화, 결정 필요), #1·#8(2.0.0)

## 제안 진행 순서

1. **비파괴 묶음 (patch/minor)**: #3, #4, #5, #6, #9, #11, #12 → 1.3.x/1.4.0
2. **동작 변화 결정 필요**: #2(`isValidUuid62` 추가), #7(검사 위치 이동) → 1.4.0
3. **major (2.0.0)**: #1 엄격한 `decode`, #8 `engines` 상향, (선택) #7 브라우저 정식 지원
