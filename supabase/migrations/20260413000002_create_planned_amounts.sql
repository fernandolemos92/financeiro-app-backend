-- Migration: Create planned_amounts table
-- Description: Monthly expense category planning (debt, cost_of_living, pleasure, application)
-- Created: 2026-04-13
-- Version: 20260413000002

create table planned_amounts (
  id             uuid          primary key default gen_random_uuid(),
  month          text          not null unique check (month ~ '^\d{4}-\d{2}$'),
  debt           numeric(12,2) not null default 0 check (debt >= 0),
  cost_of_living numeric(12,2) not null default 0 check (cost_of_living >= 0),
  pleasure       numeric(12,2) not null default 0 check (pleasure >= 0),
  application    numeric(12,2) not null default 0 check (application >= 0),
  updated_at     timestamptz   not null default now()
);

create index idx_planned_amounts_month on planned_amounts (month);
