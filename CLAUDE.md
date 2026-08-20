# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## This is Next.js 16 — not the Next.js in your training data

Before writing any App Router code, read the relevant guide in `node_modules/next/dist/docs/01-app/`. Notable breaking changes already reflected in this codebase:

- **`middleware.ts` → `proxy.ts`**: the request-interception file is `src/proxy.ts` and exports `proxy()`, not `middleware()`. It always runs on the Node.js runtime (no `edge` runtime option).
- **Typed route helpers**: page/layout components use the generated `PageProps<"/anim/[slug]">` and `LayoutProps<"/">` helper types (see `src/app/anim/[slug]/page.tsx`, `src/app/layout.tsx`) instead of hand-written prop types. `params`/`searchParams` are always `Promise`s and must be `await`ed.
- **Turbopack is the default** bundler for both `next dev` and `next build` — no `--turbopack` flag needed.
- **`next lint` is removed**; linting goes through the ESLint CLI directly (`npm run lint`), using ESLint's flat config format (`eslint.config.mjs`).

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build (Turbopack)
npm run start    # run the production build
npm run lint     # ESLint via flat config
```

There is no test suite configured in this repository.

## Architecture

Next.js App Router app (`src/app`) backed by Supabase (Postgres + Auth) and a separate GitHub repo used as a static CSS file host served via jsDelivr.

### Data flow: publishing an animation

1. `src/app/publish/page.tsx` (client component) collects title/description/category/CSS and does a client-side auth check via `src/lib/supabase/client.ts`. If forking (`?fork=<slug>`), it preloads the source animation's fields.
2. Submission posts to `src/app/api/publish/route.ts`, the only place that writes `animations` rows. It:
   - Re-checks auth via the request-scoped server client (`src/lib/supabase/server.ts`'s `createClient()`, cookie-based).
   - Validates CSS via `src/lib/validateCss.ts` (`validateCss` blocklist-checks for script injection / IE `expression()` / `-moz-binding`; explicitly marked as a "Phase 1" baseline, not a full moderation system).
   - Generates a unique slug (`slugify` + numeric suffix probing).
   - Writes the CSS file to the GitHub-hosted registry repo via `src/lib/github.ts` (`writeAnimationFile`, using Octokit — creates or updates `animations/<slug>.css`, returns the jsDelivr CDN URL).
   - Inserts the `animations` row using `createServiceClient()` (service-role key, bypasses RLS) — **all animation table writes go through the service client from server code, never from the browser.**
3. Browsing (`src/app/page.tsx`) and detail pages (`src/app/anim/[slug]/page.tsx`) read with the RLS-scoped server client. View-count increments on the detail page are fire-and-forget RPCs (`increment_view_count`) via the service client, since there's no client-facing update policy.

### Auth

Username/password auth (Supabase `auth.users`, email under the hood) with a device-trust step, not plain magic-link:

- **Signup** (`src/app/signup/page.tsx` → `POST /api/auth/signup`): takes username/email/password, checks username uniqueness against `profiles` via the service client, then `supabase.auth.signUp()` with `emailRedirectTo` pointing at `/auth/confirmed`. Supabase's anti-enumeration behavior (silent no-op "success" for an already-registered+confirmed email) is detected via `data.user.identities?.length === 0` and surfaced as a 409.
- **Login** (`src/app/login/page.tsx` → `POST /api/auth/login`): looks up the profile by username (service client) to get the email, then `signInWithPassword`. If the request's `device_id` cookie (see `src/lib/auth/device.ts`) is already in `trusted_devices` for that user, the session stands and login completes. Otherwise the session is immediately signed out and an email OTP is sent (`signInWithOtp` with `shouldCreateUser: false`); the client moves to a "confirm this device" stage.
- **Device confirmation** (`POST /api/auth/confirm-device`): verifies the emailed 6-digit code (`verifyOtp`, `type: "email"`), which establishes the session, then upserts a `trusted_devices` row for `(user_id, device_id)` so future logins from that device skip the OTP step.
- **Trust-device** (`POST /api/auth/trust-device`): marks the *current* device trusted for the already-authenticated caller. Used after flows that proved email ownership another way (signup confirmation link, password reset), so they don't immediately hit a redundant OTP challenge.
- `device_id` is an `httpOnly` cookie minted by `ensureDeviceId()` (`src/lib/auth/device.ts`) on first contact with an auth route; login/password-reset error responses are deliberately generic ("Invalid username or password") to avoid username/email enumeration.

Three separate Supabase client constructors exist, each for a distinct execution context — use the matching one, don't mix them up:
- `src/lib/supabase/client.ts` — browser client, for Client Components.
- `src/lib/supabase/server.ts` — `createClient()` is the cookie-aware, RLS-scoped server client for Server Components/Route Handlers; `createServiceClient()` is the service-role client for trusted server-side writes (never import into client code).
- `src/lib/supabase/middleware.ts` — used from `src/proxy.ts` (the `proxy()` export, matched against nearly all routes via its `config.matcher`) to refresh the session cookie on every request so server components see current auth state.

### Database schema

`supabase/schema.sql` is the source of truth (run manually in the Supabase SQL editor or `supabase db push` — not an automated migration pipeline). Three tables: `profiles` (auto-created via an `on_auth_user_created` trigger on `auth.users`), `animations` (with `forked_from_id` self-reference for the fork/remix feature, and `view_count`/`fork_count` maintained by SQL RPCs `increment_view_count`/`increment_fork_count`), and `trusted_devices` (the device-trust records described above, keyed on `(user_id, device_id)`). RLS is enabled on all three tables; `profiles`/`animations` have public read policies, and there are intentionally no client-facing insert/update policies on `animations` or any policy at all on `trusted_devices`, since all writes to both go through the service-role key from server routes.

### CSS registry repo

Published animation CSS is not stored as static assets in this app — each publish/fork writes a `.css` file to a *separate* GitHub repo (configured via `GITHUB_OWNER`/`GITHUB_REPO`/`GITHUB_BRANCH` env vars) and serves it publicly through jsDelivr's GitHub CDN (`src/lib/github.ts`'s `jsdelivrUrl`). The `css_content` column in Supabase is the editable source of truth used for previews/diffs in-app; the GitHub file is what consumers actually `<link>` to.

### Environment variables

Required in `.env.local` (see the file for the full annotated list, not reproduced here): Supabase project URL/anon key/service-role key, and a GitHub token scoped to the registry repo plus `GITHUB_OWNER`/`GITHUB_REPO`/`GITHUB_BRANCH`.
