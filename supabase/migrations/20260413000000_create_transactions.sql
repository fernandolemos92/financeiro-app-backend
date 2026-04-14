-- Migration: Create transactions table
-- Description: Initial transactions schema with enums
-- Created: 2026-04-13
-- Version: 20260413000000

create type transaction_type   as enum ('income', 'expense');
create type income_type        as enum ('fixed', 'variable', 'oscillating');
create type expense_nature     as enum ('debt', 'cost_of_living', 'pleasure', 'application');
create type frequency          as enum ('monthly', 'annual', 'occasional');
create type planning_status    as enum ('planned', 'realized');

create table transactions (
  id               uuid            primary key default gen_random_uuid(),
  type             transaction_type not null,
  amount           numeric(12, 2)  not null check (amount > 0),
  category         text            not null,
  subcategory      text,
  description      text,
  date             date            not null,
  created_at       timestamptz     not null default now(),
  income_type      income_type,
  expense_nature   expense_nature,
  frequency        frequency,
  planning_status  planning_status not null default 'realized',

  constraint chk_income_fields check (
    (type = 'income' and income_type is not null and expense_nature is null)
    or
    (type = 'expense' and expense_nature is not null and income_type is null)
  )
);

create index idx_transactions_date on transactions (date);
