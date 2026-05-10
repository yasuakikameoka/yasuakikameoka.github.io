create table if not exists concepts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  related_titles text[] not null default '{}',
  body_markdown text not null default '',
  summary_override text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists concepts_published_order_idx
  on concepts (is_published, sort_order, published_at);
