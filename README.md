# Northline Goods

Next.js storefront for a curated product store. The current public preview uses
Supabase for catalog, auth, pending orders, customer order history, and admin
management. Payments are manual: checkout creates a pending order and the team
confirms payment instructions outside the app.

## Local Development

Requirements:

- Node.js compatible with this project
- npm
- Supabase project
- No local Docker required

Install dependencies:

```bash
npm install
```

Create local environment values:

```bash
cp .env.example .env.local
```

Fill `.env.local` with your local Supabase values. Do not commit `.env.local`.

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Required for the current manual payment preview:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Reserved for a future online payment integration. Do not set these for the
manual payment preview unless payment code is intentionally re-enabled:

```bash
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Supabase Setup

Run SQL in the Supabase SQL editor in this order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/add-admin-role.sql`
4. `supabase/add-user-id-to-orders.sql`
5. `supabase/add-admin-note-to-orders.sql`
6. `supabase/add-product-images-bucket.sql`

The `product-images` bucket must be public so storefront product images can
render without signed URLs.

## Admin Account

Create or register the user first, then promote that profile in Supabase:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

If the user existed before `add-admin-role.sql` was applied, create or update
the profile:

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'you@example.com'
on conflict (id) do update
set role = 'admin',
    email = excluded.email;
```

Admin pages call `requireAdmin()` on the server. Non-admin users are redirected
away from `/admin`, and unauthenticated users are redirected to login.

## Manual Payment Mode

Checkout does not complete an online payment. It creates a Supabase order with
`pending` status, stores customer, address, and order item snapshots, then shows
manual payment instructions on the success page.

Admin users can review orders in `/admin/orders`, update order status, and save
internal admin notes after `add-admin-note-to-orders.sql` has been applied.

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Select the Next.js framework preset.
4. Set the production environment variables listed below.
5. Leave Stripe/payment variables blank for the manual payment preview.
6. Deploy.
7. After deployment, set `NEXT_PUBLIC_SITE_URL` to the Vercel production URL and
   redeploy if needed.

Vercel production variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It must only be set as
a server-side environment variable in Vercel.

## Verification

Before deployment:

```bash
npm run lint
npm run build
```

Expected current lint state: no errors. There may be warnings for existing
`<img>` usage where product image optimization has not been migrated to
`next/image`.

Manual smoke test:

1. Browse `/products`.
2. Open a product detail page.
3. Add a product to cart.
4. Submit checkout and confirm the success page says manual payment is pending.
5. Login and review `/account/orders`.
6. Login as admin and review `/admin`, `/admin/products`, and `/admin/orders`.
7. Open an order detail page, update status, and save an admin note.

## Deployment Safety

- `.env*.local` is ignored by Git.
- `.env.example` contains variable names only.
- Supabase keys are read from environment variables.
- Payment keys are reserved for future use and should not be configured for the
  current manual payment preview.
- Do not print, paste, or commit real secrets.
