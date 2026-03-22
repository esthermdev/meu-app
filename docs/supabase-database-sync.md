# Supabase Database Sync Guide

This project supports **two schema workflows**:

1. **Local-first** (write SQL locally, then push to remote)
2. **Remote-first** (change schema in Supabase dashboard, then pull locally)

## Quick start (copy/paste)

### Local-first (you create migration SQL locally)

```bash
npm run migration:new -- add_your_change_name
# write SQL in the created file under supabase/migrations/
npx supabase db push
npm run update-types
git add supabase/migrations database.types.ts
git commit -m "db: add your change"
```

### Remote-first (you changed schema in Supabase dashboard)

```bash
npm run schema:sync
git add supabase/migrations database.types.ts
git commit -m "db: sync remote schema and regenerate types"
```

---

## One-time setup

Run once per machine:

```bash
npm run supabase:link
```

This links your local repo to remote project `opleqymigooimduhlvym`.

---

## Current baseline

This repo now starts from a rebased migration baseline.

- The previous local migration history was intentionally archived and replaced with a single fresh remote snapshot.
- The current baseline file is `supabase/migrations/20260322150530_remote_schema.sql`.
- Treat that file as the starting point for all future schema changes.
- Do not expect older deleted migration files to exist locally anymore.

---

## Scripts in this repo

- `npm run migration:new -- <name>` → create a timestamped migration file in `supabase/migrations/`
- `npm run supabase:link` → link local repo to remote Supabase project
- `npm run supabase:pull` → pull remote schema changes into local migration files
- `npm run update-types` → regenerate `database.types.ts` from remote schema
- `npm run schema:sync` → run pull + type generation
- `npm run schema:check-types` → CI-style check that fails if `database.types.ts` is stale

---

## DB change rules (team policy)

Use these rules for every schema change to avoid drift and production issues:

1. **One change = one new migration file.**
	- Never edit old migrations that are already applied remotely.
2. **Prefer additive changes first.**
	- Add new columns/tables first, migrate app usage, then remove old columns in a later migration.
3. **Always regenerate types after schema changes.**
	- Run `npm run update-types`.
4. **Always commit schema artifacts with app code changes.**
	- Include `supabase/migrations/*` and `database.types.ts` in the same PR.
5. **Never rely on dashboard-only changes long term.**
	- If changed in dashboard, immediately run `npm run schema:sync` and commit artifacts.
6. **Test migration impact before merge.**
	- At minimum: run app path touching changed tables + run `npm run schema:check-types`.

---

## Safe rollout checklist (before merging DB changes)

- [ ] Migration file created (or pulled) and reviewed.
- [ ] SQL is idempotent/safe where possible (`if exists` / `if not exists` for objects).
- [ ] App queries updated for new schema (if required).
- [ ] `database.types.ts` regenerated.
- [ ] `npm run schema:check-types` run locally.
- [ ] `git diff` includes only intended DB + type changes.
- [ ] Rollback/forward-fix plan written in PR description.

---

## A) Local-first flow (recommended for team consistency)

Use this when you write SQL/migrations locally and want to apply them to remote.

All commands below are run from the project root: `meu-app/`.

### Step 1: Create a migration locally

Create a new SQL migration in `supabase/migrations/` with a timestamp prefix.

Example:

```bash
npm run migration:new -- add_profiles_role_id
```

This script auto-creates a file like:

`supabase/migrations/20260218191500_add_profiles_role_id.sql`

Then open that file and add your SQL (`create table`, `alter table`, `create function`, etc.).

Naming pattern:

```text
YYYYMMDDHHMMSS_description.sql
```

For example:

`supabase/migrations/20260218121500_add_roles_rbac.sql`

### Step 2: Apply local migrations to remote

```bash
npx supabase db push
```

This applies pending local migrations to the linked remote database.

### Step 3: Refresh generated TypeScript types

```bash
npm run update-types
```

### Step 4: Commit schema artifacts

When we say “commit schema artifacts”, it means committing the schema files into git so your team and CI get the exact same DB history and types.

Files to commit:
- migration file(s) in `supabase/migrations/`
- `database.types.ts`

Recommended git flow:

```bash
git checkout -b chore/db-add-user-roles
git add supabase/migrations database.types.ts
git commit -m "db: add roles table and profile role mapping"
git push -u origin chore/db-add-user-roles
```

Then open a PR with those files.

---

## B) Remote-first flow (dashboard-first; what you use most)

