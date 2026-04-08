drop policy "Admins see all conversations" on "public"."conversations";

drop policy "Admins update conversations" on "public"."conversations";

drop policy "Users create own conversation" on "public"."conversations";

drop policy "Users see own conversation" on "public"."conversations";

drop policy "Users update own conversation" on "public"."conversations";

drop policy "Admins delete any messages" on "public"."messages";

drop policy "Admins see all messages" on "public"."messages";

drop policy "Admins send in any conversation" on "public"."messages";

drop policy "Users delete own messages" on "public"."messages";

drop policy "Users see own messages" on "public"."messages";

drop policy "Users send in own conversation" on "public"."messages";

create policy "Admins can delete conversations"
on "public"."conversations"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text)))));


create policy "Admins see all conversations"
on "public"."conversations"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text)))));


create policy "Admins update conversations"
on "public"."conversations"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text)))));


create policy "Users create own conversation"
on "public"."conversations"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users see own conversation"
on "public"."conversations"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users update own conversation"
on "public"."conversations"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


create policy "Admins delete any messages"
on "public"."messages"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text)))));


create policy "Admins see all messages"
on "public"."messages"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text)))));


create policy "Admins send in any conversation"
on "public"."messages"
as permissive
for insert
to authenticated
with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM (profile_roles pr
     JOIN roles r ON ((r.id = pr.role_id)))
  WHERE ((pr.profile_id = auth.uid()) AND (r.key = 'admin'::text))))));


create policy "Users delete own messages"
on "public"."messages"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = auth.uid())))));


create policy "Users see own messages"
on "public"."messages"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = auth.uid())))));


create policy "Users send in own conversation"
on "public"."messages"
as permissive
for insert
to authenticated
with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = auth.uid()))))));



