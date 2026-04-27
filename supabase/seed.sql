insert into public.categories (id, slug, name, description, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'bags', 'Bags', 'Everyday carry goods and storage.', 10),
  ('22222222-2222-4222-8222-222222222222', 'workspace', 'Workspace', 'Desk and work setup essentials.', 20),
  ('33333333-3333-4333-8333-333333333333', 'home', 'Home', 'Objects for daily home rituals.', 30),
  ('44444444-4444-4444-8444-444444444444', 'travel', 'Travel', 'Compact travel organization.', 40)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.products (
  id,
  category_id,
  slug,
  name,
  short_description,
  description,
  price,
  compare_at_price,
  stock,
  status,
  highlights,
  badge,
  image_alt,
  accent_from,
  accent_to,
  featured
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'terra-carry-tote',
    'Terra Carry Tote',
    'A structured everyday tote with weather-resistant canvas.',
    'Built for daily errands, commutes, and weekend runs, the Terra Carry Tote keeps essentials organized without feeling bulky.',
    12800,
    null,
    18,
    'active',
    array[
      'Recycled waxed canvas shell',
      'Padded 13-inch laptop sleeve',
      'Interior bottle loop and key clip',
      'Ships in plastic-free packaging'
    ],
    'Best Seller',
    'Minimal canvas tote bag in warm earth tones',
    '#d7a86e',
    '#415f4a',
    true
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '22222222-2222-4222-8222-222222222222',
    'linen-desk-mat',
    'Linen Desk Mat',
    'A soft-touch desk surface for focused workspaces.',
    'The Linen Desk Mat adds a tactile, durable surface to your desk while keeping the visual profile calm and uncluttered.',
    6400,
    null,
    32,
    'active',
    array[
      'Natural linen blend top layer',
      'Non-slip cork backing',
      'Fits keyboard, mouse, and notebook',
      'Easy roll storage'
    ],
    null,
    'Neutral linen desk mat on a clean workspace',
    '#c8d2d1',
    '#677b8a',
    true
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '33333333-3333-4333-8333-333333333333',
    'daily-ceramic-cup',
    'Daily Ceramic Cup',
    'A hand-finished ceramic cup made for daily rituals.',
    'Designed with a comfortable hold and balanced weight, this cup works for morning coffee, evening tea, or a quiet desk companion.',
    3800,
    null,
    25,
    'active',
    array[
      'Dishwasher-safe glazed ceramic',
      'Stackable low-profile form',
      'Holds 320 ml',
      'Subtle hand-finished variation'
    ],
    'New',
    'Hand-finished ceramic cup with a matte glaze',
    '#e6ded1',
    '#9a644b',
    true
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    '44444444-4444-4444-8444-444444444444',
    'modular-travel-pouch',
    'Modular Travel Pouch',
    'Compact storage for cables, cards, and small tools.',
    'A low-profile pouch with flexible dividers, made to keep tech accessories and travel essentials easy to reach.',
    5600,
    null,
    14,
    'active',
    array[
      'Two removable mesh dividers',
      'Water-resistant recycled nylon',
      'Flat base for easy packing',
      'Durable YKK zipper'
    ],
    null,
    'Compact travel pouch with organized internal pockets',
    '#9fb3c8',
    '#313f59',
    false
  )
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  stock = excluded.stock,
  status = excluded.status,
  highlights = excluded.highlights,
  badge = excluded.badge,
  image_alt = excluded.image_alt,
  accent_from = excluded.accent_from,
  accent_to = excluded.accent_to,
  featured = excluded.featured;

insert into public.product_images (product_id, image_url, alt_text, sort_order)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '/mock/terra-carry-tote-primary.png', 'Minimal canvas tote bag in warm earth tones', 10),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '/mock/terra-carry-tote-detail.png', 'Close-up of Terra Carry Tote canvas and handles', 20),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '/mock/linen-desk-mat-primary.png', 'Neutral linen desk mat on a clean workspace', 10),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '/mock/linen-desk-mat-detail.png', 'Texture detail of the linen desk mat', 20),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '/mock/daily-ceramic-cup-primary.png', 'Hand-finished ceramic cup with a matte glaze', 10),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '/mock/daily-ceramic-cup-detail.png', 'Daily Ceramic Cup shown from above', 20),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '/mock/modular-travel-pouch-primary.png', 'Compact travel pouch with organized internal pockets', 10),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '/mock/modular-travel-pouch-detail.png', 'Interior dividers of the Modular Travel Pouch', 20)
on conflict (product_id, sort_order) do update set
  image_url = excluded.image_url,
  alt_text = excluded.alt_text;
