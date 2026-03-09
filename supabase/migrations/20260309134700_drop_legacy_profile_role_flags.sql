-- Migration: drop_legacy_profile_role_flags
-- Created at: 2026-03-09T17:47:00.112Z

do $$
begin
	if exists (
		select 1
		from public.profiles p
		left join public.profile_roles pr
			on pr.profile_id = p.id
			and pr.is_primary = true
		where pr.profile_id is null
	) then
		raise exception 'Cannot drop legacy profile role flags: some profiles are missing a primary profile_roles row.';
	end if;
end
$$;

update public.profiles p
set role_id = pr.role_id
from public.profile_roles pr
where pr.profile_id = p.id
	and pr.is_primary = true
	and p.role_id is distinct from pr.role_id;

drop policy if exists "Admins can create public announcements" on public.notifications;

create policy "Admins can create public announcements"
on public.notifications
as permissive
for insert
to public
with check (
	exists (
		select 1
		from public.profile_roles pr
		join public.roles r on r.id = pr.role_id
		where pr.profile_id = auth.uid()
			and r.key = 'admin'
	)
);

drop trigger if exists trg_profiles_sync_flags_from_role on public.profiles;
drop function if exists public.sync_profile_flags_from_role();

alter table public.profiles
	drop column if exists is_medical_staff,
	drop column if exists is_volunteer,
	drop column if exists is_driver,
	drop column if exists is_admin;

