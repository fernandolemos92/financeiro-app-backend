-- Migration: Fix planned_amounts numeric type for larger values
-- Description: Increase numeric precision to support larger amounts
-- Created: 2026-04-14
-- Version: 20260414000008

alter table planned_amounts
  alter column debt type numeric(15,2),
  alter column cost_of_living type numeric(15,2),
  alter column pleasure type numeric(15,2),
  alter column application type numeric(15,2);
