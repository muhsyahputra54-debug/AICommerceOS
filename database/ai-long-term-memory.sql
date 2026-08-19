-- ============================================================
-- LAKUVO AI Long-Term Memory
-- ============================================================
--
-- Purpose:
--   Selective long-term memory for the AI Assistant.
--
-- Important:
--   This is NOT conversation history.
--   Conversation history remains in:
--     public.ai_conversations
--     public.ai_conversation_messages
--
-- Initial memory policy:
--   - explicit user memories only; or
--   - memories explicitly confirmed by the user.
--
-- Do not automatically store:
--   - temporary metrics
--   - customer PII
--   - passwords, tokens, credentials, or secrets
--   - unverified AI assumptions
--   - every conversation message
-- ============================================================

begin;

create table if not exists public.ai_memories (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  memory_type text not null,

  memory_key text not null,

  content text not null,

  source_kind text not null
    default 'explicit_user',

  source_conversation_id uuid
    references public.ai_conversations(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  last_used_at timestamptz,

  archived_at timestamptz,

  constraint ai_memories_type_check
    check (
      memory_type in (
        'preference',
        'goal',
        'constraint',
        'business_context'
      )
    ),

  constraint ai_memories_key_nonblank_check
    check (
      btrim(memory_key) <> ''
    ),

  constraint ai_memories_key_length_check
    check (
      char_length(memory_key) <= 120
    ),

  constraint ai_memories_content_nonblank_check
    check (
      btrim(content) <> ''
    ),

  constraint ai_memories_content_length_check
    check (
      char_length(content) <= 2000
    ),

  constraint ai_memories_source_kind_check
    check (
      source_kind in (
        'explicit_user',
        'user_confirmed'
      )
    )
);

-- One active memory for one canonical key/type.
-- Archiving an older memory allows a replacement to be created.
create unique index if not exists
  ai_memories_owner_active_key_idx
on public.ai_memories (
  organization_id,
  user_id,
  memory_type,
  memory_key
)
where archived_at is null;

create index if not exists
  ai_memories_owner_recent_idx
on public.ai_memories (
  organization_id,
  user_id,
  archived_at,
  updated_at desc
);

create index if not exists
  ai_memories_owner_type_idx
on public.ai_memories (
  organization_id,
  user_id,
  memory_type,
  archived_at
);

alter table public.ai_memories
  enable row level security;

-- ============================================================
-- RLS
-- ============================================================

drop policy if exists
  ai_memories_select_own
on public.ai_memories;

create policy
  ai_memories_select_own
on public.ai_memories
for select
to authenticated
using (
  ai_memories.user_id = auth.uid()
  and public.is_organization_member(
    ai_memories.organization_id
  )
);

drop policy if exists
  ai_memories_insert_own
on public.ai_memories;

create policy
  ai_memories_insert_own
on public.ai_memories
for insert
to authenticated
with check (
  ai_memories.user_id = auth.uid()

  and public.is_organization_member(
    ai_memories.organization_id
  )

  and (
    ai_memories.source_conversation_id
      is null

    or exists (
      select 1
      from public.ai_conversations c
      where c.id =
        ai_memories.source_conversation_id

        and c.organization_id =
          ai_memories.organization_id

        and c.user_id =
          ai_memories.user_id

        and c.user_id =
          auth.uid()
    )
  )
);

drop policy if exists
  ai_memories_update_own
on public.ai_memories;

create policy
  ai_memories_update_own
on public.ai_memories
for update
to authenticated
using (
  ai_memories.user_id = auth.uid()

  and public.is_organization_member(
    ai_memories.organization_id
  )
)
with check (
  ai_memories.user_id = auth.uid()

  and public.is_organization_member(
    ai_memories.organization_id
  )

  and (
    ai_memories.source_conversation_id
      is null

    or exists (
      select 1
      from public.ai_conversations c
      where c.id =
        ai_memories.source_conversation_id

        and c.organization_id =
          ai_memories.organization_id

        and c.user_id =
          ai_memories.user_id

        and c.user_id =
          auth.uid()
    )
  )
);

drop policy if exists
  ai_memories_delete_own
on public.ai_memories;

create policy
  ai_memories_delete_own
on public.ai_memories
for delete
to authenticated
using (
  ai_memories.user_id = auth.uid()

  and public.is_organization_member(
    ai_memories.organization_id
  )
);

-- ============================================================
-- PRIVILEGES
-- ============================================================

revoke all
on table public.ai_memories
from anon;

revoke all
on table public.ai_memories
from authenticated;

grant select
on table public.ai_memories
to authenticated;

grant insert (
  organization_id,
  user_id,
  memory_type,
  memory_key,
  content,
  source_kind,
  source_conversation_id
)
on public.ai_memories
to authenticated;

grant update (
  memory_type,
  memory_key,
  content,
  source_kind,
  source_conversation_id,
  updated_at,
  last_used_at,
  archived_at
)
on public.ai_memories
to authenticated;

grant delete
on table public.ai_memories
to authenticated;

commit;