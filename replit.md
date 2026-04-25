# HomeCare Platform

## Overview

관리형 홈케어 마켓플레이스 플랫폼. 표준화된 패키지 상품을 기반으로 가격·품질·운영을 통제하는 관리형 마켓플레이스입니다.

주문 → 배정 → 시공 → 검수 → 완료/A/S 흐름을 관리합니다.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (artifacts/homecare)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- **Auth**: Session-based (express-session + bcryptjs)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Users & Roles

- **고객(customer)**: 패키지 탐색, 예약, 주문 확인, 리뷰/A/S 신청
- **파트너(partner)**: 배차 수락/거절, 작업 수행
- **관리자(admin/operator)**: 주문 대시보드, 배차 관리, 파트너 승인, 검수 관리

## Test Accounts

| 역할 | 전화번호 | 비밀번호 |
|------|---------|---------|
| 관리자 | 010-0000-0001 | admin1234 |
| 고객 (김철수) | 010-1111-2222 | customer1234 |
| 고객 (이영희) | 010-3333-4444 | customer1234 |
| 파트너 (박기사) | 010-5555-6666 | partner1234 |
| 파트너 (최기사) | 010-7777-8888 | partner1234 |

## Service Packages (5개)

| 패키지 | 가격 | A/S 보증 |
|--------|------|---------|
| 90분 퀵픽스 | 30,000원 | 30일 |
| 시니어 안심 | 80,000원 | 60일 |
| 에너지 세이브 | 50,000원 | 30일 |
| 임대 턴오버 | 150,000원 | 90일 |
| 계절 점검 | 60,000원 | 30일 |

## Order Status Flow

requested → paid → pending_assignment → assigned → en_route → arrived → in_progress → inspection_pending → inspection_approved → completed → (as_requested)

## Project Structure

```
artifacts/
  homecare/           # React + Vite 프론트엔드
  api-server/         # Express API 서버
lib/
  api-spec/           # OpenAPI 스펙 (openapi.yaml)
  api-client-react/   # 생성된 React Query 훅
  api-zod/            # 생성된 Zod 스키마
  db/                 # Drizzle ORM 스키마 + 연결
```

## DB Schema Tables

- users, customer_profiles, customer_addresses
- partner_profiles
- service_packages, package_included_items, package_excluded_items, package_tasks
- orders (payment_method enum: cash|card, refund_bank_name, refund_account_number, refund_account_holder), order_status_logs
- job_assignments
- reviews, as_requests
- service_manuals (packageId uuid FK → service_packages, title, fileType, objectPath, originalName, fileSize, sortOrder)
- package_standard_manuals (packageId → service_packages, title, fileType, objectPath, originalName, fileSize)
- package_ai_videos (packageId, status, script JSON, errorMessage)
- package_external_videos (packageId, title, videoType, source, objectPath, thumbnailUrl, sortOrder)
- board_posts (userId, authorName, authorType, title, content, category enum, status enum, isPinned, isSecret, viewCount, contactPhone, deletedAt)
- board_comments (postId, userId, authorName, authorType, content, isAiGenerated, notificationSent, deletedAt)
- board_notifications (postId, commentId, recipientName, recipientPhone, messageContent, isSent, sentAt)

## Service Manuals Feature

- 어드민이 패키지별로 PDF/동영상 매뉴얼 파일을 업로드·관리: `/admin/manuals`
- 파트너가 매뉴얼 파일을 열람·다운로드: `/partner/manuals`
- 파일은 Object Storage (GCS presigned URL 방식) 에 저장; objectPath는 `/objects/<uuid>` 형식
- 파일 서빙 엔드포인트: `GET /api/storage/objects/<entityId>`
- Object Storage env vars: DEFAULT_OBJECT_STORAGE_BUCKET_ID, PRIVATE_OBJECT_DIR, PUBLIC_OBJECT_SEARCH_PATHS
- lib/object-storage-web: useUpload hook (클라이언트 presigned URL 2단계 업로드)

## Payment Module

- 결제 수단: 카드(card) / 현금(cash) 선택
- 현금 결제 시 환불 계좌 정보(은행명·계좌번호·예금주) 필수 입력
- 예약 취소 시: 카드는 카드사 자동 환불 안내, 현금은 입력된 계좌로 환불 안내
- orders 테이블 컬럼: payment_method, refund_bank_name, refund_account_number, refund_account_holder
- api-zod index.ts는 generated/api.ts 하나만 export (api.schemas 없음)

## Board (게시판) Feature

- 고객/관리자 간 소통 게시판: `/board` (고객), `/admin/board` (관리자)
- 게시물 카테고리: inquiry(문의), notice(공지), general(자유), complaint(불만/개선)
- 게시물 상태: open(대기중), answered(답변완료), closed(종결)
- 권한: 작성자 또는 관리자만 수정/삭제 가능; 비밀글은 작성자/관리자만 열람
- AI 답변: 관리자가 'AI 답변 생성' 클릭 시 GPT-4.1로 고객 문의에 최적 답변 자동 생성
- 메시지 알림: 관리자가 inquiry 카테고리 게시글에 답변하면, board_notifications 테이블에 발송 메시지가 자동 생성됨
  - 관리자는 /admin/board 상단 '발송 대기 알림' 패널에서 메시지 내용 복사 및 전송 완료 처리 가능
- Session 접근: req.session.userId, req.session.userRole (user 객체 없음)
