# Homebase Project Reference

## Location

**Repo:** `C:\Users\Tobey\homebase`
**Deploy:** `homebase-btb.vercel.app`

## What It Is

Internal task management app for BTB team. Single-page command center with:
- Task hierarchy (Milestone > Project > Task)
- Due date filtering (Daily/Weekly/Milestone)
- AI chatbot (HOMEBOT) for task queries and EOD reports
- Task extraction from text (including Tagalog > English)
- Approval queue for suggested assignments

## Tech Stack

- Next.js 14 (App Router)
- Tailwind + shadcn/ui (Swiss Terminal theme)
- Supabase (PostgreSQL + Auth)
- Gemini 2.5 Flash for AI

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main command center |
| `app/api/tasks/route.ts` | Task CRUD with hierarchy |
| `app/api/eod/route.ts` | Chatbot endpoint |
| `lib/claude/client.ts` | Gemini API integration |
| `components/eod/eod-chat.tsx` | HOMEBOT chat UI |
| `supabase/schema.sql` | Database schema |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Known Issues

- RLS infinite recursion on users table (disable RLS on users as workaround)
- Must use Gemini 2.5-flash (2.0 has quota issues)

## Working On It

When working on Homebase:
1. cd to `C:\Users\Tobey\homebase`
2. `npm run dev` to start
3. Check this brain folder for context/decisions
