# @bboss/uuid62 프로젝트 요구사항

## 개요
UUID(Universally Unique Identifier)를 Base62로 인코딩/디코딩하는 TypeScript 라이브러리

## 프로젝트 정보
- **패키지명**: `@bboss/uuid62`
- **라이선스**: MIT
- **언어**: TypeScript
- **의존성**: Zero dependency
- **플랫폼**: Node.js 전용 (브라우저 미지원)
- **Node.js 지원**: Node.js 16.0.0+ (crypto.randomUUID() 안정 지원)

## 핵심 기능

### 1. UUID to Base62 변환
- 표준 UUID (36자리, 하이픈 포함)를 Base62 문자열로 변환
- 예: `f47ac10b-58cc-4372-a567-0e02b2c3d479` → `5wbwf6yUxVBcr48AMbz9cb`

### 2. Base62 to UUID 변환  
- Base62 문자열을 표준 UUID 형식으로 복원
- 예: `5wbwf6yUxVBcr48AMbz9cb` → `f47ac10b-58cc-4372-a567-0e02b2c3d479`

### 3. Base62 문자셋
- 사용 문자: `0-9`, `a-z`, `A-Z` (총 62개 문자)
- 순서: `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`

## 기술 요구사항

### API 설계
```typescript
// 기본 함수
v4(): string                     // crypto.randomUUID() + Base62 변환
encode(uuid: string): string     // UUID → Base62
decode(base62: string): string   // Base62 → UUID

// 유틸리티 함수
isValidUuid(str: string): boolean    // UUID 형식 검증
isValidBase62(str: string): boolean  // Base62 형식 검증
```

### 사용 예시
```javascript
const uuid62 = require('@bboss/uuid62');

// Base62 UUID 생성
const uuid = uuid62.v4();
// → 3D4bh7HM9Y8EpjkcC9H1uT

// Base62를 표준 UUID로 디코딩
const originalUUID = uuid62.decode(uuid);
// → a1b2c3d4-e5f6-7890-abcd-ef1234567890

// 기존 UUID를 Base62로 인코딩
const encoded = uuid62.encode('f47ac10b-58cc-4372-a567-0e02b2c3d479');
// → 5wbwf6yUxVBcr48AMbz9cb

// UUID 형식 검증
const isValidUuid1 = uuid62.isValidUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479');
// → true
const isValidUuid2 = uuid62.isValidUuid('invalid-uuid');
// → false

// Base62 형식 검증
const isValidBase62_1 = uuid62.isValidBase62('5wbwf6yUxVBcr48AMbz9cb');
// → true
const isValidBase62_2 = uuid62.isValidBase62('invalid@base62!');
// → false
```

### 입력 검증
- UUID: RFC 4122 표준 형식 (하이픈 포함/제외 모두 지원)
- Base62: 유효한 문자셋만 허용
- 잘못된 입력 시 명확한 에러 메시지

### 플랫폼 요구사항
- **Node.js 전용**: 브라우저 환경에서 실행 불가
- **crypto 모듈 의존**: Node.js 내장 crypto.randomUUID() 필수
- **환경 검증**: 브라우저 환경 감지 시 에러 발생

### 성능 요구사항
- **변환 속도**: 10,000회/초 이상 (현재 테스트: 1000회/70ms)
- **메모리 사용량**: 최소화
- **Zero dependency**: 외부 라이브러리 의존성 없음
- **Node.js 내장 API**: crypto.randomUUID() 활용

### 개발 도구
- **테스트**: Jest + ts-jest
- **빌드**: TypeScript 컴파일러
- **커버리지**: Jest 내장 커버리지 도구
- **타입 체크**: TypeScript strict 모드

## 프로젝트 구조
```
@bboss/uuid62/
├── src/
│   ├── index.ts      # 메인 모듈 (v4, encode, decode 등)
│   └── utils.ts      # 유틸리티 함수 (검증 등)
├── test/
│   └── index.test.ts # Jest 테스트 파일
├── dist/             # 컴파일된 JavaScript
│   ├── index.js      # 컴파일된 메인 모듈
│   ├── index.d.ts    # TypeScript 타입 정의
│   ├── utils.js      # 컴파일된 유틸리티
│   └── utils.d.ts    # 유틸리티 타입 정의
├── coverage/         # Jest 커버리지 리포트
├── package.json
├── tsconfig.json
├── jest.config.js    # Jest 설정
├── .gitignore
├── LICENSE           # MIT 라이선스
├── README.md
└── SPEC.md
```

### 빌드 및 배포 구조
- **소스 코드**: `src/` 폴더의 TypeScript 파일
- **빌드 결과**: `dist/` 폴더의 JavaScript + 타입 정의 파일
- **메인 진입점**: `dist/index.js` (CommonJS)
- **타입 정의**: `dist/index.d.ts` (TypeScript 지원)
- **테스트**: Jest를 통한 TypeScript 직접 실행

## 테스트 요구사항
- **테스트 프레임워크**: Jest + ts-jest
- **테스트 파일**: `test/index.test.ts` (단일 파일)
- **커버리지 목표**: 95% 이상 (현재 90.9% 달성)
- **테스트 유형**:
  - 단위 테스트 (각 함수별)
  - 엣지 케이스 테스트 (빈 문자열, 잘못된 입력 등)
  - 성능 테스트 (1000회 연산)
  - 양방향 변환 일관성 테스트
- **실행 방식**: TypeScript 파일 직접 실행 (컴파일 불필요)

## 빌드 및 배포 요구사항

### 빌드 시스템
- **TypeScript 컴파일**: `tsc` 명령어로 단일 빌드
- **출력 형식**: CommonJS (ES Module 지원 제외)
- **타입 정의**: 자동 생성 (.d.ts 파일)
- **소스맵**: 디버깅용 .js.map 파일 포함

### NPM 배포
- **패키지명**: `@bboss/uuid62`
- **라이선스**: MIT
- **메인 파일**: `dist/index.js`
- **타입 파일**: `dist/index.d.ts`
- **Node.js 지원**: 16.0.0+ (crypto.randomUUID() 안정 지원)
- **사용 방식**: `require('@bboss/uuid62')` 또는 `import` 모두 가능

### 환경 제한
- **Node.js 전용**: 브라우저 환경에서 실행 불가
- **환경 검증**: 런타임에서 브라우저 환경 감지 및 에러 처리
- **Zero Dependency**: 외부 라이브러리 의존성 없음