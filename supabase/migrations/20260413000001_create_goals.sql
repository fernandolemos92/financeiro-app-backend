-- Migration: Create goals table
-- Description: Goals with embedded contributions array and auto-completion
-- Created: 2026-04-13
-- Version: 20260413000001

create table goals (
  id               uuid          primary key default gen_random_uuid(),
  name             text          not null check (length(name) > 0),
  target_amount    numeric(12,2) not null check (target_amount > 0),
  current_amount   numeric(12,2) not null default 0 check (current_amount >= 0),
  deadline         date          not null,
  status           text          not null default 'active'
                     check (status in ('active', 'completed', 'manually_closed')),
  created_at       timestamptz   not null default now(),
  completed_at     timestamptz,
  contributions    jsonb         not null default '[]'::jsonb
);

create index idx_goals_status on goals (status);
create index idx_goals_created_at on goals (created_at);
