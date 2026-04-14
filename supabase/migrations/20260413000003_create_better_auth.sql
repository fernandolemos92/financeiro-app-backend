-- Migration: Create Better Auth tables
-- Generated using: npx auth@latest generate --output sql
-- Version: 20260413000003

-- Users table
CREATE TABLE "user" (
    "id" text NOT NULL PRIMARY KEY,
    "name" text,
    "email" text NOT NULL UNIQUE,
    "email_verified" boolean DEFAULT false NOT NULL,
    "image" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Sessions table
CREATE TABLE "session" (
    "id" text NOT NULL PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "expires_at" timestamp with time zone NOT NULL,
    "token" text NOT NULL UNIQUE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "ip_address" text,
    "user_agent" text
);

-- Indexes
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");

-- Account table (for OAuth)
CREATE TABLE "account" (
    "id" text NOT NULL PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp with time zone,
    "refresh_token_expires_at" timestamp with time zone,
    "scope" text,
    "password" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "account_user_id_idx" ON "account" ("user_id");

-- Verification table (for magic links, etc)
CREATE TABLE "verification" (
    "id" text NOT NULL PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");