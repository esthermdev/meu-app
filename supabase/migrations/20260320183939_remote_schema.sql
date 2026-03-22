drop policy "Anyone can insert on anonymous_tokens" on "public"."anonymous_tokens";

drop policy "Anyone can insert on cart_requests" on "public"."cart_requests";

drop policy "Anyone can read on cart_requests" on "public"."cart_requests";

drop policy "Anyone can read on datetime" on "public"."datetime";

drop policy "Public access to deletion tokens" on "public"."deletion_tokens";

drop policy "Public read access to divisions" on "public"."divisions";

drop policy "Public read access to faqs" on "public"."faq";

drop policy "Users can delete their own favorites" on "public"."favorite_teams";

drop policy "Users can insert their own favorites" on "public"."favorite_teams";

drop policy "Users can view their own favorites" on "public"."favorite_teams";

drop policy "Anyone can insert on feedback" on "public"."feedback";

drop policy "Authenticated users can read on feedback" on "public"."feedback";

drop policy "Public access to update fields" on "public"."fields";

drop policy "Public read access on fields" on "public"."fields";

drop policy "All administrative users can insert on games" on "public"."games";

drop policy "Anyone can read on games" on "public"."games";

drop policy "Public read access to schedule options" on "public"."gametypes";

drop policy "Anyone can insert on medical_requests" on "public"."medical_requests";

drop policy "Anyone can read on medical_requests" on "public"."medical_requests";

drop policy "Anyone can insert on notification_read_status" on "public"."notification_read_status";

drop policy "Anyone can read on notification_read_status" on "public"."notification_read_status";

drop policy "Admins can insert on notifications" on "public"."notifications";

drop policy "Anyone can read on notifications" on "public"."notifications";

drop policy "Public can read permissions" on "public"."permissions";

drop policy "Public read access on pools" on "public"."pools";

drop policy "Anyone can read on profile_roles" on "public"."profile_roles";

drop policy "Anyone can read on profiles" on "public"."profiles";

drop policy "Authenticated users can insert on profiles" on "public"."profiles";

drop policy "Public access to update rankings" on "public"."rankings";

drop policy "Public read access on rankings" on "public"."rankings";

drop policy "Public access to restaurants" on "public"."restaurants";

drop policy "Public can read role permissions" on "public"."role_permissions";

drop policy "Public read access to roles" on "public"."roles";

drop policy "Public read access on rounds" on "public"."rounds";

drop policy "Player access to update scores" on "public"."scores";

drop policy "Public read access on scores" on "public"."scores";

drop policy "Public read access on teams" on "public"."teams";

drop policy "Public access to vendors" on "public"."vendors";

drop policy "Public read access on volunteers" on "public"."volunteers";

drop policy "Anyone can insert on water_requests" on "public"."water_requests";

drop policy "Anyone can read on water_requests" on "public"."water_requests";

revoke delete on table "public"."deletion_tokens" from "anon";

revoke insert on table "public"."deletion_tokens" from "anon";

revoke references on table "public"."deletion_tokens" from "anon";

revoke select on table "public"."deletion_tokens" from "anon";

revoke trigger on table "public"."deletion_tokens" from "anon";

revoke truncate on table "public"."deletion_tokens" from "anon";

revoke update on table "public"."deletion_tokens" from "anon";

revoke delete on table "public"."deletion_tokens" from "authenticated";

revoke insert on table "public"."deletion_tokens" from "authenticated";

revoke references on table "public"."deletion_tokens" from "authenticated";

revoke select on table "public"."deletion_tokens" from "authenticated";

revoke trigger on table "public"."deletion_tokens" from "authenticated";

revoke truncate on table "public"."deletion_tokens" from "authenticated";

revoke update on table "public"."deletion_tokens" from "authenticated";

revoke delete on table "public"."deletion_tokens" from "service_role";

revoke insert on table "public"."deletion_tokens" from "service_role";

revoke references on table "public"."deletion_tokens" from "service_role";

