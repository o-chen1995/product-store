alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_user_id_idx on public.orders (user_id);

drop policy if exists "Users can read their own orders" on public.orders;
create policy "Users can read their own orders"
on public.orders for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their own order items" on public.order_items;
create policy "Users can read their own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);
