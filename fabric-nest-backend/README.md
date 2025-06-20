# Fabric-NestJS Backend

Hyperledger Fabric과 NestJS를 사용한 학생회 블록체인 애플리케이션 백엔드입니다.

## 기능

- 학생회 조직 관리
- 블록체인 기반 장부 관리 (입출금 등록, 투표)
- Redis를 활용한 Spring 백엔드와의 통합
- 자동화된 출금 요청 만료 처리

## 설치 방법

### 사전 요구사항

- Node.js (v14 이상)
- pnpm
- Redis
- Hyperledger Fabric 네트워크

### 프로젝트 구조
src/
├── app.module.ts        # 루트 모듈
├── main.ts              # 애플리케이션 진입점
├── organization/        # 조직 관리 모듈
├── ledger/              # 장부 관리 모듈
├── redis/               # Redis 통합 모듈
├── fabric/              # Fabric 통합 모듈
└── firebase/            # Firebase 통합 모듈
