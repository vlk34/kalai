create table public.ai_subscriptions (
    user_id uuid primary key references auth.users(id) on delete cascade,
    plan text not null default 'free' check (plan in ('free', 'pro'))
);

create table public.ai_credit_usage (
    user_id uuid not null references auth.users(id) on delete cascade,
    period_start date not null,
    used integer not null default 0 check (used >= 0),
    primary key (user_id, period_start)
);

create table public.ai_analyses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    description text not null,
    nutritional_analysis jsonb not null,
    created_at timestamptz not null default now()
);

alter table public.ai_subscriptions enable row level security;
alter table public.ai_credit_usage enable row level security;
alter table public.ai_analyses enable row level security;

revoke all on public.ai_subscriptions, public.ai_credit_usage, public.ai_analyses from anon, authenticated;
grant all on public.ai_subscriptions, public.ai_credit_usage, public.ai_analyses to service_role;
