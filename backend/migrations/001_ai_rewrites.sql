create table public.ai_rewrite_subscriptions (
    user_id uuid primary key references auth.users(id) on delete cascade,
    plan text not null default 'free' check (plan in ('free', 'pro'))
);

create table public.ai_rewrite_usage (
    user_id uuid not null references auth.users(id) on delete cascade,
    period_start date not null,
    used integer not null default 0 check (used >= 0),
    primary key (user_id, period_start)
);

alter table public.ai_rewrite_subscriptions enable row level security;
alter table public.ai_rewrite_usage enable row level security;
revoke all on public.ai_rewrite_subscriptions, public.ai_rewrite_usage from anon, authenticated;
grant all on public.ai_rewrite_subscriptions, public.ai_rewrite_usage to service_role;
