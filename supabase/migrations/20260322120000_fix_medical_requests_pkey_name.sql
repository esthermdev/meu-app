-- Migration: fix_medical_requests_pkey_name
-- Purpose: Correct the pkey constraint/index naming for the medical_requests table
-- This is a non-functional cleanup to avoid misleading schema artifact names.

begin;

-- Drop incorrect constraint name if present.
alter table public.medical_requests
  drop constraint if exists notifications_pkey;

-- Ensure proper unique index exists, creating if needed
create unique index if not exists medical_requests_pkey on public.medical_requests (id);

-- Attach it as the table primary key if not already.
-- If the primary key is already set (incl. the index), this is effectively a no-op.
alter table public.medical_requests
  drop constraint if exists medical_requests_pkey;

alter table public.medical_requests
  add constraint medical_requests_pkey primary key using index medical_requests_pkey;

commit;
