# NeuroBloom LearningSphere

NeuroBloom is an inclusive learning platform for Nigerian secondary schools. It ships six
role-specific dashboards — junior student, senior student, special-needs student, teacher/tutor,
parent/guardian and the Admin Manager console — plus a public marketing site, subscriptions paid
through Paystack, and per-user state that follows the account across devices.

**Live site:** https://neurobloom-learningsphere.vercel.app

---

## Table of contents

- [What is in the product](#what-is-in-the-product)
- [Roles and dashboards](#roles-and-dashboards)
- [Feature highlights](#feature-highlights)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Payments and plans](#payments-and-plans)
- [State and persistence](#state-and-persistence)
- [Theming](#theming)
- [Deployment](#deployment)
- [Quality checks](#quality-checks)
- [Known limitations](#known-limitations)
- [Repository layout](#repository-layout)

---

## What is in the product

- **Public site** (`/`) with the role cards, plan pricing, Parent Access add-on and entry points to
  register or sign in.
- **Real accounts** — email/password signup, sign-in, forgot password and reset through Supabase
  (PKCE). A signup picks one of five account roles and that role is fixed afterwards.
- **Six dashboards** sharing one component library, one state store and one theme system.
- **Learning features** — live-class room UI, recorded lesson player, assignments with timed quizzes
  and grading, practice sets, leaderboards, a 36-topic real-life curriculum (144 questions), tutor
  booking, progress and attendance reporting, and messaging.
- **Payments** — Paystack subscriptions (including Premium Plus), promo codes, the Parent Access
  add-on, a billing page with receipts, and a server-side webhook that keeps plans in sync.
- **Admin Manager console** — overview metrics, sales, orders, products, finance, invoices, payroll,
  users & approvals, moderation, reports, feedback, Help & Support tickets, settings and analytics.
- **Teacher tools** — verification uploads, availability, assignments, marked work, earnings,
  content library and a sidebar complaint box that files a ticket straight to Help & Support.
- **First-run onboarding** — a brand-new signup sees a welcome dashboard with a role-specific setup
  checklist instead of the regular dashboard until setup is finished or skipped.
- **Themes** — every portal offers Light plus one dark mode coloured for that role.

## Roles and dashboards

| Role | Signup key | Dashboard | Dark theme |
| --- | --- | --- | --- |
| Junior student | `junior` | `/junior` | Burnt orange |
| Senior student | `senior` | `/senior` | Navy |
| Special-needs student | `special` | `/special` | Teal |
| Teacher / tutor | `teacher` | `/teacher` | Green |
| Parent / guardian | `parent` | `/parent` | Teal |
| Admin Manager | grant-only | `/admin` | Grey |

Admins are never a signup choice. Grant the role to an existing account with
`npm run grant:admin -- someone@example.com`, or look around without an admin account at
`/admin?preview=1` (sample data, read-only).

Secondary pages per portal:

- **Junior** — classes, assignments, subjects, leaderboard, messages
- **Senior** — classes, assignments, subjects, WAEC exam prep, tutoring, resources, messages
- **Special** — activities, lessons, progress, awards, talk
- **Teacher** — classes, students, assignments, tutoring requests, earnings, content, messages,
  settings (verification)
- **Parent** — progress, attendance, assignments, teachers, subscriptions, My Billing, Parent
  Access, messages, safety & reports, special support
- **Admin** — profile (daily complaints queue), sales, orders, products, users, moderation, finance,
  invoices, payroll, reports, feedback, support, settings, analytics

## Feature highlights

### Accounts and access

- Supabase Auth with email/password and PKCE; password recovery lands on `/auth/callback`.
- A `profiles` row is created per account with a role fixed at signup (RLS blocks role updates).
- `RequireRole` guards every portal; an account with the `admin` role may open any dashboard.
- When Supabase keys are absent the app runs in **demo mode**: the marketing site and dashboards
  render from in-memory seed data, and auth screens explain that accounts are not connected.

### Teacher complaint box

The teacher sidebar has a "Send a complaint" form with a category picker. Submitting stores a
ticket in `localStorage['neurobloom:complaints:v1']` (see `src/lib/complaints.ts`) and shows a
confirmation. The Admin Manager **Help & Support** page reads the same queue and lists those tickets
ahead of its seed data, including the category and the teacher's name.

### First-run dashboard

New accounts get `NewUserDashboard` (`src/components/onboarding.tsx`) with a welcome hero, a
four-step setup checklist, first-week habits and a help card. The checklist writes into
`AppState.onboarding`; each role home page renders the welcome view while
`onboarding.complete` is false.

First-run detection: signup writes a local marker `neurobloom:onboarding:<userId>`
(`src/lib/onboarding.ts`). On the first hydrate, a marker plus no saved `user_state` row means the
account is brand new. Existing accounts and demo data default to complete, so nothing changes for
them. The store persists through its autosave effect only, which avoids a stale first-run snapshot
overwriting setup completion on a slow connection.

### Learning experience

- Live-class room with session list, join/host states and a simulated stream.
- Recorded lesson player with chapters and progress.
- Assignments, timed practice quizzes, automatic scoring and inline feedback.
- Subject explorer backed by `src/data/curriculum.ts` (36 topics, 144 questions).
- Leaderboards, badges, streaks and special-needs focus mode with text scaling.
- Parent progress, attendance and teacher messaging.

### Admin Manager

`/admin` is a complete operations console built on `src/data/admin-ops.ts` and
`src/pages/admin-ops.tsx`. Interactive actions persist in localStorage keys such as
`neurobloom:admin:tasks:v1`, `:products:v1`, `:invoices:v1`, `:payroll:v1`, `:feedback:v1`,
`:support:v1` and `:settings:v1`. `?preview=1` is remembered in sessionStorage so module navigation
does not bounce back to sign-in.

## Tech stack

- **React 19** + **TypeScript 5.8** (strict) + **Vite 7**
- **React Router 7** for routing and guards
- **Tailwind CSS 4** with CSS variables for per-role theming
- **lucide-react** icons, **Recharts** for admin charts
- **Supabase** for auth, Postgres and row-level security
- **Paystack** for subscriptions and one-off charges (Vercel functions in `api/`)
- **Mailgun** for confirmation email (optional; the endpoint reports `email_not_configured` until
  credentials exist)
- **pnpm 9** for dependencies; **Vercel** for hosting

## Architecture

```
src/
  App.tsx            routes, role guards, document titles
  pages/             one module per portal + Auth, Landing, PaymentCallback, admin-ops
  components/        layout (sidebar/theme/complaints), ui kit, charts, chat, lesson, onboarding, guards
  store/store.tsx    single reducer store, hydration, autosave, plans merge
  lib/               auth, supabase client, payments, complaints, onboarding, email, utils
  config/roles.tsx   per-role nav, icons, marketing copy and home path
  data/              seeded content, admin data, curriculum
  index.css          Tailwind entry and every theme token block
api/
  paystack/          initialize, verify, webhook (+ _shared helpers)
  send-email.js      Mailgun sender
supabase/migrations  schema, RLS policies and payments table
scripts/             one-off admin/paystack/mailgun/activation helpers
```

Key conventions:

- Each role's palette lives in `src/index.css` under `[data-role="<role>"]` and
  `[data-role="<role>"][data-theme="teal"]`. Components read semantic tokens
  (`--role-accent`, `--shell-bg`, `--color-card`, …) instead of literal colours.
- The stored theme value is always `classic` or `teal`; only the visible label changes per role
  (`themeOptionsFor` in `src/components/layout.tsx`), e.g. Navy, Green, Grey.
- Server endpoints never trust client prices: the client sends a plan id and the server resolves the
  amount, coupons and Paystack plan code.
- Plan state is server-owned once payments are configured: autosave merges `plans` from
  `user_state` so an old tab cannot overwrite a completed charge.

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm 9 (`corepack enable` is enough)
- A Supabase project (optional — the app boots in demo mode without one)
- A Paystack account in test mode (optional; checkout is hidden without the public key)

### Install and run

```bash
pnpm install
cp .env.example .env.local     # then fill in the values
pnpm dev                       # http://localhost:5173
```

Production build:

```bash
pnpm build                     # tsc -b && vite build
pnpm preview
```

Utility scripts (they read server keys from `.secrets/supabase.env`, never from the client env):

```bash
pnpm grant:admin -- someone@example.com     # grant or revoke the admin role
pnpm paystack:setup                          # create Paystack test plans
pnpm check:mailgun                           # verify Mailgun configuration
pnpm activate                                # apply Supabase activation steps
```

## Environment variables

### Client (baked into the Vite build)

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack test public key; without it the checkout button is disabled |

When the Supabase pair is missing the app runs in demo mode.

### Server (Vercel functions)

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used only by the payment and email endpoints |
| `SUPABASE_ANON_KEY` | Anon key for reading the signed-in user's state server-side |
| `PAYSTACK_SECRET_KEY` | Paystack secret; also verifies the webhook signature |
| `PAYSTACK_PLAN_GENERAL` | Paystack plan code for General (₦8,500) |
| `PAYSTACK_PLAN_PREMIUM` | Paystack plan code for Premium (₦15,000) |
| `PAYSTACK_PLAN_PREMIUM_PLUS` | Paystack plan code for Premium Plus (₦25,000) |
| `PAYSTACK_PLAN_SPECIAL` | Paystack plan code for Special Needs Premium (₦22,000) |
| `PAYSTACK_PLAN_PARENT_ACCESS` | Plan code for the ₦2,500 Parent Access add-on (optional — one-off if unset) |
| `SITE_URL` | Public origin used to build Paystack callback URLs (falls back to the request host) |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` | Mailgun sender |
| `MAILGUN_BASE_URL`, `MAILGUN_REPLY_TO` | Optional Mailgun overrides |

Never prefix a secret with `VITE_` — those values are shipped to the browser. The `.secrets/`
folder and every `.env*` file except `.env.example` are git-ignored.

## Database

Apply `supabase/migrations/0001` → `0004` to a Supabase project (SQL editor or CLI):

- `profiles` — one row per account: full name, phone, role (fixed by RLS), created_at.
- `user_state` — per-user JSON blob for the whole app state, with self read/insert/update policies.
- `payments` — Paystack references, plan, amount, status and metadata; users may read their own.
- `email_log` — deliveries recorded by the email endpoint.
- Admin role is stored on `profiles.role = 'admin'`; no policy lets a user set it themselves.

## Payments and plans

| Plan id | Name | Price (Naira) | Notes |
| --- | --- | --- | --- |
| `general` | General | 8,500 / month | Free-tier features, no Parent Access |
| `premium` | Premium | 15,000 / month | Unlocks Parent Access |
| `premium_plus` | Premium Plus | 25,000 / month | Unlocks Parent Access |
| `special` | Special Needs Premium | 22,000 / month | Unlocks Parent Access |
| `parent_access` | Parent Access add-on | 2,500 / month | Per child, optional |

Promo codes are resolved server-side: `BLOOM10` (10%), `FAMILY15` (15%), `WAEC20` (20%). A
discounted checkout is charged once instead of through a Paystack plan.

Flow: the client calls `/api/paystack/initialize` with a plan id (and child for the add-on) → the
server prices it and returns an authorization URL → Paystack redirects to `/payment/callback` →
`/api/paystack/verify` confirms the charge and writes the plan into `user_state` → the webhook
repeats that update for renewals. Parent Access requires the child to already be on a premium plan.
Public registration for the add-on lives at `/parent-access/register` and chains plan checkout into
the add-on as step 2.

## State and persistence

- `AppStoreProvider` hydrates the signed-in user's `user_state` row once, then autosaves changes on
  a 700 ms debounce (and even when a save fails, the next change retries).
- With Supabase configured, the server version of `plans` wins over a stale tab.
- Without Supabase, state falls back to `localStorage['neurobloom:demo:v4']`.
- First-run onboarding uses `neurobloom:onboarding:<userId>`; complaints use
  `neurobloom:complaints:v1`; admin module actions use their own `neurobloom:admin:*` keys.

## Theming

`src/index.css` defines Light tokens on `:root`/`[data-theme="classic"]` and a dark block per role
under `[data-theme="teal"]`. Current dark palettes:

| Role | Label | Shell | Accent |
| --- | --- | --- | --- |
| Junior | Burnt | `#8a4403` | `#b45309` |
| Senior | Navy | `#052d44` | `#0d5a85` |
| Special | Teal | `#053e2f` | `#0b6b4f` |
| Teacher | Green | `#045c3f` | `#10b981` |
| Parent | Teal | `#053e2f` | `#0b6b4f` |
| Admin | Grey | `#1f2937` | slate/sky |

The sidebar toggle and the profile menu both set the preference; old saved `burnt`/`forest` values
migrate to `teal` in `normalizeState`.

## Deployment

The site is deployed on Vercel from this repository:

```bash
vercel --prod
```

`vercel.json` rewrites every path to `index.html` so client-side routes work on refresh, and the
`api/` folder is deployed as serverless functions. Production needs the server variables listed
above as Vercel environment variables, plus the three client variables at build time. Verify a
change by loading the deployed URL, not only the dev server.

## Quality checks

```bash
pnpm typecheck     # tsc -b
pnpm build         # full production build
```

Manual smoke path for a release:

1. Landing → plan cards → Register / Sign in.
2. Sign up as each role: the first-run dashboard appears, setup can be completed or skipped, and
   the choice survives a page reload.
3. Teacher portal: theme label reads Green, the shell is green, the complaint box sends, and the
   ticket appears under Admin Manager → Help & Support.
4. Parent portal: subscribe (Paystack test), then buy Parent Access; both surfaces update.
5. `/admin?preview=1` opens every module, and `/admin` is reachable only by an admin account.
6. Narrow the viewport to 390 px: headers, tables and the mobile drawer stay usable.

## Known limitations

- Phone OTP and social sign-in are not built — they need an SMS or OAuth provider.
- Video is simulated UI; there is no real streaming or recording backend.
- Mailgun delivery needs an API key and domain; until then the email endpoint answers
  `email_not_configured` and messages are stored in-app only.
- Admin modules persist locally per browser rather than in Postgres.
- Physical-phone testing is manual.

## Repository layout

```
.env.example             client and server variable names (no values)
api/                     Vercel functions: Paystack + Mailgun
scripts/                 admin grant, Paystack setup, Mailgun check, Supabase activation
supabase/migrations/     schema and RLS policies
src/pages/               Landing, Auth, ParentAccessRegister, per-role portals, admin-ops
src/components/          layout, UI kit, charts, chat, lessons, onboarding, guards, toast
src/store/               app store with hydration and autosave
src/lib/                 auth, supabase, payments, complaints, onboarding, email
src/data/                seed content, admin operations data, curriculum
```
