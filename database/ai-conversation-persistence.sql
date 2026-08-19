-- ============================================================
-- LAKUVO / AICommerceOS
-- AI Assistant Conversation Persistence
-- ============================================================
--
-- Purpose:
--   Persist user-owned AI Assistant conversations and messages.
--
-- Important:
--   This is conversation history only.
--   It is NOT long-term AI memory.
--
-- Ownership:
--   organization_id + user_id
--
-- Update behavior:
--   updated_at and last_message_at are maintained explicitly
--   by the application API.
--
-- ============================================================


-- ============================================================
-- 1. CONVERSATIONS
-- ============================================================

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  title text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),

  archived_at timestamptz,

  constraint ai_conversations_title_not_blank
    check (
      length(btrim(title)) > 0
    ),

  constraint ai_conversations_title_length
    check (
      length(title) <= 120
    ),

  constraint ai_conversations_identity_unique
    unique (
      id,
      organization_id,
      user_id
    )
);


-- ============================================================
-- 2. CONVERSATION MESSAGES
-- ============================================================

create table if not exists public.ai_conversation_messages (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid not null,

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role text not null,

  content text not null,

  created_at timestamptz not null default now(),

  constraint ai_conversation_messages_conversation_fkey
    foreign key (
      conversation_id,
      organization_id,
      user_id
    )
    references public.ai_conversations (
      id,
      organization_id,
      user_id
    )
    on delete cascade,

  constraint ai_conversation_messages_role_valid
    check (
      role in (
        'user',
        'assistant'
      )
    ),

  constraint ai_conversation_messages_content_not_blank
    check (
      length(btrim(content)) > 0
    ),

  constraint ai_conversation_messages_content_length
    check (
      length(content) <= 20000
    )
);


-- ============================================================
-- 3. INDEXES
-- ============================================================

create index if not exists
  ai_conversations_owner_recent_idx
on public.ai_conversations (
  organization_id,
  user_id,
  archived_at,
  last_message_at desc
);


create index if not exists
  ai_conversation_messages_conversation_created_idx
on public.ai_conversation_messages (
  conversation_id,
  created_at,
  id
);


create index if not exists
  ai_conversation_messages_owner_created_idx
on public.ai_conversation_messages (
  organization_id,
  user_id,
  created_at desc
);


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.ai_conversations
  enable row level security;

alter table public.ai_conversation_messages
  enable row level security;


-- ============================================================
-- 5. CONVERSATION POLICIES
-- ============================================================

drop policy if exists
  ai_conversations_select_own
on public.ai_conversations;

create policy
  ai_conversations_select_own
on public.ai_conversations
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_organization_member(
    organization_id
  )
);


drop policy if exists
  ai_conversations_insert_own
on public.ai_conversations;

create policy
  ai_conversations_insert_own
on public.ai_conversations
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_organization_member(
    organization_id
  )
);


drop policy if exists
  ai_conversations_update_own
on public.ai_conversations;

create policy
  ai_conversations_update_own
on public.ai_conversations
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_organization_member(
    organization_id
  )
)
with check (
  user_id = auth.uid()
  and public.is_organization_member(
    organization_id
  )
);


-- No DELETE policy for conversations.
-- "Clear conversation" will start/archive conversations
-- instead of permanently deleting history.


-- ============================================================
-- 6. MESSAGE POLICIES
-- ============================================================

drop policy if exists
  ai_conversation_messages_select_own
on public.ai_conversation_messages;

create policy
  ai_conversation_messages_select_own
on public.ai_conversation_messages
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_organization_member(
    organization_id
  )
);


drop policy if exists
  ai_conversation_messages_insert_own
on public.ai_conversation_messages;

create policy
  ai_conversation_messages_insert_own
on public.ai_conversation_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_organization_member(
    organization_id
  )
  and exists (
    select 1
    from public.ai_conversations c
    where c.id =
      ai_conversation_messages.conversation_id
      and c.organization_id =
        ai_conversation_messages.organization_id
      and c.user_id =
        ai_conversation_messages.user_id
      and c.user_id = auth.uid()
      and c.archived_at is null
  )
);


-- Messages are append-only for the MVP.
-- No UPDATE or DELETE policies are intentionally created.


-- ============================================================
-- 7. PRIVILEGES
-- ============================================================

revoke all
on table public.ai_conversations
from anon;

revoke all
on table public.ai_conversation_messages
from anon;


grant select, insert
on table public.ai_conversations
to authenticated;

grant update (
  title,
  updated_at,
  last_message_at,
  archived_at
)
on table public.ai_conversations
to authenticated;


grant select, insert
on table public.ai_conversation_messages
to authenticated;


-- ============================================================
-- END
-- ============================================================