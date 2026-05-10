# CMS Phase 1: Concepts

Phase 1 makes Concepts the first Supabase-backed, statically generated content type.

## Files

- `supabase/schema.sql`: `concepts` table definition.
- `supabase/policies.sql`: public read for published concepts and authenticated write access.
- `supabase/seed.sql`: initial rows matching the current site.
- `content/seed/concepts.json`: local fallback data for generation without Supabase.
- `src/templates/concept.html`: detail page template.
- `src/generators/build-concepts.js`: generates `concepts/*.html` and the Concepts section in `index.html`.

## Markdown Shape

Each concept keeps its card summary and detail body in one Markdown field:

```md
## Summary

Card summary text.

## Body

Detail page body text.
```

Summary resolution order:

1. `summary_override`
2. `## Summary` section in `body_markdown`
3. Fallback excerpt from the beginning of `body_markdown`

## Local Build

```sh
npm run build:concepts
```

Without `.env`, the generator uses `content/seed/concepts.json`.

With `.env`, the generator reads published Concepts from Supabase:

```sh
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not use a secret key in `.env` for this static generator. The publishable key is enough because Row Level Security only exposes published rows.

## Admin UI

`admin/index.html` is a small browser CMS for Concepts. It uses Supabase Auth, so create a user in Supabase Auth and add that user's `id` and `email` to `public.admin_users`.

The page can be opened directly from the filesystem:

```text
/Users/yasuaki/R/ProfilePage/admin/index.html
```

Example:

```sql
insert into public.admin_users (user_id, email)
select id, email
from auth.users
where email = 'you@example.com';
```

After saving in the CMS, run:

```sh
npm run build:concepts
```

This regenerates `index.html` and `concepts/*.html` from Supabase.

## Markdown Import

For initial drafting, place Markdown files in:

```text
content/concepts/
```

Use `_template.md` as the format:

```md
---
slug: style-ontology
title: スタイルの存在論
sort_order: 10
is_published: true
summary_override:
---

## Summary

Card summary.

## Body

Detail body.
```

Then generate an upsert SQL file:

```sh
npm run concepts:md-to-sql
```

Paste the generated `supabase/concepts-from-md.sql` into Supabase SQL Editor and run it. After that, regenerate the public pages:

```sh
npm run build:concepts
```
