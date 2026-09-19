# CareLink — Chăm sóc người cao tuổi

CareLink giúp gia đình ở xa theo dõi việc chăm sóc, sức khỏe, thuốc, lộ trình và chi phí của người thân lớn tuổi trong một không gian an toàn.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/carelink/src/App.tsx` — shell, routes, dashboard và các luồng tương tác chính
- `artifacts/carelink/src/index.css` — hệ màu, responsive layout và component styles
- `artifacts/api-server/src/routes/carelink.ts` — API demo cho dashboard, care-log, thuốc, SOS, chi phí và hồ sơ AI
- `lib/api-spec/openapi.yaml` — source of truth cho các API contract
- `lib/db/src/schema/carelink.ts` — state store cho dữ liệu CareLink

## Architecture decisions

- App dùng family dashboard làm bề mặt chính, sau đó mở rộng sang các route chuyên biệt cho care-log, thuốc, hành trình, chi phí và caregiver.
- Dữ liệu demo được lưu trong PostgreSQL dưới dạng state payload để các thao tác trong preview có thể tồn tại sau reload mà không phải tạo nhiều bảng ngay từ bản đầu.
- Các thao tác quan trọng như xác nhận care-log, đánh dấu thuốc, thêm chi phí và SOS đều đi qua API contract có validation.

## Product

- Theo dõi tiến độ chăm sóc trong ngày, wellbeing, medication rhythm và trust score.
- Review/xác nhận care-log có timestamp, caregiver và bằng chứng ảnh.
- Đánh dấu thuốc đã uống/bỏ lỡ, theo dõi lượng thuốc còn lại và cảnh báo sắp hết.
- Theo dõi journey premium với các mốc lộ trình, người chăm sóc và chi phí.
- Tạo profile caregiver từ đoạn mô tả tự nhiên bằng profile studio.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
