alter table public.orders
  add column if not exists admin_note text;

create index if not exists orders_admin_note_idx
  on public.orders (admin_note);

alter table public.orders enable row level security;

drop policy if exists "Admins can read all orders" on public.orders;
create policy "Admins can read all orders"
on public.orders for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
on public.orders for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