revoke select on table "public"."deletion_tokens" from "service_role";

revoke trigger on table "public"."deletion_tokens" from "service_role";

revoke truncate on table "public"."deletion_tokens" from "service_role";

revoke update on table "public"."deletion_tokens" from "service_role";

alter table "public"."deletion_tokens" drop constraint "deletion_tokens_token_key";

alter table "public"."deletion_tokens" drop constraint "fk_user";

drop function if exists "public"."create_deletion_tokens_table_if_not_exists"();

alter table "public"."deletion_tokens" drop constraint "deletion_tokens_pkey";

drop index if exists "public"."deletion_tokens_pkey";

drop index if exists "public"."deletion_tokens_token_key";

drop table "public"."deletion_tokens";

alter table "public"."notification_read_status" drop column "device_id";

alter table "public"."volunteers" drop column "email";

drop sequence if exists "public"."deletion_tokens_id_seq";

create policy "Anyone can insert to anonymous_tokens"
on "public"."anonymous_tokens"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can insert to cart_requests"
on "public"."cart_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read cart_requests"
on "public"."cart_requests"
as permissive
for select
to authenticated, anon
using (true);


create policy "Anyone can read datetime"
on "public"."datetime"
as permissive
for select
to public
using (true);


create policy "Anyone can read divisions"
on "public"."divisions"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read faqs"
on "public"."faq"
as permissive
for select
to public
using (true);


create policy "Authenticated users can delete on favorite_teams"
on "public"."favorite_teams"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Authenticated users can insert to favorite_teams"
on "public"."favorite_teams"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Authenticated users can read favorite_teams"
on "public"."favorite_teams"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Admins can read feedback"
on "public"."feedback"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role_id = 2)))));


create policy "Anyone can insert to feedback"
on "public"."feedback"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read fields"
on "public"."fields"
as permissive
for select
to authenticated, anon
using (true);


create policy "Authenticated users can update on fields"
on "public"."fields"
as permissive
for update
to authenticated
using (true);


create policy "All administrative users can insert to games"
on "public"."games"
as permissive
for insert
to authenticated
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT COALESCE((profiles.role_id)::integer, 0) AS "coalesce"
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) <> 1)));


create policy "Anyone can read games"
on "public"."games"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read gametypes"
on "public"."gametypes"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can insert to medical_requests"
on "public"."medical_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read medical_requests"
on "public"."medical_requests"
as permissive
for select
to authenticated, anon
using (true);


create policy "Anyone can read notification_read_status"
on "public"."notification_read_status"
as permissive
for select
to anon, authenticated
using ((auth.uid() = user_id));


create policy "Authenticated users can insert to notification_read_status"
on "public"."notification_read_status"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Admins can insert to notifications"
on "public"."notifications"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text)))));


create policy "Anyone can read notifications"
on "public"."notifications"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read permissions"
on "public"."permissions"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read pools"
on "public"."pools"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read profile_roles"
on "public"."profile_roles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read profiles"
on "public"."profiles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Authenticated users can insert to profiles"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (true);


create policy "All administrative users can update rankings"
on "public"."rankings"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT COALESCE((profiles.role_id)::integer, 0) AS "coalesce"
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) <> 1)));


create policy "Anyone can read rankings"
on "public"."rankings"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read restaurants"
on "public"."restaurants"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read role permissions"
on "public"."role_permissions"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read roles"
on "public"."roles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read rounds"
on "public"."rounds"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read scores"
on "public"."scores"
as permissive
for select
to anon, authenticated
using (true);


create policy "Authenticated users can update scores"
on "public"."scores"
as permissive
for update
to authenticated
using (true);


create policy "Anyone can read teams"
on "public"."teams"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read vendors"
on "public"."vendors"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read volunteers"
on "public"."volunteers"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can insert to water_requests"
on "public"."water_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read water_requests"
on "public"."water_requests"
as permissive
for select
to authenticated, anon
using (true);



