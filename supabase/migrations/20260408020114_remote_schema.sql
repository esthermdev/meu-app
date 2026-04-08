drop policy "Anyone can read notifications" on "public"."notifications";

drop policy "Anyone can update on notifications" on "public"."notifications";

create policy "Anyone can read notifications"
on "public"."notifications"
as permissive
for select
to public
using (true);


create policy "Anyone can update on notifications"
on "public"."notifications"
as permissive
for update
to public
using (true);