Use this when you changed schema in Supabase SQL Editor / Table Editor.

All commands below are run from the project root: `meu-app/`.

### Step 1: Pull remote schema to local migrations

```bash
npm run supabase:pull
```

This creates a new migration file (for example `*_remote_schema.sql`) if remote differs from local history.

### Step 2: Regenerate TypeScript types

```bash
npm run update-types
```

Or run both in one command:

```bash
npm run schema:sync
```

### Step 3: Verify and commit

```bash
npm run schema:check-types
```

Then commit:
- new migration file(s) in `supabase/migrations/`
- `database.types.ts`

Example:

```bash
git checkout -b chore/db-sync-remote-schema
git add supabase/migrations database.types.ts
git commit -m "db: sync remote schema and regenerate types"
git push -u origin chore/db-sync-remote-schema
```

Then open a PR.

## Where to run and where to commit

- Run all Supabase and npm sync commands inside this repo root (`meu-app/`).
- Commit in this same repo (not in Supabase dashboard).
- Push the branch to your remote git provider (GitHub/GitLab/etc.) and merge via PR.

---

## Why sometimes a new `*_remote_schema.sql` appears

A new pull migration appears when remote schema and local migration history are not aligned.

Common reasons:
- schema changed directly in dashboard
- local migrations were not yet applied to remote
- different branches changed DB schema

This is expected behavior for `db pull` and is how drift is captured into versioned files.

---

## Rollbacks and recovery

### Important principle

In team environments, prefer a **forward fix migration** instead of deleting or editing applied migrations.

### Case 1: Migration not applied to remote yet

- You can safely edit/delete the local migration file.
- Then run `npm run update-types` (or `npm run schema:sync` if needed).

### Case 2: Migration already applied to remote

Create a new rollback migration:

```bash
npm run migration:new -- rollback_<original_change_name>
```

In that file, add inverse SQL (for example: drop triggers/functions/FKs/columns/tables as needed).

Then apply and sync:

```bash
npx supabase db push
npm run update-types
git add supabase/migrations database.types.ts
git commit -m "db: rollback <original change>"
```

### Case 3: Emergency production recovery

If production is broken and needs immediate restore:

1. Roll back app deploy first (fastest user-impact fix).
2. Restore DB using Supabase backup/PITR if needed.
3. Run `npm run schema:sync` locally after restore to re-align migration artifacts and types.

### Restore from backup runbook (step-by-step)

Use this when you need to return to a known-good database state.

#### Before you restore

1. Announce maintenance window if this is production.
2. Confirm the restore point timestamp you want (backup snapshot or PITR time).
3. Record current state for audit (optional but recommended):
	- current deployment version
	- current branch/commit
	- reason for restore

#### Restore in Supabase Dashboard

1. Open your Supabase project.
2. Go to **Database → Backups** (or **Settings → Database → Backups** depending on UI version).
3. Select one of:
	- a scheduled backup snapshot, or
	- a PITR timestamp (if PITR is enabled).
4. Click **Restore**.
5. Choose target:
	- restore in-place (faster, affects live DB), or
	- restore to a new database/branch first (safer for verification, if available).
6. Confirm restore and wait for completion.

#### After restore completes

1. Re-point app/deploy config if you restored to a new target.
2. Re-sync local schema artifacts:

```bash
npm run schema:sync
```

3. Verify generated types are aligned:

```bash
npm run schema:check-types
```

4. Commit updated schema artifacts if changed:
	- `supabase/migrations/*`
	- `database.types.ts`
5. Run smoke tests on critical app flows.

#### Important notes

- Restoring can remove schema/data changes made after the backup point.
- Prefer testing restore in a separate target first when production impact is high.
- Keep a short incident note in PR/issues with restore timestamp and reason.

### What not to do

- Do not delete already-applied migration files from git history.
- Do not rewrite old migration SQL that other environments already applied.
- Do not skip updating `database.types.ts` after DB changes.

---

## Daily rule of thumb

- If you changed DB in dashboard: run `npm run schema:sync`
- If you changed DB via local migration SQL: run `npx supabase db push` then `npm run update-types`
- Before PR merge: run `npm run schema:check-types`

---

## Optional clean-up notes

You may still see warnings like:
- `no seed files matched pattern: supabase/seed.sql`

If you do not use seed files, set `[db.seed].enabled = false` in `supabase/config.toml`.
If you do use seeds, create `supabase/seed.sql`.

CLI update notices are informational and do not block sync.
