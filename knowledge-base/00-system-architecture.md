<!-- ADLC: This stub was auto-extracted by Claude (60% extracted). -->
<!-- Review and enhance the content below. -->

```
## Directory Structure
ai-gateway/
├── public/                  (static) — static assets, fonts, docs, favicons
├── src/
│   ├── app/                 (18 files) — Next.js App Router; route entry points and layouts
│   │   ├── dashboard/
│   │   │   ├── agent/
│   │   │   ├── overview/
│   │   │   ├── playground/
│   │   │   ├── projects/
│   │   │   └── services/
│   │   ├── login/
│   │   └── set-password/
│   ├── sections/            (58 files) — Feature UI: page-level view logic per dashboard section
│   │   ├── auth/
│   │   │   └── jwt/
│   │   ├── dashboard/
│   │   │   ├── agent-builder/        (13 files — components + hooks)
│   │   │   ├── overviewComponents/   (6 files)
│   │   │   ├── serviceComponents/    (8 files)
│   │   │   └── projectManagementComponents/ (19 files)
│   │   └── error/
│   ├── components/          (132 files) — Shared UI primitives (chart, animate, label, markdown…)
│   │   ├── animate/
│   │   ├── chart/
│   │   ├── hook-form/
│   │   ├── nav-section/
│   │   └── settings/
│   ├── api/                 (18 files) — API client layer; typed fetch wrappers per domain
│   │   ├── services/        (13 service files: auth, inference, ocr, playground, kb, etc.)
│   │   └── errors/
│   ├── stores/              (4 files) — Redux state (RTK slices per domain)
│   │   └── slicers/         (orgProject, products, user)
│   ├── hooks/               (8 files) — Custom React hooks (data fetching, derived state)
│   ├── auth/                (14 files) — Auth context (JWT), guards, auth hooks
│   │   ├── context/jwt/
│   │   ├── guard/
│   │   └── hooks/
│   ├── layouts/             (37 files) — Shell layouts (dashboard, auth-split, simple, core)
│   │   ├── dashboard/
│   │   ├── auth-split/
│   │   ├── components/      (notifications-drawer, searchbar)
│   │   └── core/
│   ├── routes/              (10 files) — Route definitions and route-level components
│   │   ├── components/
│   │   └── hooks/
│   ├── theme/               (61 files) — MUI theme overrides, global styles, with-settings wrappers
│   │   ├── core/components/
│   │   ├── styles/
│   │   └── with-settings/
│   ├── utils/               (12 files) — Pure utility functions
│   ├── types/               (1 file)  — Shared TypeScript type definitions
│   ├── locales/             (18 files) — i18n strings (ar, cn, en, fr, vi)
│   ├── assets/              (25 files) — Icons, illustrations, static data
│   └── _mock/               (17 files) — Mock data for dev/testing
```

## Layers

- **Routes / App** (`src/app/`, `src/routes/`): Next.js App Router pages and route definitions; entry points that compose layouts and sections.
- **Features / Sections** (`src/sections/`): Page-level feature views — each dashboard section (agent-builder, playground, services, overview, projects) owns its view logic and sub-components here.
- **Shared Components** (`src/components/`): Reusable, domain-agnostic UI primitives (chart, animate, label, nav, settings drawer, etc.).
- **Layouts** (`src/layouts/`): Shell chrome — dashboard shell, auth layouts, header, sidebar, notification drawer.
- **API Services** (`src/api/services/`): Typed fetch wrappers per domain; all network calls originate here.
- **State / Store** (`src/stores/slicers/`): Redux Toolkit slices for global client state (org, products, user).
- **Auth** (`src/auth/`): JWT context, route guards, and auth-specific hooks — access control boundary.
- **Hooks** (`src/hooks/`): Cross-cutting custom hooks (data fetching aggregators, derived state).
- **Theme** (`src/theme/`): MUI component overrides and global CSS; no business logic.
- **Utils / Types** (`src/utils/`, `src/types/`): Pure helpers and shared TypeScript interfaces.
