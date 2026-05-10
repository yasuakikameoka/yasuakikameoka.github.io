alter table concepts enable row level security;

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

drop policy if exists "Public can read published concepts" on concepts;
create policy "Public can read published concepts"
  on concepts
  for select
  using (is_published = true);

drop policy if exists "Authenticated users can manage concepts" on concepts;
create policy "Authenticated users can manage concepts"
  on concepts
  for all
  to authenticated
  using (exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  ));

drop policy if exists "Admins can read admin users" on admin_users;
create policy "Admins can read admin users"
  on admin_users
  for select
  to authenticated
  using (user_id = auth.uid());
