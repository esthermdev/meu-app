drop policy "Allow anonymous token registration" on "public"."anonymous_tokens";

drop policy "Allow anonymous token updates" on "public"."anonymous_tokens";

drop policy "Allow deletion of anonymous token" on "public"."anonymous_tokens";

drop policy "Public access to insert to cart_requests" on "public"."cart_requests";

drop policy "Public access to read cart_requests" on "public"."cart_requests";

drop policy "Public access to update cart_requests" on "public"."cart_requests";

drop policy "Public read access on datetime" on "public"."datetime";

drop policy "Update datetime for games" on "public"."datetime";

drop policy "Public access to insert to feedback" on "public"."feedback";

drop policy "Users can read feedback" on "public"."feedback";

drop policy "Public access to insert into games" on "public"."games";

drop policy "Public access to update games" on "public"."games";

drop policy "Public read access on games" on "public"."games";

drop policy "Enable delete for users on medical_requests" on "public"."medical_requests";

drop policy "Public access to insert to medical_requests" on "public"."medical_requests";

drop policy "Public access to read medical_requests" on "public"."medical_requests";

drop policy "Public access to update medical_requests" on "public"."medical_requests";

drop policy "Users can mark notifications as read" on "public"."notification_read_status";

drop policy "Users can read their own read statuses" on "public"."notification_read_status";

drop policy "Admins can create public announcements" on "public"."notifications";

drop policy "Enable read access for all users" on "public"."notifications";

drop policy "Users can update their own notifications" on "public"."notifications";

drop policy "Public can read profile roles" on "public"."profile_roles";

drop policy "Public profiles are viewable by everyone." on "public"."profiles";

drop policy "Users can delete their own profile." on "public"."profiles";

drop policy "Users can insert their own profile." on "public"."profiles";

drop policy "Users can update own profile." on "public"."profiles";

drop policy "Authenticated users can read roles" on "public"."roles";

drop policy "Public access to delete from water_requests" on "public"."water_requests";

drop policy "Public access to insert into water_requests" on "public"."water_requests";

drop policy "Public access to update water_requests" on "public"."water_requests";

drop policy "Public read access on water_requests" on "public"."water_requests";

alter table "public"."notifications" drop column "is_read";

create policy "Anyone can delete on anonymous_tokens"
on "public"."anonymous_tokens"
as permissive
for delete
to anon, authenticated
using (true);


create policy "Anyone can insert on anonymous_tokens"
on "public"."anonymous_tokens"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can update on anonymous_tokens"
on "public"."anonymous_tokens"
as permissive
for update
to anon, authenticated
using (true)
with check (true);


create policy "Anyone can insert on cart_requests"
on "public"."cart_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read on cart_requests"
on "public"."cart_requests"
as permissive
for select
to authenticated, anon
using (true);


create policy "Drivers and admins can delete on cart_requests"
on "public"."cart_requests"
as permissive
for delete
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profile_roles pr
  WHERE ((pr.profile_id = ( SELECT auth.uid() AS uid)) AND (pr.role_id = ANY (ARRAY[2, 4])))))));


create policy "Drivers and admins can update on cart_requests"
on "public"."cart_requests"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profile_roles pr
  WHERE ((pr.profile_id = ( SELECT auth.uid() AS uid)) AND (pr.role_id = ANY (ARRAY[2, 4])))))));


create policy "All administrative users can update on datetime"
on "public"."datetime"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT COALESCE((profiles.role_id)::integer, 0) AS "coalesce"
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) <> 1)));


create policy "Anyone can read on datetime"
on "public"."datetime"
as permissive
for select
to public
using (true);


create policy "Anyone can insert on feedback"
on "public"."feedback"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Authenticated users can read on feedback"
on "public"."feedback"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role_id = 2)))));


create policy "All administrative users can insert on games"
on "public"."games"
as permissive
for insert
to authenticated
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT COALESCE((profiles.role_id)::integer, 0) AS "coalesce"
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) <> 1)));


create policy "Anyone can read on games"
on "public"."games"
as permissive
for select
to anon, authenticated
using (true);


create policy "Authenticated users can update on games"
on "public"."games"
as permissive
for update
to authenticated
using (true);


create policy "Anyone can insert on medical_requests"
on "public"."medical_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read on medical_requests"
on "public"."medical_requests"
as permissive
for select
to authenticated, anon
using (true);


create policy "Trainers and admins can delete on medical_requests"
on "public"."medical_requests"
as permissive
for delete
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profile_roles pr
  WHERE ((pr.profile_id = ( SELECT auth.uid() AS uid)) AND (pr.role_id = ANY (ARRAY[2, 3])))))));


create policy "Trainers and admins can update on medical_requests"
on "public"."medical_requests"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profile_roles pr
  WHERE ((pr.profile_id = ( SELECT auth.uid() AS uid)) AND (pr.role_id = ANY (ARRAY[2, 3])))))));


create policy "Anyone can insert on notification_read_status"
on "public"."notification_read_status"
as permissive
for insert
to anon, authenticated
with check ((auth.uid() = user_id));


create policy "Anyone can read on notification_read_status"
on "public"."notification_read_status"
as permissive
for select
to anon, authenticated
using ((auth.uid() = user_id));


create policy "Admins can insert on notifications"
on "public"."notifications"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text)))));


create policy "Anyone can read on notifications"
on "public"."notifications"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can update on notifications"
on "public"."notifications"
as permissive
for update
to anon, authenticated
using ((auth.uid() = user_id));


create policy "Anyone can read on profile_roles"
on "public"."profile_roles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read on profiles"
on "public"."profiles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Authenticated users can delete on profiles"
on "public"."profiles"
as permissive
for delete
to authenticated
using ((auth.uid() = id));


create policy "Authenticated users can insert on profiles"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (true);


create policy "Authenticated users can update on profiles"
on "public"."profiles"
as permissive
for update
to authenticated
using (true);


create policy "Public read access to roles"
on "public"."roles"
as permissive
for select
to public
using (true);


create policy "Anyone can insert on water_requests"
on "public"."water_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read on water_requests"
on "public"."water_requests"
as permissive
for select
to authenticated, anon
using (true);


create policy "Volunteers and admins can delete on water_requests"
on "public"."water_requests"
as permissive
for delete
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profile_roles pr
  WHERE ((pr.profile_id = ( SELECT auth.uid() AS uid)) AND (pr.role_id = ANY (ARRAY[2, 5])))))));


create policy "Volunteers and admins can update on water_requests"
on "public"."water_requests"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profile_roles pr
  WHERE ((pr.profile_id = ( SELECT auth.uid() AS uid)) AND (pr.role_id = ANY (ARRAY[2, 5])))))));



