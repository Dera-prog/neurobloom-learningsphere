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

### Privacy, terms and consent

`/privacy`, `/terms` and `/child-safety` are written against what the product actually stores —
Supabase project data (eu-central-1), Vercel hosting, Paystack billing, the email/SMS providers, the
private verification bucket and the relationship-enforced messaging model — and the landing and auth
footers link to all three. Both account-creation flows (student/teacher signup and Parent Access
registration) require an explicit consent tick that links to the Terms and Privacy Policy.

Under-18 signup sends a six-digit code to a guardian's email or phone (`/api/guardian-otp`); that
code is the recorded consent. The code is HMAC-signed, expires in ten minutes and allows three sends
per ten minutes. When neither Resend/Mailgun nor Termii is configured the endpoint answers in review
mode and returns the code for QA only; once a provider is configured a failed send is a hard error,
never a fallback that exposes the code.

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
- **Resend** or **Mailgun** for transactional email and **Termii** for SMS sign-up codes (optional;
  signup consent codes fall back to a review mode until credentials exist)
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
  _email.js          provider-agnostic email transport (Resend or Mailgun)
  _sms.js            Termii SMS transport
  guardian-otp.js    guardian consent codes for under-18 signup
  send-email.js      plan, booking and support notifications
  health.js          which providers are configured (booleans only)
