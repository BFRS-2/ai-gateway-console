<!-- ADLC: This stub was auto-extracted by Claude (90% extracted). -->
<!-- Review and enhance the content below. -->

Now I have all the data needed to produce the annotated source tree.

```
## Source Tree

ai-gateway/
├── knowledge-base/      (14 files) — ADLC KB stubs: architecture, API contracts, conventions, gotchas
├── public/             (~152 files) — Static assets served by Next.js without bundling
│   ├── assets/        (~136 files) — Images, background webps, SVG icon sets, illustrations
│   │   ├── background/  (13 files)
│   │   ├── icons/      (~110 files)
│   │   └── illustrations/ (6 files)
│   ├── docs/             (6 files) — Markdown docs for API features (OCR, embeddings, video, etc.)
│   ├── fonts/            (2 files)
│   └── logo/             (4 files)
└── src/                (~357 files) — Application source root
    ├── _mock/           (17 files) — Static fixture data for local development and UI stubs
    │   └── _map/         (3 files)
    ├── api/             (18 files) — Typed HTTP service layer: axios wrappers, service modules, error classes
    │   ├── errors/       (3 files)
    │   └── services/    (13 files)
    ├── app/             (18 files) — Next.js App Router: route segments, page.tsx/layout.tsx entry points
    │   ├── dashboard/   (10 files)
    │   ├── login/        (2 files)
    │   └── set-password/ (2 files)
    ├── assets/          (25 files) — In-bundle assets: TSX icon components, illustrations, country data
    │   ├── data/         (2 files)
    │   ├── icons/        (8 files)
    │   └── illustrations/(15 files)
    ├── auth/            (14 files) — JWT auth context, route guards (auth/guest/role), auth hooks
    │   ├── context/      (6 files)
    │   ├── guard/        (4 files)
    │   └── hooks/        (3 files)
    ├── components/     (~120 files) — Shared UI primitives: animate, chart, nav, form, iconify, markdown
    │   ├── animate/     (29 files)
    │   ├── chart/        (8 files)
    │   ├── nav-section/ (19 files)
    │   └── [16 other atom subdirs]
    ├── hooks/            (8 files) — Generic React hooks: boolean, responsive, local-storage, events
    ├── layouts/         (37 files) — Shell layouts for dashboard, auth-split, and simple views
    │   ├── auth-split/   (4 files)
    │   ├── components/  (17 files)
    │   ├── core/         (3 files)
    │   ├── dashboard/    (6 files)
    │   └── simple/       (3 files)
    ├── locales/         (18 files) — i18n config and JSON translation strings (AR, CN, EN, FR, VI)
    │   ├── langs/       (10 files)
    │   └── utils/        (1 file)
    ├── routes/          (10 files) — Route path constants and Next.js router hook wrappers
    │   ├── components/   (2 files)
    │   └── hooks/        (6 files)
    ├── sections/        (58 files) — Feature-level page sections: dashboard, auth flows, error views
    │   ├── auth/         (4 files)
    │   ├── dashboard/   (50 files) — Core feature area: overview, projects, services, playground, agent builder
    │   │   ├── agent-builder/           (13 files)
    │   │   ├── overviewComponents/       (6 files)
    │   │   ├── projectManagementComponents/ (19 files)
    │   │   └── serviceComponents/        (8 files)
    │   └── error/        (4 files)
    ├── stores/           (4 files) — Redux Toolkit store: org/project/user slices
    │   └── slicers/      (3 files)
    ├── theme/           (62 files) — MUI theme: palette, typography, shadows, full component overrides
    │   ├── core/        (51 files)
    │   │   └── components/ (45 files)
    │   ├── styles/       (3 files)
    │   └── with-settings/(3 files)
    ├── types/            (1 file)  — Global TypeScript ambient declarations
    └── utils/           (12 files) — Shared helpers: axios instance, formatters, code-block renderer

## Oversized Directories (>200 files)
None detected
```
