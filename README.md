# Penta Security Design Asset Management System

## 1. 프로젝트 개요

### 목표
펜타시큐리티의 디자인 작업물을 리뷰하고, 필요한 리소스(CI/BI, ICON 등) 및 템플릿을 검색, 편집(일부 벡터 리소스), 다운로드할 수 있는 중앙 집중식 플랫폼 구축.

### 제외 기능
- **CODE GENERATOR**: UI에 메뉴는 추가하지만, 실제 기능(eDM 생성 등)은 현재 개발 범위에서 제외합니다.

---

## 2. 기술 스택 (Development Stack)

- **Frontend**: Next.js (React), TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Backend**: Next.js API Routes / Server Actions
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Auth**: NextAuth.js (Auth.js)

> **Note**: 초기 단계에서는 Supabase를 데이터베이스 및 인증에만 사용하며, 파일 스토리지는 추후 별도의 저장소 또는 서비스와 연동할 예정입니다.

---

## 3. 화면 구조 및 레이아웃

`ui-layout.png`를 기준으로 화면을 구성하며, 모바일 반응형을 지원합니다.

### A. 레이아웃
| 컴포넌트 | 위치 및 역할 | 상세 설명 |
| :--- | :--- | :--- |
| **Header** | 상단 고정 | 회사 로고(좌측), 통합 검색 UI(우측) |
| **Sidebar** | 좌측 고정 | 메인 메뉴 리스트 (WORK, SOURCE, TEMPLATE, CODE GENERATOR, BROCHURE) |
| **Content Area** | 우측 메인 | 선택된 메뉴에 따른 아이템 그리드 목록 |
| **Detail** | 팝업/페이지 | 아이템 클릭 시 상세 정보 표시 |

### B. 메뉴 구성
| 카테고리 | 서브 메뉴 | 기능 요구사항 |
| :--- | :--- | :--- |
| **WORK** | Penta Design | 디자인 산출물 목록 및 다운로드 |
| **SOURCE** | CI/BI, ICON, 캐릭터, 다이어그램 | SVG 벡터 이미지 목록. **클라이언트 편집 기능 필수** |
| **TEMPLATE** | PPT, 카드, 바탕화면, 웰컴보드 | 공식 템플릿 목록 및 다운로드 |
| **BROCHURE** | WAPPLES, D.AMO, iSIGN, Cloudbric | 제품별 브로셔 목록 및 다운로드 |
| **CODE GENERATOR** | - | 메뉴만 존재 (기능 미구현, 빈 페이지) |

---

## 4. 핵심 기능 (Core Features)

### A. 게시물 관리 및 검색
- **목록**: 썸네일과 함께 그리드 형태로 표시.
- **상세**: 팝업(최대 1200px, 90vh)으로 상세 정보 표시. 이전/다음 네비게이션 포함.
- **검색**: Header의 통합 검색 및 Sidebar 카테고리별 검색 지원.
- **업로드 (Admin)**: 이미지 및 압축 파일 업로드. (현재는 Supabase 스토리지 활용)

### B. SOURCE 벡터 편집 (Critical)
- **대상**: CI/BI, ICON 등 SVG 파일.
- **기능**: 사용자(회원)가 직접 **크기**, **선 굵기**, **색상**을 편집 후 다운로드.
- **구현**: Next.js 클라이언트 컴포넌트에서 SVG DOM 조작.
- **다운로드**: 편집된 결과물을 SVG, PNG, JPG 포맷으로 다운로드.

### C. 사용자 및 권한
- **툴**: NextAuth.js
- **권한**:
    - **관리자 (Admin)**: 업로드/수정/삭제, 모든 정보 열람.
    - **회원 (Member)**: 검색, 상세 열람, 다운로드(SOURCE 포함).

---

## 5. 초기 설정 (Initial Setup)

1. **Next.js 프로젝트 초기화**
   - TypeScript, Tailwind CSS, App Router 설정.
2. **Shadcn UI 통합**
   - Button, Card, Table, Dialog 등 핵심 컴포넌트 추가.
3. **Prisma & Supabase**
   - `schema.prisma` 작성 (User, Post, Category 등).
   - Supabase 연결.
4. **레이아웃 구현**
   - Header + Sidebar 구조의 메인 레이아웃 개발.

---

## 6. 현재 진행 상황 (2025-12-12 업데이트)

### 완료된 기능
- **프로젝트 초기화**: Next.js 14, TailwindCSS, Shadcn UI 설정 완료.
- **데이터베이스 연동**: Supabase PostgreSQL + Prisma (Driver Adapter) 연결 완료.
- **인증 시스템 (Auth)**:
  - NextAuth.js 기반 이메일/비밀번호 가입 및 로그인.
  - Google OAuth 소셜 로그인 연동.
  - 미들웨어(`middleware.ts`)를 통한 라우트 보호 적용.
- **권한 관리 (RBAC)**:
  - 사용자 역할(`User` / `Admin`) 구분 구현.
  - `tiper@pentasecurity.com` 계정 Admin 권한 부여 완료.
  - Admin 전용 UI (`Upload New` 버튼) 조건부 렌더링 구현.
- **UI/UX 개선**:
  - 사이드바 로고 및 사용자 프로필 UI 디자인 개선.
  - 로그인/회원가입 페이지 레이아웃 센터링 보정.

### 예정된 작업 (Next Steps)
1. **파일 업로드 기능 구현**
   - Supabase Storage 연동.
   - Admin 권한을 가진 사용자의 실제 파일 업로드 처리.
2. **SOURCE 벡터 편집 기능**
   - SVG 라이브러리 활용한 클라이언트 측 색상/크기 변경 기능.
3. **상세 데이터 연동**
   - Mock Data를 Prisma를 통한 실제 데이터베이스 조회로 변경.
4. **검색 기능 강화**
   - 전체 검색 및 카테고리별 필터링 구현.
