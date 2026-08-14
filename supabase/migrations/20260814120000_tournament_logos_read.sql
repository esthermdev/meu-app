-- The app resolves the current tournament logo at runtime by listing the
-- `tournament_logos` bucket and taking the newest image, so the artwork can be swapped
-- between tournaments without shipping a build. The bucket is already public (downloads
-- work anonymously), but `storage.from(...).list()` goes through the API and still needs
-- a select policy on storage.objects.
insert into storage.buckets (id, name, public)
values ('tournament_logos', 'tournament_logos', true)
on conflict (id) do nothing;

create policy "Anyone can view tournament logos"
  on storage.objects for select
  using (bucket_id = 'tournament_logos');
