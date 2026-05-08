# Novel Reader

A web-based novel reading SPA built with **Vue 3 + TypeScript + Tailwind CSS**. Runs entirely client-side and communicates with a backend via REST API. During development, all API calls are intercepted by [MSW (Mock Service Worker)](https://mswjs.io/).

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | Vue Router 4 |
| State Management | Pinia |
| Build Tool | Vite |
| Package Manager | Bun |
| API Mocking (dev) | MSW v2 |
| Unit Testing | Vitest + @vue/test-utils |
| Property Testing | fast-check (min. 100 iterations/property) |

## Features

- **Novel Catalog** — Browse novels with thumbnails, metadata, infinite scroll, and full-text search
- **Advanced Finder** — Multi-genre/tag AND filter, blacklist, status, rating, chapter range, date range, sort — all synced to URL query params
- **Novel Detail** — Tabbed layout (About / ToC / Reviews / Recommendations), synopsis collapsible, stats, clickable genre/tag chips, bookmark toggle, follow button, star rating
- **Reading View** — Full chapter content with prev/next navigation, bookmark toggle, comment section, and customizable display settings (theme, font size, font family, line spacing, content width)
- **Authentication** — JWT-based login/register; Access Token in-memory, Refresh Token in localStorage
- **Bookmarks & History** — Novel-level bookmarks and reading history (server-side, requires login)
- **Notifications** — Follow novels to receive chapter update notifications with unread badge
- **Leaderboard** — Daily/weekly/all-time popularity rankings
- **Public Profile** — `/user/:username` with reading stats; username links in comments navigate here
- **Admin Panel** — CRUD for novels, chapters, genres, tags; cover upload; scheduled chapter release; report management
- **Responsive UI** — 320px (mobile) to 1920px (desktop); bottom nav + sidebar drawer on mobile, multi-column on desktop
- **Dark Mode** — Global dark/light theme toggle persisted to localStorage
- **SEO** — Dynamic `<title>` and `<meta description>` per page via `useSeoMeta` composable

## Project Structure

```
src/
├── main.ts                 # App entry — createApp, Pinia, Router, MSW bootstrap
├── App.vue                 # Root component — AppNavbar, MobileBottomNav, RouterView
├── api/index.ts            # All API calls (single source of truth for network I/O)
├── types/index.ts          # All TypeScript interfaces and types
├── router/index.ts         # Routes, lazy imports, navigation guards
├── stores/                 # Pinia stores (auth, theme, preferences, bookmarks, …)
├── composables/            # Reusable logic (useSeoMeta, useInfiniteScroll, useFilterState)
├── components/             # Pure UI building blocks (30+ components)
├── pages/                  # Route pages (20+ pages + admin/)
├── mocks/                  # MSW handlers and mock data (dev only)
├── utils/                  # localStorage helpers, formatRelativeTime
└── tests/
    ├── unit.test.ts        # Unit tests for components and business logic
    ├── property.test.ts    # Property-based tests (fast-check)
    └── helpers.ts          # Shared test utilities and arbitraries
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+

### Install dependencies

```bash
bun install
```

### Development server

Starts Vite with HMR and MSW active (all `/api/*` requests are intercepted by mock handlers):

```bash
bun run dev
```

### Production build

```bash
bun run build
```

### Preview production build

```bash
bun run preview
```

## Testing

```bash
# Run all tests (unit + property-based), single run
bun run vitest run

# Run with coverage report
bun run vitest run --coverage

# Type check
bun run vue-tsc --noEmit
```

Tests live in `src/tests/`. Property-based tests use `fast-check` with a minimum of 100 iterations per property.

## Key Conventions

- All components use `<script setup lang="ts">` — no Options API
- `src/types/index.ts` is the single source of truth for all data types — no inline interface definitions elsewhere
- `src/api/index.ts` handles all network I/O; throws `ApiError` — never silently swallows errors
- `src/utils/storage.ts` wraps all localStorage access; always call `isStorageAvailable()` before reading/writing
- Access Token is stored **in-memory only** (Pinia `auth` store) — never in localStorage
- Refresh Token is stored in localStorage under key `refresh_token`
- `AppNavbar` and `MobileBottomNav` are rendered once in `App.vue` — individual pages must not include their own navbar
- Dark mode uses Tailwind `darkMode: 'class'` — all components must use `dark:` prefix classes
- All routes are lazy-imported for automatic code splitting
- Filter state for the Advanced Finder is managed by `useFilterState` composable — synced to URL query params automatically
- MSW is only active in dev mode (`import.meta.env.DEV`)

## Routes

| Path | Page | Auth Required |
|---|---|---|
| `/` | HomePage | — |
| `/finder` | FinderPage (search + advanced filter) | — |
| `/leaderboard` | LeaderboardPage | — |
| `/novel/:novelId` | DetailPage | — |
| `/novel/:novelId/chapter/:chapterNumber` | ReadingPage | — |
| `/notifications` | NotificationsPage | ✓ |
| `/user/:username` | UserProfilePage | — |
| `/library` | LibraryPage | ✓ |
| `/notes` | NotesPage | ✓ |
| `/bookmarks` | BookmarkPage | ✓ |
| `/history` | HistoryPage | ✓ |
| `/profile` | ProfilePage | ✓ |
| `/login` | LoginPage | Guest only |
| `/register` | RegisterPage | Guest only |
| `/admin` | AdminDashboardPage | ✓ Admin |
| `/catalog` | → redirect to `/finder` (query params preserved) | — |
| `/discovery` | → redirect to `/` | — |

## License

MIT