supabase/migrations  schema, RLS policies and payments table
scripts/             admin/paystack/activation/email/SMS helpers
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
pnpm check:email you@example.com             # verify Resend or Mailgun delivery
pnpm check:sms 08030000000                   # verify Termii delivery
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
| `RESEND_API_KEY` | Resend sender; takes precedence over Mailgun when set |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Sender and reply address shared by both email providers |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` | Mailgun sender (used when Resend is unset) |
| `MAILGUN_BASE_URL`, `MAILGUN_REPLY_TO` | Optional Mailgun overrides |
| `TERMII_API_KEY` | Termii sender for guardian sign-up codes |
| `TERMII_SENDER_ID`, `TERMII_CHANNEL`, `TERMII_BASE_URL` | Optional Termii overrides |

`/api/health` reports `{ payments, email, emailProvider, sms, smsProvider }` — booleans and provider
names only, never key values.

Never prefix a secret with `VITE_` — those values are shipped to the browser. The `.secrets/`
folder and every `.env*` file except `.env.example` are git-ignored.

## Database

Apply `supabase/migrations/0001` → `0012` to a Supabase project (SQL editor or CLI):

- `profiles` — one row per account: full name, phone, role (fixed by RLS), created_at.
- `user_state` — per-user JSON blob for the whole app state, with self read/insert/update policies.
- `payments` — Paystack references, plan, amount, status and metadata; users may read their own.
- `email_log` — deliveries recorded by the email endpoint.
- `subscriptions` — the server-owned plan entitlement: one active plan per child plus an optional
  `parent_access` add-on. Only the Paystack endpoints write it (service role); parents read their
  own rows, and the web app derives plans from this table rather than from `user_state`.
- `children`, `classes`, `enrollments`, `assignments`, `submissions`, `activity_completions` — the
  Phase 1 homework model. Guardians read their own child's work; class teachers set and grade it;
  admins see everything. `src/lib/homework.ts` falls back to seeded demo content until the
  migration is applied.
- Grades live on `submissions` and are written only by the class teacher (or an admin): 0007 adds
  a trigger that refuses score, feedback or `graded` status changes from a guardian on a claimed
  class, and lets a teacher claim a class that no one owns yet. The parent dashboards read their
  child's latest graded work per subject from the table.
- `class_sessions` and `attendance` (0008) hold the weekly timetable and the register. Each session
  is one recurring slot (ISO weekday 1–7, start/end time, room); the class teacher or an admin
  writes them. Attendance is one row per class, learner and date. A trigger requires the writer to
  teach the class, rejects learners who are not enrolled, refuses to move a record to another
  learner or class, and stamps `marked_by`/`marked_at` server-side. Guardians read their own child's
  records only — an absence request belongs in messages.
- Teacher verification (0009) is `teacher_verifications` (one row per teacher: status
  `pending`/`approved`/`rejected`, review note, reviewer and timestamps) plus
  `teacher_verification_documents` (name, type, private storage path, per-document status). Files live
  in the **private** `teacher-verification` bucket under `<teacher id>/…`, and storage policies only
  let a teacher touch their own folder; viewers open a short-lived signed URL. A trigger forces every
  teacher submission to `pending` with the display name and email copied from `profiles`, so a crafted
  request cannot rename the applicant or self-approve; only an admin can approve or reject, and
  `reviewed_by`/`reviewed_at` are stamped by the database. Uploading a new document reopens an approved
  or rejected verification for review. The admin queue is `/admin/verifications`.
  `src/lib/verification.ts` is the only client path to these tables.
- Bookings and tutor requests (0010) are `bookings` (owner, requester name, tutor snapshot, subject,
  slot, rate, audience, optional child, status `upcoming`/`completed`/`cancelled`) and
  `tutor_requests` (student, level, topic, rate, specialist flag, preferred time, status
  `open`/`accepted`/`declined`, acceptor). A trigger stamps the requester from the session and the
  display name from `profiles`, forces every booking to start `upcoming`, and only lets the owner
  cancel — any other edit is refused. Booking a child requires guardianship. Only a teacher or admin
  can answer a request, only while it is still open, never their own, and the content is immutable:
  the trigger writes `accepted_by`/`accepted_by_name`/`accepted_at`. Teachers see open requests plus
  their own accepted ones. `src/lib/bookings.ts` is the client path; the learner side is
  `/senior/tutoring` and the teacher side is `/teacher/tutoring`.
- Support tickets (0011) are complaints sent to the Admin Manager desk. A trigger stamps the
  requester from the session and copies the display name and role from `profiles`, so a crafted
  request cannot file as someone else or arrive pre-resolved. The requester cannot edit, withdraw or
  answer their own ticket; only an admin can reply or move it to `waiting`/`resolved`, and the
  reviewer name and time are stamped by the database — that is the reply the requester sees. The
  teacher sidebar box and the parent Special Support form file tickets; `/admin/support` lists the
  queue, replies and status changes. `src/lib/support.ts` is the client path.
- Conversations and messages (0012) are `conversations`, `conversation_members` and `chat_messages`.
  A thread exists only between two accounts that already have a relationship: a guardian and the
  teacher of a class their child is enrolled in, a student and the tutor who accepted their request,
  or anyone and the admin team (admins may also open a thread with any account). The client calls
  `start_conversation(peer, body)`, which checks the relationship, reuses an existing pair and writes
  the first message; clients cannot insert conversation or member rows themselves. A message trigger
  forces the sender id and display name from the session and stamps the time, sent messages cannot be
  edited, and `last_message_at` drives thread order through `my_conversations()`. `my_contacts()`
  is the picker list. `src/lib/messages.ts` is the client path; the Messenger component renders the
  threads and the New conversation picker, falling back to seeded demo chats only when Supabase is
  not configured or the live list is unreachable (shown with a Sample badge).
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

### Installable app (PWA)

The production build is an installable Progressive Web App. `public/manifest.webmanifest`
declares the name, colours and the 192 / 512 / maskable icons; `public/sw.js` precaches the app
shell and serves hashed assets stale-while-revalidate, so the shell still opens offline (live
data still needs a connection). `src/main.tsx` registers the worker in production only. The
landing header shows an **Install app** button when the browser fires `beforeinstallprompt`;
iPhone Safari gets Add-to-Home-Screen steps instead, and both hide once the app runs standalone.

`vercel.json` serves `/sw.js` and the manifest with `no-cache` so a deploy is picked up on the
next visit. Verify with the PWA suite (17 checks: manifest parse, installability, worker
control, offline shell):

```bash
BASE=https://neurobloom-learningsphere.vercel.app node .shots/check-pwa.mjs
```

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

- General phone sign-in and social sign-in are not built — they need an SMS-OTP or OAuth provider.
  (Guardian consent codes during signup do send by email or SMS once a provider is configured.)
- Video is simulated UI; there is no real streaming or recording backend.
- Email and SMS need a provider key; until one exists, guardian signup runs in review mode and
  `/api/send-email` answers `email_not_configured`, so notifications stay in-app only.
- Admin modules persist locally per browser rather than in Postgres.
- Physical-phone testing is manual.

## Repository layout

```
.env.example             client and server variable names (no values)
api/                     Vercel functions: Paystack, email, SMS, consent codes, health
scripts/                 admin grant, Paystack setup, email/SMS checks, Supabase activation
supabase/migrations/     schema and RLS policies
src/pages/               Landing, Auth, ParentAccessRegister, Legal, per-role portals, admin-ops
src/components/          layout, UI kit, charts, chat, lessons, onboarding, guards, toast, install
src/store/               app store with hydration and autosave
src/lib/                 auth, supabase, payments, complaints, onboarding, email
src/data/                seed content, admin operations data, curriculum
```
