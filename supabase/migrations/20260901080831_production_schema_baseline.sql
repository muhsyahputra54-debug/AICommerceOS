SET local check_function_bodies = off;

CREATE TABLE "public"."ai_agent_runs" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"   uuid                     NOT NULL,
  "agent_id"          uuid                     NOT NULL,
  "status"            text                     NOT NULL DEFAULT 'running'::text,
  "objective"         text                     NOT NULL,
  "provider_snapshot" text                     NOT NULL,
  "model_snapshot"    text                     NOT NULL,
  "input_context"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "output_data"       jsonb,
  "summary"           text,
  "recommendation"    text,
  "risks"             jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "next_actions"      jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "error_message"     text,
  "created_by"        uuid,
  "started_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at"      timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_agent_runs_actions_array" CHECK ((jsonb_typeof(next_actions) = 'array'::text)),
  CONSTRAINT "ai_agent_runs_id_org_key" UNIQUE (id, organization_id),
  CONSTRAINT "ai_agent_runs_input_object" CHECK ((jsonb_typeof(input_context) = 'object'::text)),
  CONSTRAINT "ai_agent_runs_model_not_blank" CHECK ((length(btrim(model_snapshot)) > 0)),
  CONSTRAINT "ai_agent_runs_objective_not_blank" CHECK ((length(btrim(objective)) > 0)),
  CONSTRAINT "ai_agent_runs_output_object" CHECK (((output_data IS NULL) OR (jsonb_typeof(output_data) = 'object'::text))),
  CONSTRAINT "ai_agent_runs_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_agent_runs_provider_not_blank" CHECK ((length(btrim(provider_snapshot)) > 0)),
  CONSTRAINT "ai_agent_runs_risks_array" CHECK ((jsonb_typeof(risks) = 'array'::text)),
  CONSTRAINT "ai_agent_runs_status_check" CHECK ((status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text])))
);

ALTER TABLE "public"."ai_agent_runs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_agent_steps" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "run_id"          uuid                     NOT NULL,
  "step_number"     integer                  NOT NULL,
  "step_type"       text                     NOT NULL,
  "tool_name"       text,
  "status"          text                     NOT NULL DEFAULT 'completed'::text,
  "input_data"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "output_data"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "error_message"   text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_agent_steps_input_object" CHECK ((jsonb_typeof(input_data) = 'object'::text)),
  CONSTRAINT "ai_agent_steps_number_check" CHECK ((step_number > 0)),
  CONSTRAINT "ai_agent_steps_output_object" CHECK ((jsonb_typeof(output_data) = 'object'::text)),
  CONSTRAINT "ai_agent_steps_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_agent_steps_run_number_key" UNIQUE (run_id, step_number),
  CONSTRAINT "ai_agent_steps_status_check" CHECK ((status = ANY (ARRAY['completed'::text, 'failed'::text]))),
  CONSTRAINT "ai_agent_steps_type_check" CHECK ((step_type = ANY (ARRAY['context'::text, 'analysis'::text, 'recommendation'::text, 'system'::text])))
);

ALTER TABLE "public"."ai_agent_steps"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_agents" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"     uuid                     NOT NULL,
  "name"                text                     NOT NULL,
  "purpose"             text                     NOT NULL,
  "provider"            text                     NOT NULL DEFAULT 'openai'::text,
  "model"               text,
  "system_instructions" text,
  "approved_contexts"   jsonb                    NOT NULL DEFAULT '["products", "product_research", "price_monitoring", "automation"]'::jsonb,
  "is_active"           boolean                  NOT NULL DEFAULT true,
  "metadata"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_agents_contexts_array" CHECK ((jsonb_typeof(approved_contexts) = 'array'::text)),
  CONSTRAINT "ai_agents_id_org_key" UNIQUE (id, organization_id),
  CONSTRAINT "ai_agents_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "ai_agents_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "ai_agents_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_agents_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "ai_agents_purpose_not_blank" CHECK ((length(btrim(purpose)) > 0)),
  "created_by"          uuid                     DEFAULT auth.uid()
);

ALTER TABLE "public"."ai_agents"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_business_profiles" (
  "organization_id"        uuid                     NOT NULL,
  "industry"               text,
  "business_type"          text,
  "sales_model"            text,
  "primary_market"         text,
  "primary_sales_channels" text[]                   NOT NULL DEFAULT '{}'::text[],
  "pricing_strategy"       text,
  "primary_goal"           text,
  "operational_priorities" text[]                   NOT NULL DEFAULT '{}'::text[],
  "business_description"   text,
  "created_by"             uuid,
  "updated_by"             uuid,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_business_profiles_business_type_length" CHECK (((business_type IS NULL) OR ((length(btrim(business_type)) >= 1) AND (length(btrim(business_type)) <= 120)))),
  CONSTRAINT "ai_business_profiles_description_length"
    CHECK (((business_description IS NULL) OR ((length(btrim(business_description)) >= 1) AND (length(btrim(business_description)) <= 3000)))),
  CONSTRAINT "ai_business_profiles_industry_length" CHECK (((industry IS NULL) OR ((length(btrim(industry)) >= 1) AND (length(btrim(industry)) <= 120)))),
  CONSTRAINT "ai_business_profiles_pkey" PRIMARY KEY (organization_id),
  CONSTRAINT "ai_business_profiles_pricing_strategy_length"
    CHECK (((pricing_strategy IS NULL) OR ((length(btrim(pricing_strategy)) >= 1) AND (length(btrim(pricing_strategy)) <= 500)))),
  CONSTRAINT "ai_business_profiles_primary_goal_length" CHECK (((primary_goal IS NULL) OR ((length(btrim(primary_goal)) >= 1) AND (length(btrim(primary_goal)) <= 1000)))),
  CONSTRAINT "ai_business_profiles_primary_market_length" CHECK (((primary_market IS NULL) OR ((length(btrim(primary_market)) >= 1) AND (length(btrim(primary_market)) <= 160)))),
  CONSTRAINT "ai_business_profiles_priorities_count" CHECK ((cardinality(operational_priorities) <= 20)),
  CONSTRAINT "ai_business_profiles_sales_channels_count" CHECK ((cardinality(primary_sales_channels) <= 20)),
  CONSTRAINT "ai_business_profiles_sales_model_check" CHECK (((sales_model IS NULL) OR (sales_model = ANY (ARRAY['b2c'::text, 'b2b'::text, 'hybrid'::text, 'other'::text]))))
);

ALTER TABLE "public"."ai_business_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_controlled_actions" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_version"     smallint                 NOT NULL DEFAULT 1,
  "organization_id"      uuid                     NOT NULL,
  "requested_by"         uuid                     NOT NULL,
  "action_type"          text                     NOT NULL,
  "status"               text                     NOT NULL DEFAULT 'proposed'::text,
  "target_resource"      text                     NOT NULL,
  "target_id"            uuid                     NOT NULL,
  "expected_description" text,
  "proposed_description" text,
  "idempotency_key"      text                     NOT NULL,
  "confirmed_by"         uuid,
  "executed_by"          uuid,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "confirmed_at"         timestamp with time zone,
  "execution_started_at" timestamp with time zone,
  "finalized_at"         timestamp with time zone,
  "error_message"        text,
  "mutation_field"       text,
  "expected_value"       text,
  "proposed_value"       text,
  CONSTRAINT "ai_controlled_actions_action_type_check"
    CHECK ((action_type = ANY (ARRAY['product.update_description'::text, 'product.update_name'::text, 'product.update_status'::text, 'product.update_price'::text]))),
  CONSTRAINT "ai_controlled_actions_confirmation_pair_check" CHECK ((((confirmed_by IS NULL) AND (confirmed_at IS NULL)) OR ((confirmed_by IS NOT NULL) AND (confirmed_at IS
    NOT NULL)))),
  CONSTRAINT "ai_controlled_actions_confirmation_required_check"
    CHECK (((status <> ALL (ARRAY['confirmed'::text, 'executing'::text, 'executed'::text, 'stale'::text, 'failed'::text])) OR ((confirmed_by IS NOT NULL) AND (confirmed_at IS
    NOT NULL)))),
  CONSTRAINT "ai_controlled_actions_contract_version_check" CHECK ((contract_version = 1)),
  CONSTRAINT "ai_controlled_actions_description_payload_check" CHECK (((action_type <> 'product.update_description'::text) OR ((proposed_description IS
    NOT NULL) AND (mutation_field IS NULL) AND (expected_value IS NULL) AND (proposed_value IS NULL)))),
  CONSTRAINT "ai_controlled_actions_execution_pair_check" CHECK ((((executed_by IS NULL) AND (execution_started_at IS NULL)) OR ((executed_by IS
    NOT NULL) AND (execution_started_at IS NOT NULL)))),
  CONSTRAINT "ai_controlled_actions_execution_started_check" CHECK (((status <> ALL (ARRAY['executing'::text, 'executed'::text, 'stale'::text, 'failed'::text])) OR ((executed_by IS
    NOT NULL) AND (execution_started_at IS NOT NULL)))),
  CONSTRAINT "ai_controlled_actions_finalized_check" CHECK ((((status = ANY (ARRAY['executed'::text, 'stale'::text, 'failed'::text, 'cancelled'::text])) AND (finalized_at IS
    NOT NULL)) OR ((status <> ALL (ARRAY['executed'::text, 'stale'::text, 'failed'::text, 'cancelled'::text])) AND (finalized_at IS NULL)))),
  CONSTRAINT "ai_controlled_actions_idempotency_key_check"
    CHECK (((idempotency_key = btrim(idempotency_key)) AND ((length(idempotency_key) >= 1) AND (length(idempotency_key) <= 128)))),
  CONSTRAINT "ai_controlled_actions_not_noop_check" CHECK ((COALESCE(btrim(expected_description), ''::text) <> btrim(proposed_description))),
  CONSTRAINT "ai_controlled_actions_org_idempotency_key" UNIQUE (organization_id, idempotency_key),
  CONSTRAINT "ai_controlled_actions_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_controlled_actions_product_name_payload_check" CHECK (((action_type <> 'product.update_name'::text) OR ((mutation_field = 'name'::text) AND (expected_value IS
    NOT NULL) AND (proposed_value IS
    NOT NULL) AND (proposed_value = btrim(proposed_value)) AND (length(proposed_value) > 0) AND (expected_value IS DISTINCT FROM proposed_value) AND (expected_description IS NULL)
    AND (proposed_description IS NULL)))),
  CONSTRAINT "ai_controlled_actions_product_price_payload_check" CHECK (((action_type <> 'product.update_price'::text) OR ((mutation_field = 'price'::text) AND (expected_value IS
    NOT NULL) AND (proposed_value IS
    NOT NULL) AND (expected_value ~ '^(0|[1-9][0-9]{0,9})\.[0-9]{2}$'::text) AND (proposed_value ~ '^(0|[1-9][0-9]{0,9})\.[0-9]{2}$'::text) AND
    (expected_value IS DISTINCT FROM proposed_value) AND (expected_description IS NULL) AND (proposed_description IS NULL)))),
  CONSTRAINT "ai_controlled_actions_product_status_payload_check"
    CHECK (((action_type <> 'product.update_status'::text) OR ((mutation_field = 'status'::text) AND (expected_value IS NOT NULL) AND (proposed_value IS
    NOT NULL) AND (expected_value = ANY (ARRAY['active'::text, 'inactive'::text])) AND (proposed_value = ANY (ARRAY['active'::text, 'inactive'::text])) AND
    (expected_value IS DISTINCT FROM proposed_value) AND (expected_description IS NULL) AND (proposed_description IS NULL)))),
  CONSTRAINT "ai_controlled_actions_proposed_description_check" CHECK (((proposed_description = btrim(proposed_description)) AND (length(proposed_description) > 0))),
  CONSTRAINT "ai_controlled_actions_proposed_unconfirmed_check" CHECK (((status <> 'proposed'::text) OR ((confirmed_by IS NULL) AND (confirmed_at IS NULL)))),
  CONSTRAINT "ai_controlled_actions_status_check"
    CHECK ((status = ANY (ARRAY['proposed'::text, 'confirmed'::text, 'executing'::text, 'executed'::text, 'stale'::text, 'failed'::text, 'cancelled'::text]))),
  CONSTRAINT "ai_controlled_actions_target_resource_check" CHECK ((target_resource = 'product'::text))
);

ALTER TABLE "public"."ai_controlled_actions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_controlled_publications" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"      uuid                     NOT NULL,
  "contract_version"     smallint                 NOT NULL DEFAULT 1,
  "action_type"          text                     NOT NULL DEFAULT 'content.publish_text'::text,
  "target_resource"      text                     NOT NULL DEFAULT 'marketplace_authorized_shop'::text,
  "target_id"            uuid                     NOT NULL,
  "mutation_field"       text                     NOT NULL DEFAULT 'content'::text,
  "expected_value"       text,
  "proposed_value"       text                     NOT NULL,
  "provider"             text                     NOT NULL,
  "external_shop_id"     text                     NOT NULL,
  "destination_name"     text                     NOT NULL,
  "requested_by_user_id" uuid                     NOT NULL,
  "confirmed_by_user_id" uuid,
  "idempotency_key"      text                     NOT NULL,
  "status"               text                     NOT NULL DEFAULT 'proposed'::text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "confirmed_at"         timestamp with time zone,
  "finalized_at"         timestamp with time zone,
  "error_message"        text,
  "destination_type"     text,
  CONSTRAINT "ai_controlled_publications_action_type_check" CHECK ((action_type = 'content.publish_text'::text)),
  CONSTRAINT "ai_controlled_publications_contract_version_check" CHECK ((contract_version = ANY (ARRAY[1, 2]))),
  CONSTRAINT "ai_controlled_publications_destination_name_check" CHECK ((length(btrim(destination_name)) > 0)),
  CONSTRAINT "ai_controlled_publications_expected_value_check" CHECK ((expected_value IS NULL)),
  CONSTRAINT "ai_controlled_publications_external_shop_id_check" CHECK ((length(btrim(external_shop_id)) > 0)),
  CONSTRAINT "ai_controlled_publications_idempotency_key_check"
    CHECK
    (((idempotency_key = btrim(idempotency_key)) AND ((length(idempotency_key) >= 8) AND (length(idempotency_key) <= 128)) AND (idempotency_key ~ '^[A-Za-z0-9._:-]+$'::text))),
  CONSTRAINT "ai_controlled_publications_lifecycle_check"
    CHECK
    ((((status = 'proposed'::text) AND (confirmed_by_user_id IS NULL) AND (confirmed_at IS NULL) AND (finalized_at IS NULL) AND (error_message IS NULL)) OR ((status =
    'confirmed'::text) AND (confirmed_by_user_id IS NOT NULL) AND (confirmed_at IS
    NOT NULL) AND (finalized_at IS NULL) AND (error_message IS NULL)) OR ((status = 'stale'::text) AND (finalized_at IS NOT NULL)))),
  CONSTRAINT "ai_controlled_publications_mutation_field_check" CHECK ((mutation_field = 'content'::text)),
  CONSTRAINT "ai_controlled_publications_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_controlled_publications_proposed_value_check" CHECK (((length(btrim(proposed_value)) >= 1) AND (length(btrim(proposed_value)) <= 5000))),
  CONSTRAINT "ai_controlled_publications_provider_check" CHECK (((provider = lower(btrim(provider))) AND (length(provider) > 0))),
  CONSTRAINT "ai_controlled_publications_status_check" CHECK ((status = ANY (ARRAY['proposed'::text, 'confirmed'::text, 'stale'::text]))),
  CONSTRAINT "ai_controlled_publications_target_resource_check" CHECK ((target_resource = ANY (ARRAY['marketplace_authorized_shop'::text, 'publishing_channel_destination'::text])))
);

ALTER TABLE "public"."ai_controlled_publications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_conversation_messages" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" uuid                     NOT NULL,
  "organization_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "role"            text                     NOT NULL,
  "content"         text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_conversation_messages_content_length" CHECK ((length(content) <= 20000)),
  CONSTRAINT "ai_conversation_messages_content_not_blank" CHECK ((length(btrim(content)) > 0)),
  CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_conversation_messages_role_valid" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);

ALTER TABLE "public"."ai_conversation_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_conversations" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "title"           text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "last_message_at" timestamp with time zone NOT NULL DEFAULT now(),
  "archived_at"     timestamp with time zone,
  CONSTRAINT "ai_conversations_identity_unique" UNIQUE (id, organization_id, user_id),
  CONSTRAINT "ai_conversations_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_conversations_title_length" CHECK ((length(title) <= 120)),
  CONSTRAINT "ai_conversations_title_not_blank" CHECK ((length(btrim(title)) > 0))
);

ALTER TABLE "public"."ai_conversations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_credit_ledger" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"    uuid                     NOT NULL,
  "usage_id"           uuid,
  "transaction_type"   text                     NOT NULL,
  "amount"             bigint                   NOT NULL,
  "external_reference" text,
  "metadata"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_credit_ledger_amount_nonzero" CHECK ((amount <> 0)),
  CONSTRAINT "ai_credit_ledger_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "ai_credit_ledger_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_credit_ledger_type_check" CHECK ((transaction_type = ANY (ARRAY['grant'::text, 'topup'::text, 'usage'::text, 'refund'::text, 'adjustment'::text])))
);

ALTER TABLE "public"."ai_credit_ledger"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_memories" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "user_id"                uuid                     NOT NULL,
  "memory_type"            text                     NOT NULL,
  "memory_key"             text                     NOT NULL,
  "content"                text                     NOT NULL,
  "source_kind"            text                     NOT NULL DEFAULT 'explicit_user'::text,
  "source_conversation_id" uuid,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "last_used_at"           timestamp with time zone,
  "archived_at"            timestamp with time zone,
  CONSTRAINT "ai_memories_content_length_check" CHECK ((char_length(content) <= 2000)),
  CONSTRAINT "ai_memories_content_nonblank_check" CHECK ((btrim(content) <> ''::text)),
  CONSTRAINT "ai_memories_key_length_check" CHECK ((char_length(memory_key) <= 120)),
  CONSTRAINT "ai_memories_key_nonblank_check" CHECK ((btrim(memory_key) <> ''::text)),
  CONSTRAINT "ai_memories_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_memories_source_kind_check" CHECK ((source_kind = ANY (ARRAY['explicit_user'::text, 'user_confirmed'::text]))),
  CONSTRAINT "ai_memories_type_check" CHECK ((memory_type = ANY (ARRAY['preference'::text, 'goal'::text, 'constraint'::text, 'business_context'::text])))
);

ALTER TABLE "public"."ai_memories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_model_pricing" (
  "id"                           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "provider"                     text                     NOT NULL,
  "model"                        text                     NOT NULL,
  "input_usd_per_million"        numeric(20,8)            NOT NULL,
  "cached_input_usd_per_million" numeric(20,8)            NOT NULL,
  "cache_write_usd_per_million"  numeric(20,8)            NOT NULL,
  "output_usd_per_million"       numeric(20,8)            NOT NULL,
  "effective_from"               timestamp with time zone NOT NULL,
  "effective_to"                 timestamp with time zone,
  "source_metadata"              jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"                   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_model_pricing_cache_write_nonnegative" CHECK ((cache_write_usd_per_million >= (0)::numeric)),
  CONSTRAINT "ai_model_pricing_cached_input_nonnegative" CHECK ((cached_input_usd_per_million >= (0)::numeric)),
  CONSTRAINT "ai_model_pricing_input_nonnegative" CHECK ((input_usd_per_million >= (0)::numeric)),
  CONSTRAINT "ai_model_pricing_model_not_blank" CHECK ((length(btrim(model)) > 0)),
  CONSTRAINT "ai_model_pricing_output_nonnegative" CHECK ((output_usd_per_million >= (0)::numeric)),
  CONSTRAINT "ai_model_pricing_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_model_pricing_provider_model_effective_key" UNIQUE (PROVIDER, model, effective_from),
  CONSTRAINT "ai_model_pricing_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "ai_model_pricing_source_object" CHECK ((jsonb_typeof(source_metadata) = 'object'::text)),
  CONSTRAINT "ai_model_pricing_window_check" CHECK (((effective_to IS NULL) OR (effective_to > effective_from)))
);

ALTER TABLE "public"."ai_model_pricing"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_usage_ledger" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"     uuid                     NOT NULL,
  "user_id"             uuid,
  "feature"             text                     NOT NULL,
  "provider"            text                     NOT NULL,
  "model"               text                     NOT NULL,
  "source_kind"         text,
  "source_id"           uuid,
  "provider_request_id" text,
  "request_status"      text                     NOT NULL DEFAULT 'completed'::text,
  "input_tokens"        bigint                   NOT NULL DEFAULT 0,
  "cached_input_tokens" bigint                   NOT NULL DEFAULT 0,
  "cache_write_tokens"  bigint                   NOT NULL DEFAULT 0,
  "output_tokens"       bigint                   NOT NULL DEFAULT 0,
  "total_tokens"        bigint                   NOT NULL DEFAULT 0,
  "estimated_cost_usd"  numeric(20,10)           NOT NULL DEFAULT 0,
  "credits_charged"     bigint                   NOT NULL DEFAULT 0,
  "pricing_snapshot"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "metadata"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_usage_ledger_cache_write_nonnegative" CHECK ((cache_write_tokens >= 0)),
  CONSTRAINT "ai_usage_ledger_cached_nonnegative" CHECK ((cached_input_tokens >= 0)),
  CONSTRAINT "ai_usage_ledger_cost_nonnegative" CHECK ((estimated_cost_usd >= (0)::numeric)),
  CONSTRAINT "ai_usage_ledger_credits_nonnegative" CHECK ((credits_charged >= 0)),
  CONSTRAINT "ai_usage_ledger_feature_not_blank" CHECK ((length(btrim(feature)) > 0)),
  CONSTRAINT "ai_usage_ledger_input_nonnegative" CHECK ((input_tokens >= 0)),
  CONSTRAINT "ai_usage_ledger_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "ai_usage_ledger_model_not_blank" CHECK ((length(btrim(model)) > 0)),
  CONSTRAINT "ai_usage_ledger_output_nonnegative" CHECK ((output_tokens >= 0)),
  CONSTRAINT "ai_usage_ledger_pkey" PRIMARY KEY (id),
  CONSTRAINT "ai_usage_ledger_pricing_snapshot_object" CHECK ((jsonb_typeof(pricing_snapshot) = 'object'::text)),
  CONSTRAINT "ai_usage_ledger_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "ai_usage_ledger_provider_request_key" UNIQUE (PROVIDER, provider_request_id),
  CONSTRAINT "ai_usage_ledger_source_kind_not_blank" CHECK (((source_kind IS NULL) OR (length(btrim(source_kind)) > 0))),
  CONSTRAINT "ai_usage_ledger_status_check" CHECK ((request_status = ANY (ARRAY['completed'::text, 'failed'::text]))),
  CONSTRAINT "ai_usage_ledger_total_nonnegative" CHECK ((total_tokens >= 0))
);

ALTER TABLE "public"."ai_usage_ledger"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."automation_actions" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "run_id"          uuid                     NOT NULL,
  "rule_id"         uuid                     NOT NULL,
  "action_type"     text                     NOT NULL,
  "target_type"     text                     NOT NULL,
  "product_id"      uuid,
  "variant_id"      uuid,
  "before_price"    numeric(18,4)            NOT NULL,
  "requested_price" numeric(18,4)            NOT NULL,
  "applied_price"   numeric(18,4),
  "status"          text                     NOT NULL DEFAULT 'pending'::text,
  "error_message"   text,
  "executed_by"     uuid,
  "executed_at"     timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "automation_actions_action_type_check" CHECK ((action_type = 'set_internal_price'::text)),
  CONSTRAINT "automation_actions_applied_price_check" CHECK (((applied_price IS NULL) OR (applied_price >= (0)::numeric))),
  CONSTRAINT "automation_actions_before_price_check" CHECK ((before_price >= (0)::numeric)),
  CONSTRAINT "automation_actions_exactly_one_target" CHECK ((num_nonnulls(product_id, variant_id) = 1)),
  CONSTRAINT "automation_actions_id_org_key" UNIQUE (id, organization_id),
  CONSTRAINT "automation_actions_pkey" PRIMARY KEY (id),
  CONSTRAINT "automation_actions_requested_price_check" CHECK ((requested_price >= (0)::numeric)),
  CONSTRAINT "automation_actions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'executed'::text, 'failed'::text, 'cancelled'::text]))),
  CONSTRAINT "automation_actions_target_consistency" CHECK ((((target_type = 'product'::text) AND (product_id IS
    NOT NULL) AND (variant_id IS NULL)) OR ((target_type = 'variant'::text) AND (variant_id IS NOT NULL) AND (product_id IS NULL)))),
  CONSTRAINT "automation_actions_target_type_check" CHECK ((target_type = ANY (ARRAY['product'::text, 'variant'::text])))
);

ALTER TABLE "public"."automation_actions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."automation_rules" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"         uuid                     NOT NULL,
  "price_monitor_target_id" uuid                     NOT NULL,
  "name"                    text                     NOT NULL,
  "trigger_type"            text                     NOT NULL DEFAULT 'price_threshold'::text,
  "action_type"             text                     NOT NULL DEFAULT 'set_internal_price'::text,
  "pricing_strategy"        text                     NOT NULL DEFAULT 'match_observed'::text,
  "adjustment_percent"      numeric(12,4)            NOT NULL DEFAULT 0,
  "minimum_price"           numeric(18,4),
  "maximum_price"           numeric(18,4),
  "execution_mode"          text                     NOT NULL DEFAULT 'proposal'::text,
  "is_active"               boolean                  NOT NULL DEFAULT true,
  "metadata"                jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "automation_rules_action_check" CHECK ((action_type = 'set_internal_price'::text)),
  CONSTRAINT "automation_rules_adjustment_check" CHECK (((adjustment_percent >= ('-100'::integer)::numeric) AND (adjustment_percent <= (10000)::numeric))),
  CONSTRAINT "automation_rules_execution_mode_check" CHECK ((execution_mode = ANY (ARRAY['proposal'::text, 'automatic'::text]))),
  CONSTRAINT "automation_rules_id_org_key" UNIQUE (id, organization_id),
  CONSTRAINT "automation_rules_max_price_check" CHECK (((maximum_price IS NULL) OR (maximum_price >= (0)::numeric))),
  CONSTRAINT "automation_rules_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "automation_rules_min_price_check" CHECK (((minimum_price IS NULL) OR (minimum_price >= (0)::numeric))),
  CONSTRAINT "automation_rules_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "automation_rules_pkey" PRIMARY KEY (id),
  CONSTRAINT "automation_rules_price_range_check" CHECK (((minimum_price IS NULL) OR (maximum_price IS NULL) OR (minimum_price <= maximum_price))),
  CONSTRAINT "automation_rules_strategy_check" CHECK ((pricing_strategy = ANY (ARRAY['match_observed'::text, 'adjust_observed_percent'::text]))),
  CONSTRAINT "automation_rules_trigger_check" CHECK ((trigger_type = 'price_threshold'::text)),
  "created_by"              uuid                     DEFAULT auth.uid()
);

ALTER TABLE "public"."automation_rules"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."automation_runs" (
  "id"                           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"              uuid                     NOT NULL,
  "rule_id"                      uuid                     NOT NULL,
  "trigger_observation_id"       uuid,
  "status"                       text                     NOT NULL,
  "observed_price_snapshot"      numeric(18,4),
  "internal_price_before"        numeric(18,4),
  "proposed_price"               numeric(18,4),
  "threshold_triggered_snapshot" boolean,
  "reason"                       text,
  "error_message"                text,
  "created_by"                   uuid,
  "started_at"                   timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at"                 timestamp with time zone,
  "created_at"                   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "automation_runs_id_org_key" UNIQUE (id, organization_id),
  CONSTRAINT "automation_runs_internal_price_check" CHECK (((internal_price_before IS NULL) OR (internal_price_before >= (0)::numeric))),
  CONSTRAINT "automation_runs_observed_price_check" CHECK (((observed_price_snapshot IS NULL) OR (observed_price_snapshot >= (0)::numeric))),
  CONSTRAINT "automation_runs_pkey" PRIMARY KEY (id),
  CONSTRAINT "automation_runs_proposed_price_check" CHECK (((proposed_price IS NULL) OR (proposed_price >= (0)::numeric))),
  CONSTRAINT "automation_runs_status_check" CHECK ((status = ANY (ARRAY['skipped'::text, 'proposed'::text, 'executed'::text, 'failed'::text])))
);

ALTER TABLE "public"."automation_runs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."billing_checkout_entitlement_activations" (
  "id"                       uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "checkout_session_id"      uuid                     NOT NULL,
  "organization_id"          uuid                     NOT NULL,
  "plan_id"                  uuid                     NOT NULL,
  "provider"                 text                     NOT NULL,
  "reference_id"             text                     NOT NULL,
  "billing_interval"         text                     NOT NULL,
  "status"                   text                     NOT NULL DEFAULT 'pending'::text,
  "result_code"              text,
  "entitlement_period_start" timestamp with time zone,
  "entitlement_period_end"   timestamp with time zone,
  "applied_at"               timestamp with time zone,
  "metadata"                 jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "billing_checkout_entitlement_activations_applied_contract" CHECK (((status <> 'applied'::text) OR ((applied_at IS NOT NULL) AND (entitlement_period_start IS
    NOT NULL) AND (entitlement_period_end IS NOT NULL) AND (entitlement_period_end > entitlement_period_start)))),
  CONSTRAINT "billing_checkout_entitlement_activations_interval_check" CHECK ((billing_interval = ANY (ARRAY['monthly'::text, 'annual'::text]))),
  CONSTRAINT "billing_checkout_entitlement_activations_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "billing_checkout_entitlement_activations_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_checkout_entitlement_activations_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "billing_checkout_entitlement_activations_reference_not_blank" CHECK ((length(btrim(reference_id)) > 0)),
  CONSTRAINT "billing_checkout_entitlement_activations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'applied'::text, 'policy_hold'::text])))
);

ALTER TABLE "public"."billing_checkout_entitlement_activations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."billing_checkout_sessions" (
  "id"                          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"             uuid                     NOT NULL,
  "plan_id"                     uuid                     NOT NULL,
  "provider"                    text                     NOT NULL,
  "reference_id"                text                     NOT NULL,
  "plan_slug"                   text                     NOT NULL,
  "billing_interval"            text                     NOT NULL,
  "amount"                      numeric(20,2)            NOT NULL,
  "currency"                    text                     NOT NULL,
  "status"                      text                     NOT NULL DEFAULT 'created'::text,
  "external_session_id"         text,
  "provider_transaction_id"     text,
  "checkout_url"                text,
  "expires_at"                  timestamp with time zone,
  "provider_session_created_at" timestamp with time zone,
  "completed_at"                timestamp with time zone,
  "failure_code"                text,
  "metadata"                    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"                  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "billing_checkout_sessions_amount_positive" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "billing_checkout_sessions_currency_not_blank" CHECK ((length(btrim(currency)) > 0)),
  CONSTRAINT "billing_checkout_sessions_currency_uppercase" CHECK ((currency = upper(currency))),
  CONSTRAINT "billing_checkout_sessions_interval_check" CHECK ((billing_interval = ANY (ARRAY['monthly'::text, 'annual'::text]))),
  CONSTRAINT "billing_checkout_sessions_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "billing_checkout_sessions_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_checkout_sessions_plan_slug_not_blank" CHECK ((length(btrim(plan_slug)) > 0)),
  CONSTRAINT "billing_checkout_sessions_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "billing_checkout_sessions_reference_length" CHECK ((length(reference_id) <= 120)),
  CONSTRAINT "billing_checkout_sessions_reference_not_blank" CHECK ((length(btrim(reference_id)) > 0)),
  CONSTRAINT "billing_checkout_sessions_status_check"
    CHECK ((status = ANY (ARRAY['created'::text, 'ready'::text, 'failed'::text, 'completed'::text, 'expired'::text, 'canceled'::text])))
);

ALTER TABLE "public"."billing_checkout_sessions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."billing_events" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"   uuid,
  "provider"          text                     NOT NULL,
  "external_event_id" text,
  "event_type"        text                     NOT NULL,
  "status"            text                     NOT NULL DEFAULT 'received'::text,
  "payload"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "processed_at"      timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "billing_events_payload_object" CHECK ((jsonb_typeof(payload) = 'object'::text)),
  CONSTRAINT "billing_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_events_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "billing_events_status_check" CHECK ((status = ANY (ARRAY['received'::text, 'processed'::text, 'ignored'::text, 'failed'::text]))),
  CONSTRAINT "billing_events_type_not_blank" CHECK ((length(btrim(event_type)) > 0))
);

ALTER TABLE "public"."billing_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."billing_plans" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "slug"          text                     NOT NULL,
  "name"          text                     NOT NULL,
  "description"   text,
  "currency"      text                     NOT NULL DEFAULT 'USD'::text,
  "price_monthly" numeric(14,2),
  "price_annual"  numeric(14,2),
  "features"      jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "limits"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "is_active"     boolean                  NOT NULL DEFAULT true,
  "is_public"     boolean                  NOT NULL DEFAULT false,
  "sort_order"    integer                  NOT NULL DEFAULT 0,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "billing_plans_annual_price_check" CHECK (((price_annual IS NULL) OR (price_annual >= (0)::numeric))),
  CONSTRAINT "billing_plans_currency_not_blank" CHECK ((length(btrim(currency)) > 0)),
  CONSTRAINT "billing_plans_features_array" CHECK ((jsonb_typeof(features) = 'array'::text)),
  CONSTRAINT "billing_plans_limits_object" CHECK ((jsonb_typeof(limits) = 'object'::text)),
  CONSTRAINT "billing_plans_monthly_price_check" CHECK (((price_monthly IS NULL) OR (price_monthly >= (0)::numeric))),
  CONSTRAINT "billing_plans_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "billing_plans_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_plans_slug_key" UNIQUE (slug),
  CONSTRAINT "billing_plans_slug_not_blank" CHECK ((length(btrim(slug)) > 0))
);

ALTER TABLE "public"."billing_plans"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."billing_usage" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "period_start"    timestamp with time zone NOT NULL,
  "period_end"      timestamp with time zone NOT NULL,
  "metrics"         jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "billing_usage_metrics_object" CHECK ((jsonb_typeof(metrics) = 'object'::text)),
  CONSTRAINT "billing_usage_org_period_key" UNIQUE (organization_id, period_start),
  CONSTRAINT "billing_usage_period_check" CHECK ((period_end > period_start)),
  CONSTRAINT "billing_usage_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."billing_usage"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."categories" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "name"            text                     NOT NULL,
  "description"     text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "categories_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."customers" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"            text                     NOT NULL,
  "email"           text,
  "phone"           text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "organization_id" uuid                     NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."customers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inventory_movements" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "target_type"     text                     NOT NULL,
  "product_id"      uuid,
  "variant_id"      uuid,
  "movement_type"   text                     NOT NULL,
  "quantity_delta"  integer                  NOT NULL,
  "stock_before"    integer                  NOT NULL,
  "stock_after"     integer                  NOT NULL,
  "reference_type"  text,
  "reference_id"    uuid,
  "note"            text,
  "created_by"      uuid,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "inventory_movements_opening_positive" CHECK (((movement_type <> 'opening'::text) OR (quantity_delta > 0))),
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY (id),
  CONSTRAINT "inventory_movements_quantity_non_zero" CHECK ((quantity_delta <> 0)),
  CONSTRAINT "inventory_movements_reference_type_check"
    CHECK (((reference_type IS NULL) OR (reference_type = ANY (ARRAY['order'::text, 'manual_adjustment'::text, 'migration'::text])))),
  CONSTRAINT "inventory_movements_stock_after_non_negative" CHECK ((stock_after >= 0)),
  CONSTRAINT "inventory_movements_stock_before_non_negative" CHECK ((stock_before >= 0)),
  CONSTRAINT "inventory_movements_stock_math_check" CHECK ((stock_after = (stock_before + quantity_delta))),
  CONSTRAINT "inventory_movements_target_check" CHECK ((((target_type = 'product'::text) AND (variant_id IS NULL)) OR ((target_type = 'variant'::text) AND (product_id IS NULL)))),
  CONSTRAINT "inventory_movements_target_type_check" CHECK ((target_type = ANY (ARRAY['product'::text, 'variant'::text]))),
  CONSTRAINT "inventory_movements_type_check" CHECK ((movement_type = ANY (ARRAY['opening'::text, 'adjustment'::text, 'order_deduction'::text, 'order_restore'::text])))
);

ALTER TABLE "public"."inventory_movements"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_accounts" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"  uuid                     NOT NULL,
  "provider"         text                     NOT NULL,
  "name"             text                     NOT NULL,
  "external_shop_id" text,
  "status"           text                     NOT NULL DEFAULT 'active'::text,
  "metadata"         jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "last_synced_at"   timestamp with time zone,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_accounts_id_organization_id_key" UNIQUE (id, organization_id),
  CONSTRAINT "marketplace_accounts_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "marketplace_accounts_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "marketplace_accounts_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_accounts_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "marketplace_accounts_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'error'::text])))
);

ALTER TABLE "public"."marketplace_accounts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_authorized_shops" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "marketplace_account_id" uuid                     NOT NULL,
  "provider"               text                     NOT NULL,
  "external_shop_id"       text                     NOT NULL,
  "shop_code"              text,
  "name"                   text                     NOT NULL,
  "region"                 text,
  "seller_type"            text,
  "shop_cipher_ciphertext" text,
  "status"                 text                     NOT NULL DEFAULT 'active'::text,
  "is_selected"            boolean                  NOT NULL DEFAULT false,
  "last_seen_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_authorized_shops_cipher_provider_contract" CHECK ((((lower(btrim(provider)) = 'tiktok_shop'::text) AND (shop_cipher_ciphertext IS
    NOT NULL) AND (length(btrim(shop_cipher_ciphertext)) > 0)) OR
    ((lower(btrim(provider)) <> 'tiktok_shop'::text) AND ((shop_cipher_ciphertext IS NULL) OR (length(btrim(shop_cipher_ciphertext)) > 0))))),
  CONSTRAINT "marketplace_authorized_shops_external_id_not_blank" CHECK ((length(btrim(external_shop_id)) > 0)),
  CONSTRAINT "marketplace_authorized_shops_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "marketplace_authorized_shops_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_authorized_shops_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "marketplace_authorized_shops_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

ALTER TABLE "public"."marketplace_authorized_shops"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_catalog_products" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "marketplace_account_id" uuid                     NOT NULL,
  "authorized_shop_id"     uuid                     NOT NULL,
  "provider"               text                     NOT NULL,
  "external_product_id"    text                     NOT NULL,
  "title"                  text                     NOT NULL,
  "external_status"        text                     NOT NULL,
  "external_create_time"   timestamp with time zone,
  "external_update_time"   timestamp with time zone,
  "last_seen_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_catalog_products_external_id_not_blank" CHECK ((length(btrim(external_product_id)) > 0)),
  CONSTRAINT "marketplace_catalog_products_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_catalog_products_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "marketplace_catalog_products_status_not_blank" CHECK ((length(btrim(external_status)) > 0)),
  CONSTRAINT "marketplace_catalog_products_title_not_blank" CHECK ((length(btrim(title)) > 0))
);

ALTER TABLE "public"."marketplace_catalog_products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_catalog_skus" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"     uuid                     NOT NULL,
  "catalog_product_id"  uuid                     NOT NULL,
  "external_sku_id"     text                     NOT NULL,
  "seller_sku"          text,
  "currency"            text,
  "sale_price"          numeric,
  "tax_exclusive_price" numeric,
  "inventory"           jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "last_seen_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_catalog_skus_external_id_not_blank" CHECK ((length(btrim(external_sku_id)) > 0)),
  CONSTRAINT "marketplace_catalog_skus_inventory_array" CHECK ((jsonb_typeof(inventory) = 'array'::text)),
  CONSTRAINT "marketplace_catalog_skus_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_catalog_skus_sale_price_non_negative" CHECK (((sale_price IS NULL) OR (sale_price >= (0)::numeric))),
  CONSTRAINT "marketplace_catalog_skus_tax_price_non_negative" CHECK (((tax_exclusive_price IS NULL) OR (tax_exclusive_price >= (0)::numeric)))
);

ALTER TABLE "public"."marketplace_catalog_skus"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_connections" (
  "id"                       uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"          uuid                     NOT NULL,
  "marketplace_account_id"   uuid                     NOT NULL,
  "provider"                 text                     NOT NULL,
  "open_id"                  text,
  "access_token_ciphertext"  text                     NOT NULL,
  "refresh_token_ciphertext" text                     NOT NULL,
  "access_token_expires_at"  timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "granted_scopes"           text[]                   NOT NULL DEFAULT '{}'::text[],
  "user_type"                integer,
  "status"                   text                     NOT NULL DEFAULT 'active'::text,
  "connected_by"             uuid,
  "connected_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "last_refreshed_at"        timestamp with time zone,
  "metadata"                 jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_connections_access_token_not_blank" CHECK ((length(btrim(access_token_ciphertext)) > 0)),
  CONSTRAINT "marketplace_connections_marketplace_account_id_key" UNIQUE (marketplace_account_id),
  CONSTRAINT "marketplace_connections_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "marketplace_connections_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_connections_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "marketplace_connections_refresh_token_not_blank" CHECK ((length(btrim(refresh_token_ciphertext)) > 0)),
  CONSTRAINT "marketplace_connections_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text, 'error'::text])))
);

ALTER TABLE "public"."marketplace_connections"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_external_order_items" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"       uuid                     NOT NULL,
  "external_order_id"     uuid                     NOT NULL,
  "external_line_item_id" text                     NOT NULL,
  "external_product_id"   text,
  "product_name"          text,
  "external_sku_id"       text,
  "sku_name"              text,
  "seller_sku"            text,
  "quantity"              integer                  NOT NULL DEFAULT 1,
  "original_price"        numeric,
  "sale_price"            numeric,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_external_order_items_line_id_not_blank" CHECK ((length(btrim(external_line_item_id)) > 0)),
  CONSTRAINT "marketplace_external_order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_external_order_items_price_non_negative"
    CHECK ((((original_price IS NULL) OR (original_price >= (0)::numeric)) AND ((sale_price IS NULL) OR (sale_price >= (0)::numeric)))),
  CONSTRAINT "marketplace_external_order_items_quantity_positive" CHECK ((quantity > 0))
);

ALTER TABLE "public"."marketplace_external_order_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_external_orders" (
  "id"                            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"               uuid                     NOT NULL,
  "marketplace_account_id"        uuid                     NOT NULL,
  "authorized_shop_id"            uuid                     NOT NULL,
  "provider"                      text                     NOT NULL,
  "external_order_id"             text                     NOT NULL,
  "external_status"               text                     NOT NULL,
  "payment_currency"              text,
  "payment_subtotal"              numeric,
  "payment_shipping_fee"          numeric,
  "payment_original_shipping_fee" numeric,
  "payment_seller_discount"       numeric,
  "payment_platform_discount"     numeric,
  "payment_total_amount"          numeric,
  "fulfillment_type"              text,
  "delivery_option_name"          text,
  "is_sample_order"               boolean                  NOT NULL DEFAULT false,
  "external_create_time"          timestamp with time zone,
  "external_update_time"          timestamp with time zone,
  "last_seen_at"                  timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"                    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_external_orders_external_id_not_blank" CHECK ((length(btrim(external_order_id)) > 0)),
  CONSTRAINT "marketplace_external_orders_payment_non_negative"
    CHECK
    ((((payment_subtotal IS NULL) OR (payment_subtotal >= (0)::numeric)) AND ((payment_shipping_fee IS NULL) OR (payment_shipping_fee >= (0)::numeric)) AND
    ((payment_original_shipping_fee IS NULL) OR (payment_original_shipping_fee >= (0)::numeric)) AND
    ((payment_seller_discount IS NULL) OR (payment_seller_discount >= (0)::numeric)) AND ((payment_platform_discount IS NULL) OR (payment_platform_discount >= (0)::numeric)) AND
    ((payment_total_amount IS NULL) OR (payment_total_amount >= (0)::numeric)))),
  CONSTRAINT "marketplace_external_orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_external_orders_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "marketplace_external_orders_status_not_blank" CHECK ((length(btrim(external_status)) > 0))
);

ALTER TABLE "public"."marketplace_external_orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_listings" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "marketplace_account_id" uuid                     NOT NULL,
  "target_type"            text                     NOT NULL,
  "product_id"             uuid,
  "variant_id"             uuid,
  "external_listing_id"    text,
  "external_sku"           text,
  "listing_status"         text                     NOT NULL DEFAULT 'active'::text,
  "sync_enabled"           boolean                  NOT NULL DEFAULT true,
  "last_synced_at"         timestamp with time zone,
  "metadata"               jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_listings_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_listings_status_check" CHECK ((listing_status = ANY (ARRAY['active'::text, 'inactive'::text, 'error'::text]))),
  CONSTRAINT "marketplace_listings_target_check" CHECK ((((target_type = 'product'::text) AND (product_id IS
    NOT NULL) AND (variant_id IS NULL)) OR ((target_type = 'variant'::text) AND (variant_id IS NOT NULL) AND (product_id IS NULL)))),
  CONSTRAINT "marketplace_listings_target_type_check" CHECK ((target_type = ANY (ARRAY['product'::text, 'variant'::text])))
);

ALTER TABLE "public"."marketplace_listings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_oauth_states" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "marketplace_account_id" uuid                     NOT NULL,
  "provider"               text                     NOT NULL,
  "state_hash"             text                     NOT NULL,
  "initiated_by"           uuid                     NOT NULL,
  "expires_at"             timestamp with time zone NOT NULL,
  "used_at"                timestamp with time zone,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_oauth_states_expiry_check" CHECK ((expires_at > created_at)),
  CONSTRAINT "marketplace_oauth_states_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_oauth_states_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "marketplace_oauth_states_state_hash_key" UNIQUE (state_hash),
  CONSTRAINT "marketplace_oauth_states_state_hash_not_blank" CHECK ((length(btrim(state_hash)) > 0))
);

ALTER TABLE "public"."marketplace_oauth_states"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_order_links" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "marketplace_account_id" uuid                     NOT NULL,
  "order_id"               uuid                     NOT NULL,
  "external_order_id"      text                     NOT NULL,
  "external_status"        text,
  "last_synced_at"         timestamp with time zone,
  "metadata"               jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_order_links_external_order_not_blank" CHECK ((length(btrim(external_order_id)) > 0)),
  CONSTRAINT "marketplace_order_links_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "marketplace_order_links_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."marketplace_order_links"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_sync_logs" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "marketplace_account_id" uuid                     NOT NULL,
  "direction"              text                     NOT NULL,
  "entity_type"            text                     NOT NULL,
  "operation"              text                     NOT NULL,
  "status"                 text                     NOT NULL,
  "entity_id"              uuid,
  "external_id"            text,
  "message"                text,
  "metadata"               jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "marketplace_sync_logs_direction_check" CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
  CONSTRAINT "marketplace_sync_logs_entity_type_check" CHECK ((entity_type = ANY (ARRAY['account'::text, 'listing'::text, 'product'::text, 'variant'::text, 'order'::text]))),
  CONSTRAINT "marketplace_sync_logs_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "marketplace_sync_logs_operation_not_blank" CHECK ((length(btrim(operation)) > 0)),
  CONSTRAINT "marketplace_sync_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_sync_logs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'error'::text])))
);

ALTER TABLE "public"."marketplace_sync_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_webhook_events" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "marketplace_account_id" uuid                     NOT NULL,
  "authorized_shop_id"     uuid                     NOT NULL,
  "provider"               text                     NOT NULL,
  "dedupe_key"             text                     NOT NULL,
  "notification_id"        text,
  "notification_type"      integer,
  "external_shop_id"       text                     NOT NULL,
  "external_entity_id"     text,
  "external_status"        text,
  "external_update_time"   timestamp with time zone,
  "payload_sha256"         text                     NOT NULL,
  "processing_status"      text                     NOT NULL DEFAULT 'received'::text,
  "processed_at"           timestamp with time zone,
  "processing_message"     text,
  "metadata"               jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "received_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "attempt_count"          integer                  NOT NULL DEFAULT 0,
  "last_attempt_at"        timestamp with time zone,
  CONSTRAINT "marketplace_webhook_events_attempt_count_check" CHECK ((attempt_count >= 0)),
  CONSTRAINT "marketplace_webhook_events_dedupe_not_blank" CHECK ((length(btrim(dedupe_key)) > 0)),
  CONSTRAINT "marketplace_webhook_events_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "marketplace_webhook_events_payload_hash_check" CHECK ((payload_sha256 ~ '^[a-f0-9]{64}$'::text)),
  CONSTRAINT "marketplace_webhook_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_webhook_events_processing_status_check"
    CHECK ((processing_status = ANY (ARRAY['received'::text, 'processing'::text, 'processed'::text, 'ignored'::text, 'error'::text]))),
  CONSTRAINT "marketplace_webhook_events_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "marketplace_webhook_events_shop_id_not_blank" CHECK ((length(btrim(external_shop_id)) > 0))
);

ALTER TABLE "public"."marketplace_webhook_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_items" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"            uuid                     NOT NULL,
  "product_id"          uuid                     NOT NULL,
  "quantity"            integer                  NOT NULL DEFAULT 1,
  "price"               numeric(12,2)            NOT NULL DEFAULT 0,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "cost_price_snapshot" numeric                  NOT NULL,
  "variant_id"          uuid,
  CONSTRAINT "order_items_cost_price_snapshot_non_negative" CHECK ((cost_price_snapshot >= (0)::numeric)),
  CONSTRAINT "order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_items_price_non_negative" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "order_items_quantity_positive" CHECK ((quantity > 0))
);

ALTER TABLE "public"."order_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orders" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"     uuid                     NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'pending'::text,
  "total"           numeric(12,2)            NOT NULL DEFAULT 0,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "organization_id" uuid                     NOT NULL,
  "completed_at"    timestamp with time zone,
  CONSTRAINT "orders_completed_at_status_check" CHECK ((((status = 'completed'::text) AND (completed_at IS
    NOT NULL)) OR ((status <> 'completed'::text) AND (completed_at IS NULL)))),
  CONSTRAINT "orders_id_organization_id_key" UNIQUE (id, organization_id),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "orders_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'cancelled'::text]))),
  CONSTRAINT "orders_total_non_negative" CHECK ((total >= (0)::numeric))
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organization_ai_controls" (
  "organization_id"            uuid                     NOT NULL,
  "credit_enforcement_enabled" boolean                  NOT NULL DEFAULT false,
  "cost_enforcement_enabled"   boolean                  NOT NULL DEFAULT false,
  "monthly_cost_limit_usd"     numeric(20,8),
  "warning_percent"            smallint                 NOT NULL DEFAULT 80,
  "created_at"                 timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                 timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "organization_ai_controls_cost_limit_check" CHECK (((monthly_cost_limit_usd IS NULL) OR (monthly_cost_limit_usd >= (0)::numeric))),
  CONSTRAINT "organization_ai_controls_pkey" PRIMARY KEY (organization_id),
  CONSTRAINT "organization_ai_controls_warning_check" CHECK (((warning_percent >= 1) AND (warning_percent <= 100)))
);

ALTER TABLE "public"."organization_ai_controls"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organization_members" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "role"            text                     NOT NULL DEFAULT 'member'::text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "organization_members_pkey" PRIMARY KEY (id),
  CONSTRAINT "organization_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]))),
  CONSTRAINT "organization_members_unique_user" UNIQUE (organization_id, user_id)
);

ALTER TABLE "public"."organization_members"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organization_subscriptions" (
  "id"                       uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"          uuid                     NOT NULL,
  "plan_id"                  uuid                     NOT NULL,
  "provider"                 text                     NOT NULL DEFAULT 'internal'::text,
  "provider_customer_id"     text,
  "provider_subscription_id" text,
  "status"                   text                     NOT NULL DEFAULT 'active'::text,
  "current_period_start"     timestamp with time zone,
  "current_period_end"       timestamp with time zone,
  "trial_ends_at"            timestamp with time zone,
  "cancel_at_period_end"     boolean                  NOT NULL DEFAULT false,
  "metadata"                 jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "organization_subscriptions_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "organization_subscriptions_org_key" UNIQUE (organization_id),
  CONSTRAINT "organization_subscriptions_pkey" PRIMARY KEY (id),
  CONSTRAINT "organization_subscriptions_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "organization_subscriptions_status_check" CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'canceled'::text, 'incomplete'::text])))
);

ALTER TABLE "public"."organization_subscriptions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organizations" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "organizations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."organizations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."price_monitor_targets" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"   uuid                     NOT NULL,
  "product_id"        uuid,
  "variant_id"        uuid,
  "name"              text                     NOT NULL,
  "source_name"       text                     NOT NULL DEFAULT 'manual'::text,
  "source_url"        text,
  "currency"          text                     NOT NULL DEFAULT 'IDR'::text,
  "comparison_basis"  text                     NOT NULL DEFAULT 'previous'::text,
  "direction"         text                     NOT NULL DEFAULT 'any'::text,
  "threshold_percent" numeric(12,4)            NOT NULL DEFAULT 5,
  "is_active"         boolean                  NOT NULL DEFAULT true,
  "metadata"          jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "price_monitor_targets_basis_check" CHECK ((comparison_basis = ANY (ARRAY['previous'::text, 'internal'::text]))),
  CONSTRAINT "price_monitor_targets_currency_not_blank" CHECK ((length(btrim(currency)) > 0)),
  CONSTRAINT "price_monitor_targets_direction_check" CHECK ((direction = ANY (ARRAY['any'::text, 'increase'::text, 'decrease'::text]))),
  CONSTRAINT "price_monitor_targets_exactly_one_item" CHECK ((num_nonnulls(product_id, variant_id) = 1)),
  CONSTRAINT "price_monitor_targets_id_org_key" UNIQUE (id, organization_id),
  CONSTRAINT "price_monitor_targets_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "price_monitor_targets_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "price_monitor_targets_pkey" PRIMARY KEY (id),
  CONSTRAINT "price_monitor_targets_source_not_blank" CHECK ((length(btrim(source_name)) > 0)),
  CONSTRAINT "price_monitor_targets_threshold_check" CHECK ((threshold_percent >= (0)::numeric)),
  "created_by"        uuid                     DEFAULT auth.uid()
);

ALTER TABLE "public"."price_monitor_targets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."price_observations" (
  "id"                               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"                  uuid                     NOT NULL,
  "target_id"                        uuid                     NOT NULL,
  "observed_price"                   numeric(18,4)            NOT NULL,
  "internal_price_snapshot"          numeric(18,4),
  "previous_price"                   numeric(18,4),
  "change_amount"                    numeric(18,4),
  "change_percent"                   numeric(18,4),
  "difference_from_internal"         numeric(18,4),
  "difference_from_internal_percent" numeric(18,4),
  "threshold_percent_snapshot"       numeric(12,4)            NOT NULL,
  "comparison_basis_snapshot"        text                     NOT NULL,
  "direction_snapshot"               text                     NOT NULL,
  "threshold_triggered"              boolean                  NOT NULL DEFAULT false,
  "source_name"                      text                     NOT NULL,
  "source_url"                       text,
  "notes"                            text,
  "metadata"                         jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "observed_at"                      timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"                       uuid,
  "created_at"                       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "price_observations_basis_check" CHECK ((comparison_basis_snapshot = ANY (ARRAY['previous'::text, 'internal'::text]))),
  CONSTRAINT "price_observations_direction_check" CHECK ((direction_snapshot = ANY (ARRAY['any'::text, 'increase'::text, 'decrease'::text]))),
  CONSTRAINT "price_observations_id_org_key" UNIQUE (id, organization_id),
  CONSTRAINT "price_observations_internal_price_check" CHECK (((internal_price_snapshot IS NULL) OR (internal_price_snapshot >= (0)::numeric))),
  CONSTRAINT "price_observations_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "price_observations_pkey" PRIMARY KEY (id),
  CONSTRAINT "price_observations_previous_price_check" CHECK (((previous_price IS NULL) OR (previous_price >= (0)::numeric))),
  CONSTRAINT "price_observations_price_check" CHECK ((observed_price >= (0)::numeric)),
  CONSTRAINT "price_observations_source_not_blank" CHECK ((length(btrim(source_name)) > 0)),
  CONSTRAINT "price_observations_threshold_check" CHECK ((threshold_percent_snapshot >= (0)::numeric))
);

ALTER TABLE "public"."price_observations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_description_generations" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"       uuid                     NOT NULL,
  "product_id"            uuid                     NOT NULL,
  "provider"              text                     NOT NULL,
  "model"                 text                     NOT NULL,
  "status"                text                     NOT NULL DEFAULT 'pending'::text,
  "tone"                  text                     NOT NULL DEFAULT 'professional'::text,
  "language"              text                     NOT NULL DEFAULT 'Indonesian'::text,
  "target_audience"       text,
  "instructions"          text,
  "input_snapshot"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "generated_description" text,
  "short_description"     text,
  "seo_title"             text,
  "meta_description"      text,
  "keywords"              jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "error_message"         text,
  "created_by"            uuid,
  "started_at"            timestamp with time zone,
  "completed_at"          timestamp with time zone,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_description_generations_id_organization_key" UNIQUE (id, organization_id),
  CONSTRAINT "product_description_generations_input_object" CHECK ((jsonb_typeof(input_snapshot) = 'object'::text)),
  CONSTRAINT "product_description_generations_keywords_array" CHECK ((jsonb_typeof(keywords) = 'array'::text)),
  CONSTRAINT "product_description_generations_language_not_blank" CHECK ((length(btrim(language)) > 0)),
  CONSTRAINT "product_description_generations_model_not_blank" CHECK ((length(btrim(model)) > 0)),
  CONSTRAINT "product_description_generations_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_description_generations_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "product_description_generations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))),
  CONSTRAINT "product_description_generations_tone_not_blank" CHECK ((length(btrim(tone)) > 0))
);

ALTER TABLE "public"."product_description_generations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_images" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"   uuid                     NOT NULL,
  "product_id"        uuid                     NOT NULL,
  "storage_path"      text                     NOT NULL,
  "original_filename" text                     NOT NULL,
  "mime_type"         text                     NOT NULL,
  "size_bytes"        bigint                   NOT NULL,
  "alt_text"          text,
  "sort_order"        integer                  NOT NULL,
  "is_primary"        boolean                  NOT NULL DEFAULT false,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_images_filename_nonblank" CHECK ((length(btrim(original_filename)) > 0)),
  CONSTRAINT "product_images_mime_type_check" CHECK ((mime_type = ANY (ARRAY['image/jpeg'::text, 'image/png'::text, 'image/webp'::text, 'image/gif'::text]))),
  CONSTRAINT "product_images_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_images_size_check" CHECK (((size_bytes > 0) AND (size_bytes <= 5242880))),
  CONSTRAINT "product_images_sort_order_non_negative" CHECK ((sort_order >= 0)),
  CONSTRAINT "product_images_storage_path_nonblank" CHECK ((length(btrim(storage_path)) > 0)),
  CONSTRAINT "product_images_storage_path_scope" CHECK ((storage_path ~~ ((((organization_id)::text || '/'::text) || (product_id)::text) || '/%'::text))),
  CONSTRAINT "product_images_storage_path_unique" UNIQUE (storage_path),
  "created_by"        uuid                     DEFAULT auth.uid()
);

ALTER TABLE "public"."product_images"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_research_ai_runs" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"      uuid                     NOT NULL,
  "research_item_id"     uuid                     NOT NULL,
  "provider"             text                     NOT NULL,
  "model"                text                     NOT NULL,
  "status"               text                     NOT NULL DEFAULT 'pending'::text,
  "input_snapshot"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "output_data"          jsonb,
  "ai_demand_score"      integer,
  "ai_competition_score" integer,
  "ai_opportunity_score" integer,
  "confidence_score"     integer,
  "recommendation"       text,
  "summary"              text,
  "rationale"            text,
  "risks"                jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "next_actions"         jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "error_message"        text,
  "created_by"           uuid,
  "started_at"           timestamp with time zone,
  "completed_at"         timestamp with time zone,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_research_ai_runs_competition_score_check" CHECK (((ai_competition_score IS NULL) OR ((ai_competition_score >= 0) AND (ai_competition_score <= 100)))),
  CONSTRAINT "product_research_ai_runs_confidence_score_check" CHECK (((confidence_score IS NULL) OR ((confidence_score >= 0) AND (confidence_score <= 100)))),
  CONSTRAINT "product_research_ai_runs_demand_score_check" CHECK (((ai_demand_score IS NULL) OR ((ai_demand_score >= 0) AND (ai_demand_score <= 100)))),
  CONSTRAINT "product_research_ai_runs_id_organization_key" UNIQUE (id, organization_id),
  CONSTRAINT "product_research_ai_runs_input_object" CHECK ((jsonb_typeof(input_snapshot) = 'object'::text)),
  CONSTRAINT "product_research_ai_runs_model_not_blank" CHECK ((length(btrim(model)) > 0)),
  CONSTRAINT "product_research_ai_runs_next_actions_array" CHECK ((jsonb_typeof(next_actions) = 'array'::text)),
  CONSTRAINT "product_research_ai_runs_opportunity_score_check" CHECK (((ai_opportunity_score IS NULL) OR ((ai_opportunity_score >= 0) AND (ai_opportunity_score <= 100)))),
  CONSTRAINT "product_research_ai_runs_output_object" CHECK (((output_data IS NULL) OR (jsonb_typeof(output_data) = 'object'::text))),
  CONSTRAINT "product_research_ai_runs_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_research_ai_runs_provider_not_blank" CHECK ((length(btrim(provider)) > 0)),
  CONSTRAINT "product_research_ai_runs_recommendation_check"
    CHECK (((recommendation IS NULL) OR (recommendation = ANY (ARRAY['watch'::text, 'shortlist'::text, 'approve'::text, 'reject'::text])))),
  CONSTRAINT "product_research_ai_runs_risks_array" CHECK ((jsonb_typeof(risks) = 'array'::text)),
  CONSTRAINT "product_research_ai_runs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])))
);

ALTER TABLE "public"."product_research_ai_runs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_research_items" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"    uuid                     NOT NULL,
  "linked_product_id"  uuid,
  "name"               text                     NOT NULL,
  "category"           text,
  "source_marketplace" text,
  "source_url"         text,
  "observed_price"     numeric,
  "estimated_cost"     numeric,
  "demand_score"       integer,
  "competition_score"  integer,
  "opportunity_score"  integer,
  "status"             text                     NOT NULL DEFAULT 'researching'::text,
  "notes"              text,
  "metadata"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_research_items_competition_score_check" CHECK (((competition_score IS NULL) OR ((competition_score >= 0) AND (competition_score <= 100)))),
  CONSTRAINT "product_research_items_demand_score_check" CHECK (((demand_score IS NULL) OR ((demand_score >= 0) AND (demand_score <= 100)))),
  CONSTRAINT "product_research_items_estimated_cost_check" CHECK (((estimated_cost IS NULL) OR (estimated_cost >= (0)::numeric))),
  CONSTRAINT "product_research_items_id_organization_id_key" UNIQUE (id, organization_id),
  CONSTRAINT "product_research_items_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "product_research_items_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "product_research_items_observed_price_check" CHECK (((observed_price IS NULL) OR (observed_price >= (0)::numeric))),
  CONSTRAINT "product_research_items_opportunity_score_check" CHECK (((opportunity_score IS NULL) OR ((opportunity_score >= 0) AND (opportunity_score <= 100)))),
  CONSTRAINT "product_research_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_research_items_status_check" CHECK ((status = ANY (ARRAY['researching'::text, 'shortlisted'::text, 'approved'::text, 'rejected'::text])))
);

ALTER TABLE "public"."product_research_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_research_observations" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"  uuid                     NOT NULL,
  "research_item_id" uuid                     NOT NULL,
  "source_name"      text                     NOT NULL,
  "source_url"       text,
  "observed_price"   numeric,
  "sold_count"       bigint,
  "rating"           numeric,
  "review_count"     bigint,
  "notes"            text,
  "metadata"         jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "observed_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_research_observations_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "product_research_observations_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_research_observations_price_check" CHECK (((observed_price IS NULL) OR (observed_price >= (0)::numeric))),
  CONSTRAINT "product_research_observations_rating_check" CHECK (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric)))),
  CONSTRAINT "product_research_observations_review_count_check" CHECK (((review_count IS NULL) OR (review_count >= 0))),
  CONSTRAINT "product_research_observations_sold_count_check" CHECK (((sold_count IS NULL) OR (sold_count >= 0))),
  CONSTRAINT "product_research_observations_source_not_blank" CHECK ((length(btrim(source_name)) > 0))
);

ALTER TABLE "public"."product_research_observations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_variants" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"     uuid                     NOT NULL,
  "product_id"          uuid                     NOT NULL,
  "sku"                 text                     NOT NULL,
  "name"                text                     NOT NULL,
  "price"               numeric                  NOT NULL DEFAULT 0,
  "cost_price"          numeric                  NOT NULL DEFAULT 0,
  "stock"               integer                  NOT NULL DEFAULT 0,
  "status"              text                     NOT NULL DEFAULT 'active'::text,
  "attributes"          jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "low_stock_threshold" integer                  NOT NULL DEFAULT 10,
  CONSTRAINT "product_variants_attributes_object" CHECK ((jsonb_typeof(attributes) = 'object'::text)),
  CONSTRAINT "product_variants_cost_price_non_negative" CHECK ((cost_price >= (0)::numeric)),
  CONSTRAINT "product_variants_id_organization_id_key" UNIQUE (id, organization_id),
  CONSTRAINT "product_variants_low_stock_threshold_non_negative" CHECK ((low_stock_threshold >= 0)),
  CONSTRAINT "product_variants_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "product_variants_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_variants_price_non_negative" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "product_variants_sku_not_blank" CHECK ((length(btrim(sku)) > 0)),
  CONSTRAINT "product_variants_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))),
  CONSTRAINT "product_variants_stock_non_negative" CHECK ((stock >= 0))
);

ALTER TABLE "public"."product_variants"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."products" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"                text                     NOT NULL,
  "description"         text,
  "price"               numeric(12,2)            NOT NULL DEFAULT 0,
  "stock"               integer                  NOT NULL DEFAULT 0,
  "status"              text                     NOT NULL DEFAULT 'active'::text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "organization_id"     uuid                     NOT NULL,
  "category_id"         uuid,
  "sku"                 text,
  "cost_price"          numeric                  NOT NULL DEFAULT 0,
  "metadata"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "low_stock_threshold" integer                  NOT NULL DEFAULT 10,
  CONSTRAINT "products_cost_price_non_negative" CHECK ((cost_price >= (0)::numeric)),
  CONSTRAINT "products_id_organization_id_key" UNIQUE (id, organization_id),
  CONSTRAINT "products_low_stock_threshold_non_negative" CHECK ((low_stock_threshold >= 0)),
  CONSTRAINT "products_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text)),
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_price_non_negative" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "products_sku_not_blank" CHECK (((sku IS NULL) OR (length(btrim(sku)) > 0))),
  CONSTRAINT "products_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))),
  CONSTRAINT "products_stock_non_negative" CHECK ((stock >= 0))
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."publishing_channel_destinations" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"         uuid                     NOT NULL,
  "provider"                text                     NOT NULL,
  "destination_type"        text                     NOT NULL,
  "external_destination_id" text                     NOT NULL,
  "display_name"            text                     NOT NULL,
  "status"                  text                     NOT NULL DEFAULT 'active'::text,
  "capabilities"            text[]                   NOT NULL DEFAULT ARRAY[]::text[],
  "is_selected"             boolean                  NOT NULL DEFAULT false,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "publishing_channel_destinations_capabilities_check"
    CHECK (((cardinality(capabilities) <= 3) AND (capabilities <@ ARRAY['publish_text'::text, 'publish_image'::text, 'publish_video'::text]) AND (cardinality(capabilities) = ((
CASE
    WHEN ('publish_text'::text = ANY (capabilities)) THEN 1
    ELSE 0
END +
CASE
    WHEN ('publish_image'::text = ANY (capabilities)) THEN 1
    ELSE 0
END) +
CASE
    WHEN ('publish_video'::text = ANY (capabilities)) THEN 1
    ELSE 0
END)))),
  CONSTRAINT "publishing_channel_destinations_external_id_check"
    CHECK (((external_destination_id = btrim(external_destination_id)) AND ((length(external_destination_id) >= 1) AND (length(external_destination_id) <= 255)))),
  CONSTRAINT "publishing_channel_destinations_name_check" CHECK (((display_name = btrim(display_name)) AND ((length(display_name) >= 1) AND (length(display_name) <= 200)))),
  CONSTRAINT "publishing_channel_destinations_pkey" PRIMARY KEY (id),
  CONSTRAINT "publishing_channel_destinations_provider_check"
    CHECK (((provider = lower(btrim(provider))) AND ((length(provider) >= 1) AND (length(provider) <= 100)) AND (provider ~ '^[a-z0-9][a-z0-9._-]{0,99}$'::text))),
  CONSTRAINT "publishing_channel_destinations_selection_check" CHECK (((NOT is_selected) OR (status = 'active'::text))),
  CONSTRAINT "publishing_channel_destinations_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'revoked'::text]))),
  CONSTRAINT "publishing_channel_destinations_type_check" CHECK ((destination_type = ANY (ARRAY['account'::text, 'page'::text, 'channel'::text])))
);

ALTER TABLE "public"."publishing_channel_destinations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."publishing_provider_connections" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"         uuid                     NOT NULL,
  "provider"                text                     NOT NULL,
  "external_account_id"     text                     NOT NULL,
  "authorization_status"    text                     NOT NULL,
  "granted_scopes"          text[]                   NOT NULL DEFAULT '{}'::text[],
  "supported_capabilities"  text[]                   NOT NULL DEFAULT '{}'::text[],
  "credential_reference_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "credential_expires_at"   timestamp with time zone,
  "credential_updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "connected_by_user_id"    uuid,
  "authorized_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "revoked_at"              timestamp with time zone,
  "version"                 bigint                   NOT NULL DEFAULT 1,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "publishing_provider_connections_authorization_status_check"
    CHECK ((authorization_status = ANY (ARRAY['authorized'::text, 'reauthorization_required'::text, 'revoked'::text]))),
  CONSTRAINT "publishing_provider_connections_capabilities_valid" CHECK ((supported_capabilities <@ ARRAY['publish_text'::text, 'publish_image'::text, 'publish_video'::text])),
  CONSTRAINT "publishing_provider_connections_credential_reference_unique" UNIQUE (credential_reference_id),
  CONSTRAINT "publishing_provider_connections_external_account_nonempty" CHECK ((btrim(external_account_id) <> ''::text)),
  CONSTRAINT "publishing_provider_connections_id_credential_reference_unique" UNIQUE (id, credential_reference_id),
  CONSTRAINT "publishing_provider_connections_identity_unique" UNIQUE (organization_id, PROVIDER, external_account_id),
  CONSTRAINT "publishing_provider_connections_pkey" PRIMARY KEY (id),
  CONSTRAINT "publishing_provider_connections_provider_nonempty" CHECK ((btrim(provider) <> ''::text)),
  CONSTRAINT "publishing_provider_connections_provider_normalized" CHECK ((provider = lower(btrim(provider)))),
  CONSTRAINT "publishing_provider_connections_revocation_consistent" CHECK ((((authorization_status = 'revoked'::text) AND (revoked_at IS
    NOT NULL)) OR ((authorization_status <> 'revoked'::text) AND (revoked_at IS NULL)))),
  CONSTRAINT "publishing_provider_connections_version_check" CHECK ((version >= 1))
);

ALTER TABLE "public"."publishing_provider_connections"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."publishing_provider_credentials" (
  "id"                       uuid                     NOT NULL,
  "connection_id"            uuid                     NOT NULL,
  "credential_kind"          text                     NOT NULL DEFAULT 'publishing_provider_oauth'::text,
  "storage_kind"             text                     NOT NULL DEFAULT 'server_encrypted'::text,
  "access_token_ciphertext"  text                     NOT NULL,
  "refresh_token_ciphertext" text,
  "access_token_expires_at"  timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "token_type"               text,
  "encryption_key_version"   text                     NOT NULL,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "rotated_at"               timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "publishing_provider_credentials_access_ciphertext_nonempty" CHECK ((btrim(access_token_ciphertext) <> ''::text)),
  CONSTRAINT "publishing_provider_credentials_connection_id_key" UNIQUE (connection_id),
  CONSTRAINT "publishing_provider_credentials_credential_kind_check" CHECK ((credential_kind = 'publishing_provider_oauth'::text)),
  CONSTRAINT "publishing_provider_credentials_key_version_nonempty" CHECK ((btrim(encryption_key_version) <> ''::text)),
  CONSTRAINT "publishing_provider_credentials_pkey" PRIMARY KEY (id),
  CONSTRAINT "publishing_provider_credentials_refresh_ciphertext_nonempty" CHECK (((refresh_token_ciphertext IS NULL) OR (btrim(refresh_token_ciphertext) <> ''::text))),
  CONSTRAINT "publishing_provider_credentials_storage_kind_check" CHECK ((storage_kind = 'server_encrypted'::text))
);

ALTER TABLE "public"."publishing_provider_credentials"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."supplier_items" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"        uuid                     NOT NULL,
  "supplier_id"            uuid                     NOT NULL,
  "target_type"            text                     NOT NULL,
  "product_id"             uuid,
  "variant_id"             uuid,
  "supplier_sku"           text,
  "unit_cost"              numeric,
  "minimum_order_quantity" integer                  NOT NULL DEFAULT 1,
  "lead_time_days"         integer,
  "is_preferred"           boolean                  NOT NULL DEFAULT false,
  "notes"                  text,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "supplier_items_lead_time_days_check" CHECK (((lead_time_days IS NULL) OR (lead_time_days >= 0))),
  CONSTRAINT "supplier_items_minimum_order_quantity_check" CHECK ((minimum_order_quantity > 0)),
  CONSTRAINT "supplier_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "supplier_items_target_check" CHECK ((((target_type = 'product'::text) AND (product_id IS
    NOT NULL) AND (variant_id IS NULL)) OR ((target_type = 'variant'::text) AND (variant_id IS NOT NULL) AND (product_id IS NULL)))),
  CONSTRAINT "supplier_items_target_type_check" CHECK ((target_type = ANY (ARRAY['product'::text, 'variant'::text]))),
  CONSTRAINT "supplier_items_unit_cost_check" CHECK (((unit_cost IS NULL) OR (unit_cost >= (0)::numeric)))
);

ALTER TABLE "public"."supplier_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."suppliers" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "name"            text                     NOT NULL,
  "contact_name"    text,
  "email"           text,
  "phone"           text,
  "address"         text,
  "notes"           text,
  "status"          text                     NOT NULL DEFAULT 'active'::text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "suppliers_id_organization_id_key" UNIQUE (id, organization_id),
  CONSTRAINT "suppliers_name_not_blank" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "suppliers_pkey" PRIMARY KEY (id),
  CONSTRAINT "suppliers_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

ALTER TABLE "public"."suppliers"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ai_controlled_publications"
  ADD COLUMN "legacy_authorized_shop_id" uuid GENERATED ALWAYS AS (
CASE
    WHEN ((contract_version = 1) AND (target_resource = 'marketplace_authorized_shop'::text)) THEN target_id
    ELSE NULL::uuid
END) STORED;

ALTER TABLE "public"."ai_controlled_publications"
  ADD COLUMN "publishing_destination_id" uuid GENERATED ALWAYS AS (
CASE
    WHEN ((contract_version = 2) AND (target_resource = 'publishing_channel_destination'::text)) THEN target_id
    ELSE NULL::uuid
END) STORED;

CREATE OR REPLACE FUNCTION public.activate_billing_checkout_entitlement (
  p_checkout_session_id uuid
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare

  v_checkout
    public.billing_checkout_sessions%rowtype;

  v_plan
    public.billing_plans%rowtype;

  v_existing_subscription
    public.organization_subscriptions%rowtype;

  v_existing_plan_slug text;

  v_activation
    public.billing_checkout_entitlement_activations%rowtype;

  v_entitlement_start timestamptz;
  v_entitlement_end timestamptz;

  v_subscription_start timestamptz;

  v_result_code text;

begin

  if p_checkout_session_id is null then
    raise exception
      'checkout session id is required';
  end if;


  select c.*
  into v_checkout
  from public.billing_checkout_sessions c
  where c.id = p_checkout_session_id
  for update;


  if v_checkout.id is null then
    return 'missing_checkout';
  end if;


  if v_checkout.status <> 'completed' then
    return 'checkout_not_completed';
  end if;


  if v_checkout.completed_at is null then
    return 'checkout_completion_missing';
  end if;


  if length(
    btrim(
      coalesce(
        v_checkout.provider_transaction_id,
        ''
      )
    )
  ) = 0 then
    return 'provider_transaction_missing';
  end if;


  if v_checkout.plan_slug not in (
    'starter',
    'pro'
  ) then
    return 'unsupported_commercial_plan';
  end if;


  if v_checkout.billing_interval not in (
    'monthly',
    'annual'
  ) then
    return 'unsupported_billing_interval';
  end if;


  select p.*
  into v_plan
  from public.billing_plans p
  where p.id = v_checkout.plan_id
    and p.slug = v_checkout.plan_slug
    and p.is_active
  limit 1;


  if v_plan.id is null then
    return 'billing_plan_not_available';
  end if;


  insert into
    public.billing_checkout_entitlement_activations (
      checkout_session_id,
      organization_id,
      plan_id,
      provider,
      reference_id,
      billing_interval,
      status,
      metadata
    )
  values (
    v_checkout.id,
    v_checkout.organization_id,
    v_checkout.plan_id,
    lower(btrim(v_checkout.provider)),
    v_checkout.reference_id,
    v_checkout.billing_interval,
    'pending',
    jsonb_build_object(
      'entitlement_source',
        'completed_checkout',
      'checkout_session_id',
        v_checkout.id,
      'checkout_reference_id',
        v_checkout.reference_id,
      'billing_interval',
        v_checkout.billing_interval,
      'payment_provider',
        lower(btrim(v_checkout.provider))
    )
  )
  on conflict (checkout_session_id)
  do nothing;


  select a.*
  into v_activation
  from public.billing_checkout_entitlement_activations a
  where a.checkout_session_id = v_checkout.id
  for update;


  if v_activation.id is null then
    raise exception
      'entitlement activation ledger unavailable';
  end if;


  if v_activation.status = 'applied' then
    return 'already_applied';
  end if;


  if v_activation.status = 'policy_hold' then
    return coalesce(
      nullif(
        btrim(v_activation.result_code),
        ''
      ),
      'policy_hold'
    );
  end if;


  select s.*
  into v_existing_subscription
  from public.organization_subscriptions s
  where s.organization_id =
        v_checkout.organization_id
  for update;


  v_existing_plan_slug := null;


  if v_existing_subscription.organization_id
     is not null then

    select p.slug
    into v_existing_plan_slug
    from public.billing_plans p
    where p.id =
          v_existing_subscription.plan_id
    limit 1;

  end if;


  if
    v_existing_subscription.organization_id
      is not null

    and v_existing_subscription.status
      in ('active', 'trialing')

    and v_existing_plan_slug
      in ('starter', 'pro')

    and v_existing_plan_slug
      <> v_checkout.plan_slug

    and v_existing_subscription.current_period_end
      is not null

    and v_existing_subscription.current_period_end
      > v_checkout.completed_at
  then

    update
      public.billing_checkout_entitlement_activations
    set
      status = 'policy_hold',
      result_code =
        'active_paid_plan_change_requires_policy',
      updated_at = now()
    where id = v_activation.id;


    return
      'active_paid_plan_change_requires_policy';

  end if;


  v_entitlement_start :=
    v_checkout.completed_at;

  v_subscription_start :=
    v_checkout.completed_at;


  if
    v_existing_subscription.organization_id
      is not null

    and v_existing_subscription.status
      in ('active', 'trialing')

    and v_existing_plan_slug
      = v_checkout.plan_slug

    and v_existing_subscription.current_period_end
      is not null

    and v_existing_subscription.current_period_end
      > v_checkout.completed_at
  then

    v_entitlement_start :=
      v_existing_subscription.current_period_end;


    v_subscription_start :=
      coalesce(
        v_existing_subscription.current_period_start,
        v_checkout.completed_at
      );

  end if;


  if v_checkout.billing_interval = 'monthly' then
    v_entitlement_end :=
      v_entitlement_start
      + interval '1 month';
  end if;


  if v_checkout.billing_interval = 'annual' then
    v_entitlement_end :=
      v_entitlement_start
      + interval '1 year';
  end if;


  if v_entitlement_end is null
     or v_entitlement_end
        <= v_entitlement_start then
    raise exception
      'entitlement period calculation failed';
  end if;


  v_result_code := 'activated';


  if
    v_existing_subscription.organization_id
      is not null

    and v_existing_plan_slug
      = v_checkout.plan_slug

    and v_existing_subscription.status
      in ('active', 'trialing')

    and v_existing_subscription.current_period_end
      is not null

    and v_existing_subscription.current_period_end
      > v_checkout.completed_at
  then
    v_result_code := 'renewed';
  end if;


  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    provider,
    provider_customer_id,
    provider_subscription_id,
    status,
    current_period_start,
    current_period_end,
    trial_ends_at,
    cancel_at_period_end,
    metadata,
    updated_at
  )
  values (
    v_checkout.organization_id,
    v_checkout.plan_id,
    lower(btrim(v_checkout.provider)),
    null,
    null,
    'active',
    v_subscription_start,
    v_entitlement_end,
    null,
    true,
    jsonb_build_object(
      'entitlement_source',
        'completed_checkout',
      'checkout_session_id',
        v_checkout.id,
      'checkout_reference_id',
        v_checkout.reference_id,
      'billing_interval',
        v_checkout.billing_interval,
      'payment_provider',
        lower(btrim(v_checkout.provider)),
      'last_entitlement_activation_result',
        v_result_code
    ),
    now()
  )
  on conflict (organization_id)
  do update set
    plan_id = excluded.plan_id,
    provider = excluded.provider,

    -- A one-time checkout payment is not a recurring
    -- provider subscription contract.
    provider_customer_id = null,
    provider_subscription_id = null,

    status = excluded.status,
    current_period_start =
      excluded.current_period_start,
    current_period_end =
      excluded.current_period_end,
    trial_ends_at = null,
    cancel_at_period_end = true,

    metadata =
      coalesce(
        public.organization_subscriptions.metadata,
        '{}'::jsonb
      )
      || excluded.metadata,

    updated_at = now();


  update
    public.billing_checkout_entitlement_activations
  set
    status = 'applied',
    result_code = v_result_code,
    entitlement_period_start =
      v_entitlement_start,
    entitlement_period_end =
      v_entitlement_end,
    applied_at = now(),
    updated_at = now()
  where id = v_activation.id;


  return v_result_code;

end;

$function$;

CREATE OR REPLACE FUNCTION public.adjust_inventory (
  p_organization_id uuid,
  p_quantity_delta  integer,
  p_product_id      uuid    DEFAULT NULL::uuid,
  p_variant_id      uuid    DEFAULT NULL::uuid,
  p_note            text    DEFAULT NULL::text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_stock_before integer;
  v_stock_after integer;
  v_target_type text;
  v_target_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception 'User is not a member of this organization'
      using errcode = '42501';
  end if;

  if p_quantity_delta is null
     or p_quantity_delta = 0 then
    raise exception 'Inventory adjustment must be non-zero'
      using errcode = 'P0001';
  end if;

  if (
    p_product_id is null
    and p_variant_id is null
  )
  or (
    p_product_id is not null
    and p_variant_id is not null
  ) then
    raise exception
      'Exactly one inventory target is required'
      using errcode = 'P0001';
  end if;

  perform set_config(
    'app.inventory_movement_type',
    'adjustment',
    true
  );

  perform set_config(
    'app.inventory_reference_type',
    'manual_adjustment',
    true
  );

  perform set_config(
    'app.inventory_reference_id',
    '',
    true
  );

  perform set_config(
    'app.inventory_note',
    coalesce(nullif(btrim(p_note), ''), ''),
    true
  );

  if p_product_id is not null then
    v_target_type := 'product';
    v_target_id := p_product_id;

    select stock
      into v_stock_before
    from public.products
    where id = p_product_id
      and organization_id = p_organization_id
    for update;

    if not found then
      raise exception
        'Product not found in this organization'
        using errcode = 'P0001';
    end if;

    v_stock_after := v_stock_before + p_quantity_delta;

    if v_stock_after < 0 then
      raise exception 'Insufficient product stock'
        using errcode = 'P0001';
    end if;

    update public.products
    set stock = v_stock_after
    where id = p_product_id
      and organization_id = p_organization_id;

  else
    v_target_type := 'variant';
    v_target_id := p_variant_id;

    select stock
      into v_stock_before
    from public.product_variants
    where id = p_variant_id
      and organization_id = p_organization_id
    for update;

    if not found then
      raise exception
        'Product variant not found in this organization'
        using errcode = 'P0001';
    end if;

    v_stock_after := v_stock_before + p_quantity_delta;

    if v_stock_after < 0 then
      raise exception 'Insufficient product variant stock'
        using errcode = 'P0001';
    end if;

    update public.product_variants
    set stock = v_stock_after
    where id = p_variant_id
      and organization_id = p_organization_id;
  end if;

  perform set_config(
    'app.inventory_movement_type',
    '',
    true
  );

  perform set_config(
    'app.inventory_reference_type',
    '',
    true
  );

  perform set_config(
    'app.inventory_reference_id',
    '',
    true
  );

  perform set_config(
    'app.inventory_note',
    '',
    true
  );

  return jsonb_build_object(
    'target_type', v_target_type,
    'target_id', v_target_id,
    'quantity_delta', p_quantity_delta,
    'stock_before', v_stock_before,
    'stock_after', v_stock_after
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.append_ai_agent_step (
  p_run_id        uuid,
  p_step_type     text,
  p_tool_name     text  DEFAULT NULL::text,
  p_input_data    jsonb DEFAULT '{}'::jsonb,
  p_output_data   jsonb DEFAULT '{}'::jsonb,
  p_status        text  DEFAULT 'completed'::text,
  p_error_message text  DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;
  v_run_status text;
  v_step_number integer;
  v_step uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select
    organization_id,
    status
  into
    v_org,
    v_run_status
  from public.ai_agent_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception 'AI agent run not found';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'Organization access denied';
  end if;

  if v_run_status <> 'running' then
    raise exception
      'Steps may only be appended to running agent runs';
  end if;

  if p_step_type not in (
    'context',
    'analysis',
    'recommendation',
    'system'
  ) then
    raise exception 'Unsupported agent step type';
  end if;

  if p_status not in (
    'completed',
    'failed'
  ) then
    raise exception 'Unsupported agent step status';
  end if;

  if p_input_data is null
     or jsonb_typeof(p_input_data) <> 'object' then
    raise exception 'Step input must be a JSON object';
  end if;

  if p_output_data is null
     or jsonb_typeof(p_output_data) <> 'object' then
    raise exception 'Step output must be a JSON object';
  end if;

  select
    coalesce(max(step_number), 0) + 1
  into
    v_step_number
  from public.ai_agent_steps
  where run_id = p_run_id;

  insert into public.ai_agent_steps (
    id,
    organization_id,
    run_id,
    step_number,
    step_type,
    tool_name,
    status,
    input_data,
    output_data,
    error_message
  )
  values (
    v_step,
    v_org,
    p_run_id,
    v_step_number,
    p_step_type,
    nullif(btrim(p_tool_name), ''),
    p_status,
    p_input_data,
    p_output_data,
    nullif(btrim(p_error_message), '')
  );

  return v_step;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_marketplace_connection_token_refresh (
  p_organization_id                   uuid,
  p_marketplace_account_id            uuid,
  p_user_id                           uuid,
  p_expected_refresh_token_ciphertext text,
  p_access_token_ciphertext           text,
  p_refresh_token_ciphertext          text,
  p_access_token_expires_at           timestamp with time zone,
  p_refresh_token_expires_at          timestamp with time zone,
  p_open_id                           text,
  p_user_type                         integer,
  p_granted_scopes                    text[],
  p_request_id                        text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_connection public.marketplace_connections%rowtype;
  v_provider text;
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception
      'user is not an organization member'
      using errcode = '42501';
  end if;

  select c.*
  into v_connection
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id =
        p_marketplace_account_id
  for update;

  if not found then
    raise exception
      'marketplace connection not found';
  end if;

  v_provider :=
    lower(
      btrim(
        coalesce(v_connection.provider, '')
      )
    );

  if v_provider not in (
    'tiktok_shop',
    'shopee'
  ) then
    raise exception
      'marketplace connection provider does not support token refresh';
  end if;

  if v_connection.status <> 'active' then
    raise exception
      'marketplace connection is not active';
  end if;

  if length(
       btrim(
         coalesce(
           p_expected_refresh_token_ciphertext,
           ''
         )
       )
     ) = 0 then
    raise exception
      'expected refresh-token ciphertext is required';
  end if;

  -- Optimistic concurrency guard.
  -- If another request already rotated the refresh token,
  -- reload rather than overwrite the newer token set.
  if v_connection.refresh_token_ciphertext <>
     p_expected_refresh_token_ciphertext then
    return false;
  end if;

  if length(
       btrim(
         coalesce(
           p_access_token_ciphertext,
           ''
         )
       )
     ) = 0
     or length(
       btrim(
         coalesce(
           p_refresh_token_ciphertext,
           ''
         )
       )
     ) = 0 then
    raise exception
      'encrypted marketplace tokens are required';
  end if;

  if p_access_token_expires_at is null
     or p_access_token_expires_at <= now() then
    raise exception
      'refreshed access token expiry must be in the future';
  end if;

  -- TikTok Shop supplies a bounded refresh-token expiry.
  if v_provider = 'tiktok_shop' then
    if p_refresh_token_expires_at is null
       or p_refresh_token_expires_at <= now() then
      raise exception
        'refreshed refresh token expiry must be in the future';
    end if;
  end if;

  -- Shopee's current token contract has no refresh-token expiry.
  -- NULL is therefore valid. If a future Shopee response supplies
  -- an expiry, it must still be in the future.
  if v_provider = 'shopee'
     and p_refresh_token_expires_at is not null
     and p_refresh_token_expires_at <= now() then
    raise exception
      'Shopee refresh token expiry must be in the future when provided';
  end if;

  if length(
       btrim(
         coalesce(
           p_open_id,
           ''
         )
       )
     ) = 0 then
    raise exception
      'refreshed seller open_id is required';
  end if;

  -- Stable seller/shop identity is common to both providers.
  if v_connection.open_id is not null
     and v_connection.open_id <> p_open_id then
    raise exception
      'refreshed seller identity does not match connection';
  end if;

  -- Preserve existing TikTok seller semantics exactly.
  if v_provider = 'tiktok_shop' then
    if p_user_type is distinct from 0 then
      raise exception
        'refreshed authorization is not a seller authorization';
    end if;

    if v_connection.user_type is not null
       and v_connection.user_type <> p_user_type then
      raise exception
        'refreshed seller user type does not match connection';
    end if;
  end if;

  -- Shopee shop OAuth has no TikTok-style user_type.
  if v_provider = 'shopee'
     and p_user_type is not null then
    raise exception
      'Shopee authorization user_type must be null';
  end if;

  update public.marketplace_connections
  set
    access_token_ciphertext =
      p_access_token_ciphertext,

    refresh_token_ciphertext =
      p_refresh_token_ciphertext,

    access_token_expires_at =
      p_access_token_expires_at,

    refresh_token_expires_at =
      p_refresh_token_expires_at,

    open_id =
      coalesce(
        open_id,
        p_open_id
      ),

    user_type =
      case
        when v_provider = 'shopee'
          then null
        else coalesce(
          user_type,
          p_user_type
        )
      end,

    granted_scopes =
      coalesce(
        p_granted_scopes,
        granted_scopes,
        '{}'::text[]
      ),

    status = 'active',

    last_refreshed_at = now(),

    metadata =
      coalesce(
        metadata,
        '{}'::jsonb
      )
      || jsonb_build_object(
        'last_token_refresh',
        jsonb_strip_nulls(
          jsonb_build_object(
            'request_id',
            nullif(
              btrim(
                coalesce(
                  p_request_id,
                  ''
                )
              ),
              ''
            ),
            'refreshed_at',
            now()
          )
        )
      ),

    updated_at = now()

  where id = v_connection.id;

  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_marketplace_order_status_reconciliation (
  p_external_order_row_id    uuid,
  p_expected_external_status text,
  p_expected_target_status   text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_external_order public.marketplace_external_orders%rowtype;
  v_order_link public.marketplace_order_links%rowtype;
  v_internal_status text;
  v_external_status text;
  v_target_status text;
  v_result text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select eo.*
  into v_external_order
  from public.marketplace_external_orders eo
  where eo.id = p_external_order_row_id
  for update;

  if v_external_order.id is null then
    raise exception 'External marketplace order not found';
  end if;

  if not public.is_organization_member(
    v_external_order.organization_id
  ) then
    raise exception 'User is not a member of this organization'
      using errcode = '42501';
  end if;

  select l.*
  into v_order_link
  from public.marketplace_order_links l
  where l.organization_id =
        v_external_order.organization_id
    and l.marketplace_account_id =
        v_external_order.marketplace_account_id
    and l.external_order_id =
        v_external_order.external_order_id
  order by l.created_at desc
  limit 1
  for update;

  if v_order_link.id is null then
    raise exception 'External marketplace order is not linked to an internal order';
  end if;

  select o.status
  into v_internal_status
  from public.orders o
  where o.id = v_order_link.order_id
    and o.organization_id =
        v_external_order.organization_id
  for update;

  if v_internal_status is null then
    raise exception 'Linked internal order not found';
  end if;

  v_external_status :=
    upper(btrim(v_external_order.external_status));

  if v_external_status <>
     upper(btrim(coalesce(p_expected_external_status, ''))) then
    raise exception
      'Marketplace order status changed. Refresh before approving reconciliation.';
  end if;

  v_target_status :=
    case
      when v_internal_status in ('completed', 'cancelled')
        then null

      when v_external_status in (
        'UNPAID',
        'ON_HOLD'
      )
        then null

      when v_external_status in (
        'AWAITING_SHIPMENT',
        'PARTIALLY_SHIPPING',
        'AWAITING_COLLECTION',
        'IN_TRANSIT',
        'DELIVERED'
      )
      and v_internal_status = 'pending'
        then 'processing'

      when v_external_status = 'COMPLETED'
      and v_internal_status = 'pending'
        then 'processing'

      when v_external_status = 'COMPLETED'
      and v_internal_status = 'processing'
        then 'completed'

      when v_external_status in (
        'CANCEL',
        'CANCELLED'
      )
      and v_internal_status in (
        'pending',
        'processing'
      )
        then 'cancelled'

      else null
    end;

  if v_target_status is null then
    raise exception
      'No supported reconciliation action for marketplace status % and internal status %',
      v_external_status,
      v_internal_status;
  end if;

  if v_target_status <>
     lower(btrim(coalesce(p_expected_target_status, ''))) then
    raise exception
      'Reconciliation proposal changed. Refresh before approving reconciliation.';
  end if;

  -- Existing commerce authority:
  -- pending -> processing deducts stock
  -- pending -> cancelled does not deduct stock
  -- processing -> completed keeps stock deducted
  -- processing -> cancelled restores stock
  v_result :=
    public.update_order_status(
      v_external_order.organization_id,
      v_order_link.order_id,
      v_target_status
    );

  update public.marketplace_order_links
  set
    external_status = v_external_order.external_status,
    last_synced_at = now(),
    updated_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'last_status_reconciliation',
        jsonb_build_object(
          'external_order_row_id', v_external_order.id,
          'external_status', v_external_status,
          'internal_status_before', v_internal_status,
          'internal_status_after', v_result,
          'approved_by', auth.uid(),
          'approved_at', now()
        )
      )
  where id = v_order_link.id;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    entity_id,
    external_id,
    message,
    metadata
  )
  values (
    v_external_order.organization_id,
    v_external_order.marketplace_account_id,
    'inbound',
    'order',
    'controlled_status_reconciliation',
    'success',
    v_order_link.order_id,
    v_external_order.external_order_id,
    format(
      'Approved marketplace status reconciliation: %s -> %s.',
      v_internal_status,
      v_result
    ),
    jsonb_build_object(
      'external_order_row_id', v_external_order.id,
      'external_status', v_external_status,
      'internal_status_before', v_internal_status,
      'internal_status_after', v_result,
      'approved_by', auth.uid()
    )
  );

  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_product_description_generation (
  p_generation_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;
  v_product uuid;
  v_status text;
  v_description text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select
    organization_id,
    product_id,
    status,
    generated_description
  into
    v_org,
    v_product,
    v_status,
    v_description
  from public.product_description_generations
  where id = p_generation_id;

  if not found then
    raise exception 'Description generation not found';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'Organization access denied';
  end if;

  if v_status <> 'completed' then
    raise exception
      'Only completed description generations may be applied';
  end if;

  if v_description is null
     or length(btrim(v_description)) = 0 then
    raise exception
      'Generated description is empty';
  end if;

  update public.products
  set
    description = v_description
  where id = v_product
    and organization_id = v_org;

  if not found then
    raise exception 'Product not found';
  end if;

  return v_product;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_product_research_ai_run (
  p_run_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;
  v_item uuid;
  v_status text;

  v_demand integer;
  v_competition integer;
  v_opportunity integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select
    organization_id,
    research_item_id,
    status,
    ai_demand_score,
    ai_competition_score,
    ai_opportunity_score
  into
    v_org,
    v_item,
    v_status,
    v_demand,
    v_competition,
    v_opportunity
  from public.product_research_ai_runs
  where id = p_run_id;

  if not found then
    raise exception 'AI research run not found';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'Organization access denied';
  end if;

  if v_status <> 'completed' then
    raise exception
      'Only completed AI research may be applied';
  end if;

  update public.product_research_items
  set
    demand_score =
      coalesce(v_demand, demand_score),

    competition_score =
      coalesce(v_competition, competition_score),

    opportunity_score =
      coalesce(v_opportunity, opportunity_score),

    updated_at = now()
  where id = v_item
    and organization_id = v_org;

  if not found then
    raise exception 'Research candidate not found';
  end if;

  return v_item;
end;
$function$;

CREATE OR REPLACE FUNCTION public.attach_billing_checkout_provider_session (
  p_checkout_session_id uuid,
  p_external_session_id text,
  p_checkout_url        text,
  p_expires_at          timestamp with time zone DEFAULT NULL::timestamp WITH time zone
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_session public.billing_checkout_sessions%rowtype;
begin
  if p_checkout_session_id is null then
    raise exception
      'checkout session id is required';
  end if;

  if length(
    btrim(
      coalesce(
        p_external_session_id,
        ''
      )
    )
  ) = 0 then
    raise exception
      'external session id is required';
  end if;

  if length(
    btrim(
      coalesce(
        p_checkout_url,
        ''
      )
    )
  ) = 0 then
    raise exception
      'checkout url is required';
  end if;

  select s.*
  into v_session
  from public.billing_checkout_sessions s
  where s.id =
        p_checkout_session_id
  for update;

  if v_session.id is null then
    return 'missing_session';
  end if;

  if v_session.status = 'ready' then

    if v_session.external_session_id =
         btrim(p_external_session_id)
       and v_session.checkout_url =
         btrim(p_checkout_url) then

      return 'already_ready';
    end if;

    raise exception
      'checkout session already attached to a different provider session';
  end if;

  if v_session.status <> 'created' then
    return
      'session_not_attachable';
  end if;

  update public.billing_checkout_sessions
  set
    status = 'ready',
    external_session_id =
      btrim(p_external_session_id),
    checkout_url =
      btrim(p_checkout_url),
    expires_at =
      p_expires_at,
    provider_session_created_at =
      now(),
    updated_at =
      now()
  where id =
        p_checkout_session_id;

  return 'ready';
end;
$function$;

CREATE OR REPLACE FUNCTION public.bridge_marketplace_external_order (
  p_external_order_row_id uuid,
  p_customer_id           uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_external_order public.marketplace_external_orders%rowtype;
  v_item public.marketplace_external_order_items%rowtype;

  v_existing_order_id uuid;
  v_internal_order_id uuid;

  v_variant_match_count integer;
  v_product_match_count integer;

  v_product_id uuid;
  v_variant_id uuid;

  v_items jsonb := '[]'::jsonb;
  v_item_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select o.*
  into v_external_order
  from public.marketplace_external_orders o
  where o.id = p_external_order_row_id
  for update;

  if v_external_order.id is null then
    raise exception 'External marketplace order not found';
  end if;

  if not public.is_organization_member(
    v_external_order.organization_id
  ) then
    raise exception 'User is not a member of this organization'
      using errcode = '42501';
  end if;

  if v_external_order.is_sample_order then
    raise exception 'Sample marketplace orders cannot be bridged';
  end if;

  if not exists (
    select 1
    from public.customers c
    where c.id = p_customer_id
      and c.organization_id =
          v_external_order.organization_id
  ) then
    raise exception 'Customer not found in this organization';
  end if;

  select l.order_id
  into v_existing_order_id
  from public.marketplace_order_links l
  where l.organization_id =
        v_external_order.organization_id
    and l.marketplace_account_id =
        v_external_order.marketplace_account_id
    and l.external_order_id =
        v_external_order.external_order_id
  order by l.created_at desc
  limit 1;

  if v_existing_order_id is not null then
    return v_existing_order_id;
  end if;

  for v_item in
    select i.*
    from public.marketplace_external_order_items i
    where i.external_order_id = v_external_order.id
      and i.organization_id =
          v_external_order.organization_id
    order by i.created_at, i.id
  loop
    v_item_count := v_item_count + 1;

    v_product_id := null;
    v_variant_id := null;

    select
      count(*)::integer
    into v_variant_match_count
    from public.marketplace_listings l
    where l.organization_id =
          v_external_order.organization_id
      and l.marketplace_account_id =
          v_external_order.marketplace_account_id
      and l.target_type = 'variant'
      and l.variant_id is not null
      and l.listing_status = 'active'
      and l.sync_enabled = true
      and v_item.seller_sku is not null
      and l.external_sku is not null
      and lower(btrim(l.external_sku)) =
          lower(btrim(v_item.seller_sku));

    if v_variant_match_count > 1 then
      raise exception
        'Ambiguous variant mapping for external line item %',
        v_item.external_line_item_id;
    end if;

    if v_variant_match_count = 1 then
      select
        pv.product_id,
        l.variant_id
      into
        v_product_id,
        v_variant_id
      from public.marketplace_listings l
      join public.product_variants pv
        on pv.id = l.variant_id
       and pv.organization_id = l.organization_id
      where l.organization_id =
            v_external_order.organization_id
        and l.marketplace_account_id =
            v_external_order.marketplace_account_id
        and l.target_type = 'variant'
        and l.variant_id is not null
        and l.listing_status = 'active'
        and l.sync_enabled = true
        and v_item.seller_sku is not null
        and l.external_sku is not null
        and lower(btrim(l.external_sku)) =
            lower(btrim(v_item.seller_sku))
      limit 1;

    else
      select
        count(*)::integer
      into v_product_match_count
      from public.marketplace_listings l
      where l.organization_id =
            v_external_order.organization_id
        and l.marketplace_account_id =
            v_external_order.marketplace_account_id
        and l.target_type = 'product'
        and l.product_id is not null
        and l.listing_status = 'active'
        and l.sync_enabled = true
        and v_item.external_product_id is not null
        and l.external_listing_id is not null
        and btrim(l.external_listing_id) =
            btrim(v_item.external_product_id);

      if v_product_match_count > 1 then
        raise exception
          'Ambiguous product mapping for external line item %',
          v_item.external_line_item_id;
      end if;

      if v_product_match_count = 1 then
        select l.product_id
        into v_product_id
        from public.marketplace_listings l
        where l.organization_id =
              v_external_order.organization_id
          and l.marketplace_account_id =
              v_external_order.marketplace_account_id
          and l.target_type = 'product'
          and l.product_id is not null
          and l.listing_status = 'active'
          and l.sync_enabled = true
          and v_item.external_product_id is not null
          and l.external_listing_id is not null
          and btrim(l.external_listing_id) =
              btrim(v_item.external_product_id)
        limit 1;
      end if;
    end if;

    if v_product_id is null then
      raise exception
        'No active marketplace listing mapping for external line item %',
        v_item.external_line_item_id;
    end if;

    v_items :=
      v_items ||
      jsonb_build_array(
        jsonb_strip_nulls(
          jsonb_build_object(
            'product_id', v_product_id,
            'variant_id', v_variant_id,
            'quantity', v_item.quantity
          )
        )
      );
  end loop;

  if v_item_count = 0 then
    raise exception 'External marketplace order has no line items';
  end if;

  -- Existing commerce authority. This function validates tenant/customer/items,
  -- snapshots internal server-side price/cost, and creates a pending order.
  v_internal_order_id :=
    public.create_order(
      v_external_order.organization_id,
      p_customer_id,
      v_items
    );

  insert into public.marketplace_order_links (
    organization_id,
    marketplace_account_id,
    order_id,
    external_order_id,
    external_status,
    last_synced_at,
    metadata
  )
  values (
    v_external_order.organization_id,
    v_external_order.marketplace_account_id,
    v_internal_order_id,
    v_external_order.external_order_id,
    v_external_order.external_status,
    now(),
    jsonb_build_object(
      'source', 'controlled_external_order_bridge',
      'external_order_row_id', v_external_order.id,
      'external_payment_currency',
        v_external_order.payment_currency,
      'external_payment_total',
        v_external_order.payment_total_amount,
      'bridged_by', auth.uid()
    )
  );

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    entity_id,
    external_id,
    message,
    metadata
  )
  values (
    v_external_order.organization_id,
    v_external_order.marketplace_account_id,
    'inbound',
    'order',
    'controlled_order_bridge',
    'success',
    v_internal_order_id,
    v_external_order.external_order_id,
    'External marketplace order bridged to a pending internal order.',
    jsonb_build_object(
      'customer_id', p_customer_id,
      'external_order_row_id', v_external_order.id,
      'item_count', v_item_count
    )
  );

  return v_internal_order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_ai_allowance (
  p_organization_id uuid
)
  RETURNS TABLE (
    allowed                  boolean,
    reason                   text,
    credit_balance           bigint,
    month_estimated_cost_usd numeric,
    monthly_cost_limit_usd   numeric
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_credit_enforcement boolean := false;
  v_cost_enforcement boolean := false;
  v_cost_limit numeric(20,8);
  v_credit_balance bigint := 0;
  v_month_cost numeric(20,10) := 0;
begin
  select
    c.credit_enforcement_enabled,
    c.cost_enforcement_enabled,
    c.monthly_cost_limit_usd
  into
    v_credit_enforcement,
    v_cost_enforcement,
    v_cost_limit
  from public.organization_ai_controls c
  where c.organization_id = p_organization_id;

  v_credit_enforcement := coalesce(v_credit_enforcement, false);
  v_cost_enforcement := coalesce(v_cost_enforcement, false);

  select coalesce(sum(l.amount), 0)
  into v_credit_balance
  from public.ai_credit_ledger l
  where l.organization_id = p_organization_id;

  select coalesce(sum(u.estimated_cost_usd), 0)
  into v_month_cost
  from public.ai_usage_ledger u
  where u.organization_id = p_organization_id
    and u.created_at >= date_trunc('month', now())
    and u.created_at < date_trunc('month', now()) + interval '1 month';

  if v_credit_enforcement and v_credit_balance <= 0 then
    return query
    select
      false,
      'ai_credit_balance_exhausted'::text,
      v_credit_balance,
      v_month_cost,
      v_cost_limit;
    return;
  end if;

  if v_cost_enforcement
     and v_cost_limit is not null
     and v_month_cost >= v_cost_limit then
    return query
    select
      false,
      'monthly_ai_cost_limit_reached'::text,
      v_credit_balance,
      v_month_cost,
      v_cost_limit;
    return;
  end if;

  return query
  select
    true,
    'allowed'::text,
    v_credit_balance,
    v_month_cost,
    v_cost_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_billing_checkout_intent (
  p_organization_id  uuid,
  p_provider         text,
  p_plan_slug        text,
  p_billing_interval text,
  p_metadata         jsonb DEFAULT '{}'::jsonb
)
  RETURNS TABLE (
    claim_result        text,
    checkout_session_id uuid,
    organization_id     uuid,
    provider            text,
    reference_id        text,
    plan_id             uuid,
    plan_slug           text,
    billing_interval    text,
    amount              numeric,
    currency            text,
    status              text,
    external_session_id text,
    checkout_url        text,
    expires_at          timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_plan public.billing_plans%rowtype;
  v_existing public.billing_checkout_sessions%rowtype;
  v_session public.billing_checkout_sessions%rowtype;

  v_provider text;
  v_plan_slug text;
  v_interval text;
  v_currency text;
  v_reference_id text;
  v_amount numeric;

  -- A created checkout updated inside this window is considered
  -- actively owned by another HTTP request. This avoids a second
  -- provider-session creation call during double-click/retry races.
  v_creation_lease interval :=
    interval '5 minutes';

begin

  if p_organization_id is null then
    raise exception
      'organization id is required';
  end if;


  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  v_plan_slug :=
    btrim(
      coalesce(
        p_plan_slug,
        ''
      )
    );

  v_interval :=
    btrim(
      coalesce(
        p_billing_interval,
        ''
      )
    );


  if length(v_provider) = 0 then
    raise exception
      'provider is required';
  end if;

  if length(v_plan_slug) = 0 then
    raise exception
      'plan slug is required';
  end if;

  if v_plan_slug not in (
    'starter',
    'pro'
  ) then
    raise exception
      'unsupported commercial plan';
  end if;

  if v_interval not in (
    'monthly',
    'annual'
  ) then
    raise exception
      'unsupported billing interval';
  end if;

  if jsonb_typeof(
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  ) <> 'object' then
    raise exception
      'metadata must be a json object';
  end if;


  if not exists (
    select 1
    from public.organizations o
    where o.id =
          p_organization_id
  ) then
    raise exception
      'organization not found';
  end if;


  select p.*
  into v_plan
  from public.billing_plans p
  where p.slug =
        v_plan_slug
    and p.is_active
  limit 1;


  if v_plan.id is null then
    raise exception
      'billing plan not found or inactive';
  end if;


  v_currency :=
    upper(
      btrim(
        coalesce(
          v_plan.currency,
          ''
        )
      )
    );


  if length(v_currency) = 0 then
    raise exception
      'billing plan currency is missing';
  end if;


  if v_interval = 'monthly' then
    v_amount :=
      v_plan.price_monthly;
  end if;

  if v_interval = 'annual' then
    v_amount :=
      v_plan.price_annual;
  end if;


  if v_amount is null
     or v_amount <= 0 then
    raise exception
      'billing plan price is missing or invalid';
  end if;


  -- ==========================================================
  -- Serialize one checkout intent.
  --
  -- The lock exists only for this RPC transaction. Durable
  -- ownership after return is represented by a fresh `created`
  -- row whose updated_at acts as a bounded creation lease.
  -- ==========================================================

  perform pg_advisory_xact_lock(
    hashtextextended(
      concat_ws(
        '|',
        'billing-checkout-intent-v1',
        p_organization_id::text,
        v_provider,
        v_plan_slug,
        v_interval
      ),
      0
    )
  );


  -- ==========================================================
  -- 1. Reuse a valid provider session that is already ready.
  -- ==========================================================

  v_existing := null;

  select s.*
  into v_existing
  from public.billing_checkout_sessions s
  where s.organization_id =
        p_organization_id
    and s.provider =
        v_provider
    and s.plan_id =
        v_plan.id
    and s.plan_slug =
        v_plan_slug
    and s.billing_interval =
        v_interval
    and s.amount =
        v_amount
    and s.currency =
        v_currency
    and s.status =
        'ready'
    and s.external_session_id is not null
    and btrim(s.external_session_id) <> ''
    and s.checkout_url is not null
    and btrim(s.checkout_url) <> ''
    and (
      s.expires_at is null
      or s.expires_at > now()
    )
  order by
    s.created_at desc
  limit 1
  for update;


  if v_existing.id is not null then

    return query
    select
      'reused_ready'::text,
      v_existing.id,
      v_existing.organization_id,
      v_existing.provider,
      v_existing.reference_id,
      v_existing.plan_id,
      v_existing.plan_slug,
      v_existing.billing_interval,
      v_existing.amount,
      v_existing.currency,
      v_existing.status,
      v_existing.external_session_id,
      v_existing.checkout_url,
      v_existing.expires_at;

    return;
  end if;


  -- ==========================================================
  -- 2. Reuse/serialize a checkout whose provider session is
  --    still being created.
  --
  -- Fresh created row -> another request is in progress.
  -- Stale created row -> this request reclaims creation.
  -- ==========================================================

  v_existing := null;

  select s.*
  into v_existing
  from public.billing_checkout_sessions s
  where s.organization_id =
        p_organization_id
    and s.provider =
        v_provider
    and s.plan_id =
        v_plan.id
    and s.plan_slug =
        v_plan_slug
    and s.billing_interval =
        v_interval
    and s.amount =
        v_amount
    and s.currency =
        v_currency
    and s.status =
        'created'
    and s.external_session_id is null
    and s.checkout_url is null
  order by
    s.created_at desc
  limit 1
  for update;


  if v_existing.id is not null then

    if v_existing.updated_at >
       now() - v_creation_lease then

      return query
      select
        'in_progress'::text,
        v_existing.id,
        v_existing.organization_id,
        v_existing.provider,
        v_existing.reference_id,
        v_existing.plan_id,
        v_existing.plan_slug,
        v_existing.billing_interval,
        v_existing.amount,
        v_existing.currency,
        v_existing.status,
        v_existing.external_session_id,
        v_existing.checkout_url,
        v_existing.expires_at;

      return;
    end if;


    update public.billing_checkout_sessions
    set
      metadata =
        coalesce(
          public.billing_checkout_sessions.metadata,
          '{}'::jsonb
        )
        ||
        coalesce(
          p_metadata,
          '{}'::jsonb
        )
        ||
        jsonb_build_object(
          'checkout_intent_version',
            1,
          'provider_creation_claimed_at',
            now(),
          'provider_creation_reclaimed',
            true
        ),

      updated_at =
        now()

    where id =
          v_existing.id

    returning *
    into v_session;


    return query
    select
      'reclaimed_stale'::text,
      v_session.id,
      v_session.organization_id,
      v_session.provider,
      v_session.reference_id,
      v_session.plan_id,
      v_session.plan_slug,
      v_session.billing_interval,
      v_session.amount,
      v_session.currency,
      v_session.status,
      v_session.external_session_id,
      v_session.checkout_url,
      v_session.expires_at;

    return;
  end if;


  -- ==========================================================
  -- 3. No reusable/open attempt exists.
  --    Create a new authoritative checkout row.
  -- ==========================================================

  v_reference_id :=
    'lkv_'
    ||
    replace(
      gen_random_uuid()::text,
      '-',
      ''
    );


  insert into public.billing_checkout_sessions (
    organization_id,
    plan_id,
    provider,
    reference_id,
    plan_slug,
    billing_interval,
    amount,
    currency,
    status,
    metadata
  )
  values (
    p_organization_id,
    v_plan.id,
    v_provider,
    v_reference_id,
    v_plan_slug,
    v_interval,
    v_amount,
    v_currency,
    'created',
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
    ||
    jsonb_build_object(
      'checkout_intent_version',
        1,
      'provider_creation_claimed_at',
        now(),
      'provider_creation_reclaimed',
        false
    )
  )
  returning *
  into v_session;


  return query
  select
    'created_claimed'::text,
    v_session.id,
    v_session.organization_id,
    v_session.provider,
    v_session.reference_id,
    v_session.plan_id,
    v_session.plan_slug,
    v_session.billing_interval,
    v_session.amount,
    v_session.currency,
    v_session.status,
    v_session.external_session_id,
    v_session.checkout_url,
    v_session.expires_at;

end;

$function$;

CREATE OR REPLACE FUNCTION public.claim_marketplace_webhook_events (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid,
  p_limit                  integer DEFAULT 20
)
  RETURNS TABLE (
    id                   uuid,
    notification_id      text,
    notification_type    integer,
    external_entity_id   text,
    external_status      text,
    external_update_time timestamp with time zone,
    authorized_shop_id   uuid,
    attempt_count        integer
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id = p_marketplace_account_id
      and a.organization_id = p_organization_id
  ) then
    raise exception 'marketplace account not found';
  end if;

  return query
  with candidates as (
    select e.id
    from public.marketplace_webhook_events e
    where e.organization_id = p_organization_id
      and e.marketplace_account_id =
            p_marketplace_account_id
      and e.attempt_count < 5
      and (
        e.processing_status in ('received', 'error')
        or (
          e.processing_status = 'processing'
          and e.last_attempt_at <
              now() - interval '10 minutes'
        )
      )
    order by e.received_at asc
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
    for update skip locked
  )
  update public.marketplace_webhook_events e
  set
    processing_status = 'processing',
    attempt_count = e.attempt_count + 1,
    last_attempt_at = now(),
    processing_message = null
  from candidates c
  where e.id = c.id
  returning
    e.id,
    e.notification_id,
    e.notification_type,
    e.external_entity_id,
    e.external_status,
    e.external_update_time,
    e.authorized_shop_id,
    e.attempt_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.complete_marketplace_webhook_event (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid,
  p_event_id               uuid,
  p_status                 text,
  p_message                text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  if p_status not in ('processed', 'ignored', 'error') then
    raise exception 'invalid completion status';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  update public.marketplace_webhook_events e
  set
    processing_status = p_status,
    processed_at =
      case
        when p_status in ('processed', 'ignored')
          then now()
        else null
      end,
    processing_message =
      nullif(left(coalesce(p_message, ''), 500), '')
  where e.id = p_event_id
    and e.organization_id = p_organization_id
    and e.marketplace_account_id =
          p_marketplace_account_id
    and e.processing_status = 'processing';

  return found;
end;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_ai_controlled_action (
  p_action_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
  end if;

  if p_action_id is null then
    raise exception
      'action_id is required';
  end if;

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.id = p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  select
    m.role::text
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      v_action.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    coalesce(v_role, '')
    not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin'
      using errcode = '42501';
  end if;

  if
    v_action.requested_by
      is distinct from
        v_user_id
  then
    raise exception
      'Only the requesting user may confirm this controlled action'
      using errcode = '42501';
  end if;

  if v_action.status = 'proposed' then
    update public.ai_controlled_actions
    set
      status =
        'confirmed',
      confirmed_by =
        v_user_id,
      confirmed_at =
        now()
    where
      id =
        v_action.id;

    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'confirmed',
      'confirmed',
        true,
      'idempotent_replay',
        false
    );
  end if;

  if
    v_action.status = 'confirmed'
    and v_action.confirmed_by =
      v_user_id
  then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'confirmed',
      'confirmed',
        true,
      'idempotent_replay',
        true
    );
  end if;

  if
    v_action.status in (
      'executing',
      'executed',
      'stale',
      'failed',
      'cancelled'
    )
  then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        v_action.status,
      'confirmed',
        v_action.confirmed_at
          is not null,
      'idempotent_replay',
        true
    );
  end if;

  raise exception
    'Controlled action cannot be confirmed from status %',
    v_action.status;
end;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_ai_controlled_publication (
  p_publication_id uuid
)
  RETURNS SETOF public.ai_controlled_publications
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_user_id uuid;
  v_role text;

  v_publication
    public.ai_controlled_publications%rowtype;

  v_shop
    public.marketplace_authorized_shops%rowtype;

  v_destination
    public.publishing_channel_destinations%rowtype;

  v_stale boolean :=
    false;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  select
    p.*
  into
    v_publication
  from
    public.ai_controlled_publications p
  where
    p.id =
      p_publication_id
  for update;

  if not found then
    raise exception
      'Controlled publication not found';
  end if;

  if v_publication.requested_by_user_id <>
    v_user_id
  then
    raise exception
      'Controlled publication requester mismatch';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      v_publication.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'Controlled publication requires owner or admin';
  end if;

  if v_publication.status =
    'confirmed'
  then
    return next
      v_publication;

    return;
  end if;

  if v_publication.status <>
    'proposed'
  then
    raise exception
      'Controlled publication is not confirmable';
  end if;

  if
    v_publication.contract_version =
      1
    and v_publication.target_resource =
      'marketplace_authorized_shop'
  then
    select
      s.*
    into
      v_shop
    from
      public.marketplace_authorized_shops s
    where
      s.id =
        v_publication.target_id
      and s.organization_id =
        v_publication.organization_id
    limit 1;

    v_stale :=
      not found
      or v_shop.status <>
        'active'
      or not v_shop.is_selected
      or lower(
        btrim(
          coalesce(
            v_shop.provider,
            ''
          )
        )
      ) <>
        v_publication.provider
      or btrim(
        coalesce(
          v_shop.external_shop_id,
          ''
        )
      ) <>
        v_publication.external_shop_id;

  elsif
    v_publication.contract_version =
      2
    and v_publication.target_resource =
      'publishing_channel_destination'
  then
    select
      d.*
    into
      v_destination
    from
      public.publishing_channel_destinations d
    where
      d.id =
        v_publication.target_id
      and d.organization_id =
        v_publication.organization_id
    limit 1;

    v_stale :=
      not found
      or v_destination.status <>
        'active'
      or not v_destination.is_selected
      or not (
        'publish_text' =
          any(
            v_destination.capabilities
          )
      )
      or lower(
        btrim(
          coalesce(
            v_destination.provider,
            ''
          )
        )
      ) <>
        v_publication.provider
      or btrim(
        coalesce(
          v_destination.external_destination_id,
          ''
        )
      ) <>
        v_publication.external_shop_id
      or v_destination.destination_type
        is distinct from
        v_publication.destination_type;

  else
    v_stale :=
      true;
  end if;

  if v_stale then
    update
      public.ai_controlled_publications
    set
      status =
        'stale',

      finalized_at =
        now(),

      error_message =
        'Publication destination changed before confirmation'
    where
      id =
        v_publication.id
    returning *
    into
      v_publication;

    return next
      v_publication;

    return;
  end if;

  update
    public.ai_controlled_publications
  set
    status =
      'confirmed',

    confirmed_by_user_id =
      v_user_id,

    confirmed_at =
      now(),

    error_message =
      null
  where
    id =
      v_publication.id
  returning *
  into
    v_publication;

  return next
    v_publication;

  return;
end;

$function$;

CREATE OR REPLACE FUNCTION public.consume_marketplace_oauth_state (
  p_state_hash text,
  p_provider   text
)
  RETURNS TABLE (
    organization_id        uuid,
    marketplace_account_id uuid,
    initiated_by           uuid
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  return query
  with candidate as (
    select s.id
    from public.marketplace_oauth_states s
    where s.state_hash = btrim(p_state_hash)
      and s.provider = lower(btrim(p_provider))
      and s.used_at is null
      and s.expires_at > now()
    order by s.created_at desc
    limit 1
    for update
  )
  update public.marketplace_oauth_states s
  set used_at = now()
  from candidate c
  where s.id = c.id
  returning
    s.organization_id,
    s.marketplace_account_id,
    s.initiated_by;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_billing_checkout_session (
  p_organization_id  uuid,
  p_provider         text,
  p_reference_id     text,
  p_plan_slug        text,
  p_billing_interval text,
  p_metadata         jsonb DEFAULT '{}'::jsonb
)
  RETURNS TABLE (
    checkout_session_id uuid,
    organization_id     uuid,
    provider            text,
    reference_id        text,
    plan_id             uuid,
    plan_slug           text,
    billing_interval    text,
    amount              numeric,
    currency            text,
    status              text
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
#variable_conflict use_column
declare
  v_plan public.billing_plans%rowtype;
  v_existing public.billing_checkout_sessions%rowtype;
  v_amount numeric;
  v_currency text;
  v_session public.billing_checkout_sessions%rowtype;
  v_provider text;
  v_reference_id text;
  v_plan_slug text;
begin
  if p_organization_id is null then
    raise exception
      'organization id is required';
  end if;

  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  v_reference_id :=
    btrim(
      coalesce(
        p_reference_id,
        ''
      )
    );

  v_plan_slug :=
    btrim(
      coalesce(
        p_plan_slug,
        ''
      )
    );

  if length(v_provider) = 0 then
    raise exception
      'provider is required';
  end if;

  if length(v_reference_id) = 0 then
    raise exception
      'reference id is required';
  end if;

  if length(v_reference_id) > 120 then
    raise exception
      'reference id is too long';
  end if;

  if length(v_plan_slug) = 0 then
    raise exception
      'plan slug is required';
  end if;

  if v_plan_slug not in (
    'starter',
    'pro'
  ) then
    raise exception
      'unsupported commercial plan';
  end if;

  if p_billing_interval not in (
    'monthly',
    'annual'
  ) then
    raise exception
      'unsupported billing interval';
  end if;

  if jsonb_typeof(
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  ) <> 'object' then
    raise exception
      'metadata must be a json object';
  end if;

  if not exists (
    select 1
    from public.organizations o
    where o.id = p_organization_id
  ) then
    raise exception
      'organization not found';
  end if;

  select p.*
  into v_plan
  from public.billing_plans p
  where p.slug = v_plan_slug
    and p.is_active
  limit 1;

  if v_plan.id is null then
    raise exception
      'billing plan not found or inactive';
  end if;

  v_currency :=
    upper(
      btrim(
        coalesce(
          v_plan.currency,
          ''
        )
      )
    );

  if length(v_currency) = 0 then
    raise exception
      'billing plan currency is missing';
  end if;

  if p_billing_interval = 'monthly' then
    v_amount :=
      v_plan.price_monthly;
  end if;

  if p_billing_interval = 'annual' then
    v_amount :=
      v_plan.price_annual;
  end if;

  if v_amount is null
     or v_amount <= 0 then
    raise exception
      'billing plan price is missing or invalid';
  end if;

  insert into public.billing_checkout_sessions (
    organization_id,
    plan_id,
    provider,
    reference_id,
    plan_slug,
    billing_interval,
    amount,
    currency,
    status,
    metadata
  )
  values (
    p_organization_id,
    v_plan.id,
    v_provider,
    v_reference_id,
    v_plan_slug,
    p_billing_interval,
    v_amount,
    v_currency,
    'created',
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  )
  on conflict (
    provider,
    reference_id
  )
  do nothing
  returning *
  into v_session;

  if v_session.id is not null then
    return query
    select
      v_session.id,
      v_session.organization_id,
      v_session.provider,
      v_session.reference_id,
      v_session.plan_id,
      v_session.plan_slug,
      v_session.billing_interval,
      v_session.amount,
      v_session.currency,
      v_session.status;

    return;
  end if;

  select s.*
  into v_existing
  from public.billing_checkout_sessions s
  where s.provider =
        v_provider
    and s.reference_id =
        v_reference_id;

  if v_existing.id is null then
    raise exception
      'checkout reference conflict could not be resolved';
  end if;

  if v_existing.organization_id
       <> p_organization_id
     or v_existing.plan_id
       <> v_plan.id
     or v_existing.plan_slug
       <> v_plan_slug
     or v_existing.billing_interval
       <> p_billing_interval then

    raise exception
      'checkout reference already exists with different attributes';
  end if;

  return query
  select
    v_existing.id,
    v_existing.organization_id,
    v_existing.provider,
    v_existing.reference_id,
    v_existing.plan_id,
    v_existing.plan_slug,
    v_existing.billing_interval,
    v_existing.amount,
    v_existing.currency,
    v_existing.status;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_organization()
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  current_user_id uuid;
  selected_organization_id uuid;
begin

  current_user_id :=
    auth.uid();

  if current_user_id is null then
    raise exception
      'User is not authenticated';
  end if;


  perform
    pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        current_user_id::text,
        0
      )
    );


  -- Re-check only after acquiring the per-user transaction
  -- lock. This closes the concurrent provisioning race.
  select
    organization_id
  into
    selected_organization_id
  from
    public.organization_members
  where
    user_id = current_user_id
  order by
    created_at asc,
    organization_id asc
  limit 1;


  if selected_organization_id is not null then
    return selected_organization_id;
  end if;


  insert into public.organizations (
    name
  )
  values (
    'My Commerce Store'
  )
  returning id
  into selected_organization_id;


  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    selected_organization_id,
    current_user_id,
    'owner'
  );


  return selected_organization_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.create_initial_organization (
  p_name text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  current_user_id uuid;
  selected_organization_id uuid;
  normalized_name text;
begin

  current_user_id :=
    auth.uid();

  if current_user_id is null then
    raise exception
      'User is not authenticated';
  end if;


  perform
    pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        current_user_id::text,
        0
      )
    );


  select
    organization_id
  into
    selected_organization_id
  from
    public.organization_members
  where
    user_id = current_user_id
  order by
    created_at asc,
    organization_id asc
  limit 1;


  if selected_organization_id is not null then
    return selected_organization_id;
  end if;


  normalized_name :=
    pg_catalog.btrim(
      pg_catalog.regexp_replace(
        coalesce(
          p_name,
          ''
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    );


  if
    pg_catalog.char_length(
      normalized_name
    ) < 1
  then
    raise exception
      'Organization name is required';
  end if;


  if
    pg_catalog.char_length(
      normalized_name
    ) > 100
  then
    raise exception
      'Organization name must be 100 characters or fewer';
  end if;


  insert into public.organizations (
    name
  )
  values (
    normalized_name
  )
  returning id
  into selected_organization_id;


  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    selected_organization_id,
    current_user_id,
    'owner'
  );


  return selected_organization_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.create_marketplace_oauth_state (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid,
  p_provider               text,
  p_state_hash             text,
  p_expires_at             timestamp with time zone
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_id uuid;
begin
  if p_organization_id is null
     or p_marketplace_account_id is null
     or p_user_id is null then
    raise exception 'organization, account, and user are required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_state_hash, ''))) < 32 then
    raise exception 'invalid oauth state hash';
  end if;

  if p_expires_at <= now()
     or p_expires_at > now() + interval '30 minutes' then
    raise exception 'invalid oauth state expiry';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id = p_marketplace_account_id
      and a.organization_id = p_organization_id
  ) then
    raise exception 'marketplace account not found';
  end if;

  delete from public.marketplace_oauth_states
  where expires_at < now() - interval '1 day';

  insert into public.marketplace_oauth_states (
    organization_id,
    marketplace_account_id,
    provider,
    state_hash,
    initiated_by,
    expires_at
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    lower(btrim(p_provider)),
    btrim(p_state_hash),
    p_user_id,
    p_expires_at
  )
  returning id into v_id;

  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_order (
  p_organization_id uuid,
  p_customer_id     uuid,
  p_items           jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_order_id uuid;
  v_total numeric := 0;

  v_item jsonb;

  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;

  v_price numeric;
  v_cost_price numeric;
begin

  -- Authentication
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- Organization isolation
  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  -- Customer must belong to organization
  if not exists (
    select 1
    from public.customers
    where id = p_customer_id
      and organization_id = p_organization_id
  ) then
    raise exception
      'Customer not found in this organization'
      using errcode = 'P0001';
  end if;


  -- Non-empty JSON array
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then

    raise exception
      'Order must contain at least one item'
      using errcode = 'P0001';

  end if;


  -- Create pending order
  insert into public.orders (
    organization_id,
    customer_id,
    status,
    total,
    completed_at
  )
  values (
    p_organization_id,
    p_customer_id,
    'pending',
    0,
    null
  )
  returning id
  into v_order_id;


  -- =======================================================
  -- ITEMS
  -- =======================================================

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop

    if jsonb_typeof(v_item) <> 'object' then
      raise exception
        'Invalid order item payload'
        using errcode = 'P0001';
    end if;


    -- Reset loop variables
    v_product_id := null;
    v_variant_id := null;
    v_quantity := null;
    v_price := null;
    v_cost_price := null;


    begin

      v_product_id :=
        nullif(
          v_item ->> 'product_id',
          ''
        )::uuid;

      v_variant_id :=
        nullif(
          v_item ->> 'variant_id',
          ''
        )::uuid;

      v_quantity :=
        (v_item ->> 'quantity')::integer;

    exception
      when invalid_text_representation then
        raise exception
          'Invalid product_id, variant_id, or quantity'
          using errcode = 'P0001';
    end;


    if v_product_id is null then
      raise exception
        'product_id is required'
        using errcode = 'P0001';
    end if;


    if v_quantity is null
       or v_quantity <= 0 then
      raise exception
        'Quantity must be greater than zero'
        using errcode = 'P0001';
    end if;


    -- =====================================================
    -- BASE PRODUCT ITEM
    -- =====================================================

    if v_variant_id is null then

      select
        p.price,
        p.cost_price
      into
        v_price,
        v_cost_price
      from public.products p
      where p.id = v_product_id
        and p.organization_id = p_organization_id
        and p.status = 'active';


      if not found then
        raise exception
          'Active product not found in this organization'
          using errcode = 'P0001';
      end if;


    -- =====================================================
    -- VARIANT ITEM
    -- =====================================================

    else

      select
        pv.price,
        pv.cost_price
      into
        v_price,
        v_cost_price
      from public.product_variants pv
      join public.products p
        on p.id = pv.product_id
       and p.organization_id = pv.organization_id
      where pv.id = v_variant_id
        and pv.product_id = v_product_id
        and pv.organization_id = p_organization_id
        and pv.status = 'active'
        and p.status = 'active';


      if not found then
        raise exception
          'Active product variant not found for this product and organization'
          using errcode = 'P0001';
      end if;

    end if;


    -- Server-side price and cost snapshots
    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      price,
      cost_price_snapshot
    )
    values (
      v_order_id,
      v_product_id,
      v_variant_id,
      v_quantity,
      v_price,
      v_cost_price
    );


    v_total :=
      v_total +
      (v_price * v_quantity);

  end loop;


  -- Server-calculated total
  update public.orders
  set total = v_total
  where id = v_order_id
    and organization_id = p_organization_id;


  return v_order_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_inventory_sku_namespace()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  normalized_sku text;
begin
  if new.sku is null then
    return new;
  end if;

  normalized_sku := lower(btrim(new.sku));

  perform pg_advisory_xact_lock(
    hashtextextended(
      new.organization_id::text || ':' || normalized_sku,
      0
    )
  );

  if tg_table_name = 'products' then

    if exists (
      select 1
      from public.product_variants pv
      where pv.organization_id = new.organization_id
        and lower(btrim(pv.sku)) = normalized_sku
    ) then
      raise exception using
        errcode = '23505',
        message = 'SKU already exists in organization';
    end if;

  elsif tg_table_name = 'product_variants' then

    if exists (
      select 1
      from public.products p
      where p.organization_id = new.organization_id
        and p.sku is not null
        and lower(btrim(p.sku)) = normalized_sku
    ) then
      raise exception using
        errcode = '23505',
        message = 'SKU already exists in organization';
    end if;

  else
    raise exception
      'Unexpected table for SKU namespace guard: %',
      tg_table_name;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_product_category_organization()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  category_organization_id uuid;
begin
  if new.category_id is null then
    return new;
  end if;

  select c.organization_id
    into category_organization_id
  from public.categories c
  where c.id = new.category_id;

  if category_organization_id is null then
    raise exception 'Category does not exist';
  end if;

  if category_organization_id <> new.organization_id then
    raise exception 'Product and category must belong to the same organization';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.evaluate_automation_rule (
  p_rule_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;
  v_target uuid;

  v_strategy text;
  v_adjustment numeric;

  v_min numeric;
  v_max numeric;

  v_execution_mode text;
  v_rule_active boolean;

  v_product uuid;
  v_variant uuid;
  v_monitor_active boolean;

  v_observation uuid;
  v_observed numeric;
  v_threshold_triggered boolean;

  v_internal numeric;
  v_proposed numeric;

  v_run uuid := gen_random_uuid();
  v_action uuid := gen_random_uuid();

  v_existing_run uuid;
begin
  if auth.uid() is null then
    raise exception
      'Authentication required';
  end if;


  select
    organization_id,
    price_monitor_target_id,
    pricing_strategy,
    adjustment_percent,
    minimum_price,
    maximum_price,
    execution_mode,
    is_active
  into
    v_org,
    v_target,
    v_strategy,
    v_adjustment,
    v_min,
    v_max,
    v_execution_mode,
    v_rule_active
  from public.automation_rules
  where id = p_rule_id;


  if not found then
    raise exception
      'Automation rule not found';
  end if;


  if not public.is_organization_member(
    v_org
  ) then
    raise exception
      'Organization access denied';
  end if;


  if not v_rule_active then
    raise exception
      'Automation rule is inactive';
  end if;


  select
    product_id,
    variant_id,
    is_active
  into
    v_product,
    v_variant,
    v_monitor_active
  from public.price_monitor_targets
  where id = v_target
    and organization_id = v_org;


  if not found then
    raise exception
      'Price monitor target not found';
  end if;


  if not v_monitor_active then
    insert into public.automation_runs (
      id,
      organization_id,
      rule_id,
      status,
      reason,
      created_by,
      completed_at
    )
    values (
      v_run,
      v_org,
      p_rule_id,
      'skipped',
      'Price monitor target is inactive',
      auth.uid(),
      now()
    );

    return v_run;
  end if;


  -- Latest Phase 11 signal.
  select
    id,
    observed_price,
    threshold_triggered
  into
    v_observation,
    v_observed,
    v_threshold_triggered
  from public.price_observations
  where organization_id = v_org
    and target_id = v_target
  order by
    observed_at desc,
    created_at desc
  limit 1;


  if not found then
    insert into public.automation_runs (
      id,
      organization_id,
      rule_id,
      status,
      reason,
      created_by,
      completed_at
    )
    values (
      v_run,
      v_org,
      p_rule_id,
      'skipped',
      'No price observation available',
      auth.uid(),
      now()
    );

    return v_run;
  end if;


  -- Avoid duplicate actionable evaluation for
  -- the exact same rule + observation.
  select id
  into v_existing_run
  from public.automation_runs
  where organization_id = v_org
    and rule_id = p_rule_id
    and trigger_observation_id =
      v_observation
    and status in (
      'proposed',
      'executed'
    )
  order by created_at desc
  limit 1;


  if found then
    return v_existing_run;
  end if;


  if v_product is not null then

    select price::numeric
    into v_internal
    from public.products
    where id = v_product
      and organization_id = v_org;

  elsif v_variant is not null then

    select price::numeric
    into v_internal
    from public.product_variants
    where id = v_variant
      and organization_id = v_org;

  end if;


  if v_internal is null then
    insert into public.automation_runs (
      id,
      organization_id,
      rule_id,
      trigger_observation_id,
      status,
      observed_price_snapshot,
      threshold_triggered_snapshot,
      reason,
      created_by,
      completed_at
    )
    values (
      v_run,
      v_org,
      p_rule_id,
      v_observation,
      'failed',
      v_observed,
      v_threshold_triggered,
      'Internal commerce price not found',
      auth.uid(),
      now()
    );

    return v_run;
  end if;


  -- No Phase 11 threshold signal means:
  -- do nothing.
  if not coalesce(
    v_threshold_triggered,
    false
  ) then
    insert into public.automation_runs (
      id,
      organization_id,
      rule_id,
      trigger_observation_id,
      status,
      observed_price_snapshot,
      internal_price_before,
      threshold_triggered_snapshot,
      reason,
      created_by,
      completed_at
    )
    values (
      v_run,
      v_org,
      p_rule_id,
      v_observation,
      'skipped',
      v_observed,
      v_internal,
      false,
      'Price threshold not triggered',
      auth.uid(),
      now()
    );

    return v_run;
  end if;


  if v_strategy = 'match_observed' then

    v_proposed :=
      v_observed;

  elsif v_strategy =
    'adjust_observed_percent'
  then

    v_proposed :=
      v_observed *
      (
        1 +
        (
          v_adjustment / 100
        )
      );

  else
    raise exception
      'Unsupported pricing strategy';
  end if;


  v_proposed :=
    round(v_proposed, 4);


  if v_min is not null then
    v_proposed :=
      greatest(
        v_proposed,
        v_min
      );
  end if;


  if v_max is not null then
    v_proposed :=
      least(
        v_proposed,
        v_max
      );
  end if;


  if v_proposed < 0 then
    raise exception
      'Proposed price cannot be negative';
  end if;


  insert into public.automation_runs (
    id,
    organization_id,
    rule_id,
    trigger_observation_id,
    status,
    observed_price_snapshot,
    internal_price_before,
    proposed_price,
    threshold_triggered_snapshot,
    reason,
    created_by
  )
  values (
    v_run,
    v_org,
    p_rule_id,
    v_observation,
    'proposed',
    v_observed,
    v_internal,
    v_proposed,
    true,
    'Price threshold triggered',
    auth.uid()
  );


  insert into public.automation_actions (
    id,
    organization_id,
    run_id,
    rule_id,
    action_type,
    target_type,
    product_id,
    variant_id,
    before_price,
    requested_price,
    status
  )
  values (
    v_action,
    v_org,
    v_run,
    p_rule_id,
    'set_internal_price',

    case
      when v_product is not null
        then 'product'
      else 'variant'
    end,

    v_product,
    v_variant,

    v_internal,
    v_proposed,
    'pending'
  );


  -- Automatic mode executes immediately.
  -- Proposal mode leaves the action pending.
  if v_execution_mode =
    'automatic'
  then
    perform
      public.execute_automation_action(
        v_action
      );
  end if;


  return v_run;
end;
$function$;

CREATE OR REPLACE FUNCTION public.execute_ai_controlled_action (
  p_action_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;

  v_affected integer;
  v_target_exists boolean;

  v_error text;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
  end if;

  if p_action_id is null then
    raise exception
      'action_id is required';
  end if;

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.id = p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  select
    m.role::text
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      v_action.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    coalesce(v_role, '')
    not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin'
      using errcode = '42501';
  end if;

  if
    v_action.requested_by
      is distinct from
        v_user_id
  then
    raise exception
      'Only the requesting user may execute this controlled action'
      using errcode = '42501';
  end if;

  -- Terminal statuses are exactly-once replays.
  -- They never mutate the product again.

  if
    v_action.status in (
      'executed',
      'stale',
      'failed',
      'cancelled'
    )
  then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        v_action.status,
      'executed',
        v_action.status = 'executed',
      'idempotent_replay',
        true
    );
  end if;

  if v_action.status = 'executing' then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'executing',
      'executed',
        false,
      'idempotent_replay',
        true
    );
  end if;

  if v_action.status = 'proposed' then
    raise exception
      'Explicit confirmation is required before execution'
      using errcode = '42501';
  end if;

  if v_action.status <> 'confirmed' then
    raise exception
      'Controlled action cannot execute from status %',
      v_action.status;
  end if;

  if
    v_action.confirmed_by
      is distinct from
        v_user_id
    or v_action.confirmed_at
      is null
  then
    raise exception
      'Controlled action confirmation does not belong to the authenticated requester'
      using errcode = '42501';
  end if;

  update public.ai_controlled_actions
  set
    status =
      'executing',
    executed_by =
      v_user_id,
    execution_started_at =
      now(),
    error_message =
      null
  where
    id =
      v_action.id;

  begin
    -- --------------------------------------------------------
    -- THE ONLY COMMERCE MUTATION IN PHASE 17.
    --
    -- Exact compare-and-set:
    -- current description must still equal the proposal's
    -- expected snapshot.
    -- --------------------------------------------------------

    update public.products
    set
      description =
        v_action.proposed_description
    where
      id =
        v_action.target_id
      and organization_id =
        v_action.organization_id
      and description
        is not distinct from
          v_action.expected_description;

    get diagnostics
      v_affected =
        row_count;

    if v_affected = 1 then
      update public.ai_controlled_actions
      set
        status =
          'executed',
        finalized_at =
          now(),
        error_message =
          null
      where
        id =
          v_action.id;

      return jsonb_build_object(
        'action_id',
          v_action.id,
        'status',
          'executed',
        'executed',
          true,
        'idempotent_replay',
          false
      );
    end if;

    select exists (
      select 1
      from public.products p
      where
        p.id =
          v_action.target_id
        and p.organization_id =
          v_action.organization_id
    )
    into
      v_target_exists;

    if v_target_exists then
      -- Product still exists but description changed after
      -- proposal preview. Manual/current data wins.

      update public.ai_controlled_actions
      set
        status =
          'stale',
        finalized_at =
          now(),
        error_message =
          'target_description_changed'
      where
        id =
          v_action.id;

      return jsonb_build_object(
        'action_id',
          v_action.id,
        'status',
          'stale',
        'executed',
          false,
        'idempotent_replay',
          false
      );
    end if;

    update public.ai_controlled_actions
    set
      status =
        'failed',
      finalized_at =
        now(),
      error_message =
        'target_not_found'
    where
      id =
        v_action.id;

    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'failed',
      'executed',
        false,
      'idempotent_replay',
        false
    );

  exception
    when others then
      v_error :=
        left(
          sqlerrm,
          4000
        );

      update public.ai_controlled_actions
      set
        status =
          'failed',
        finalized_at =
          now(),
        error_message =
          v_error
      where
        id =
          v_action.id;

      return jsonb_build_object(
        'action_id',
          v_action.id,
        'status',
          'failed',
        'executed',
          false,
        'idempotent_replay',
          false
      );
  end;
end;
$function$;

CREATE OR REPLACE FUNCTION public.execute_ai_controlled_action_dispatch (
  p_action_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_organization_id uuid;
  v_requested_by uuid;
  v_action_type text;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_action_id is null then
    raise exception
      'action_id is required';
  end if;

  /*
   * The caller does NOT choose the executor.
   * Dispatch is derived only from persisted action_type.
   */
  select
    a.organization_id,
    a.requested_by,
    a.action_type
  into
    v_organization_id,
    v_requested_by,
    v_action_type
  from public.ai_controlled_actions a
  where
    a.id =
      p_action_id;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  if
    v_requested_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action requester mismatch';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      v_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  if
    v_action_type =
      'product.update_description'
  then
    return
      public.execute_ai_controlled_action(
        p_action_id
      );
  end if;

  if
    v_action_type =
      'product.update_name'
  then
    return
      public.execute_ai_controlled_product_name_action(
        p_action_id
      );
  end if;

  if
    v_action_type =
      'product.update_status'
  then
    return
      public.execute_ai_controlled_product_status_action(
        p_action_id
      );
  end if;

  if
    v_action_type =
      'product.update_price'
  then
    return
      public.execute_ai_controlled_product_price_action(
        p_action_id
      );
  end if;

  raise exception
    'Unsupported controlled action type';
end;
$function$;

CREATE OR REPLACE FUNCTION public.execute_ai_controlled_product_name_action (
  p_action_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;

  v_affected integer;
  v_target_exists boolean;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_action_id is null then
    raise exception
      'action_id is required';
  end if;

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.id =
      p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  if
    v_action.action_type
      <> 'product.update_name'
    or v_action.target_resource
      <> 'product'
    or v_action.mutation_field
      <> 'name'
  then
    raise exception
      'Action is not a product name action';
  end if;

  if
    v_action.requested_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action requester mismatch';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      v_action.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  -- Terminal states are replay-safe.
  if v_action.status in (
    'executed',
    'stale',
    'failed',
    'cancelled'
  ) then
    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  if v_action.status = 'executing' then
    raise exception
      'Controlled action is already executing';
  end if;

  if v_action.status <> 'confirmed' then
    raise exception
      'Controlled action must be confirmed before execution';
  end if;

  if
    v_action.confirmed_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action confirmation requester mismatch';
  end if;

  -- ----------------------------------------------------------
  -- EXECUTION AUDIT START
  -- ----------------------------------------------------------

  update public.ai_controlled_actions
  set
    status =
      'executing',

    executed_by =
      v_user_id,

    execution_started_at =
      now(),

    finalized_at =
      null,

    error_message =
      null
  where id =
    v_action.id;

  -- ----------------------------------------------------------
  -- EXACT PRODUCT NAME COMPARE-AND-SET
  -- ----------------------------------------------------------

  update public.products
  set
    name =
      v_action.proposed_value
  where
    id =
      v_action.target_id

    and organization_id =
      v_action.organization_id

    and name
      is not distinct from
      v_action.expected_value;

  get diagnostics
    v_affected =
      row_count;

  if v_affected = 1 then
    update public.ai_controlled_actions
    set
      status =
        'executed',

      finalized_at =
        now(),

      error_message =
        null
    where id =
      v_action.id;

    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  -- ----------------------------------------------------------
  -- ZERO ROWS: STALE OR TARGET REMOVED
  -- ----------------------------------------------------------

  select exists (
    select 1
    from public.products p
    where
      p.id =
        v_action.target_id
      and p.organization_id =
        v_action.organization_id
  )
  into
    v_target_exists;

  if v_target_exists then
    update public.ai_controlled_actions
    set
      status =
        'stale',

      finalized_at =
        now(),

      error_message =
        'Product name changed after proposal confirmation'
    where id =
      v_action.id;
  else
    update public.ai_controlled_actions
    set
      status =
        'failed',

      finalized_at =
        now(),

      error_message =
        'Product no longer exists'
    where id =
      v_action.id;
  end if;

  return jsonb_build_object(
    'action_id',
    v_action.id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.execute_ai_controlled_product_price_action (
  p_action_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;

  v_expected_price numeric(12,2);
  v_proposed_price numeric(12,2);

  v_affected integer;
  v_target_exists boolean;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_action_id is null then
    raise exception
      'action_id is required';
  end if;

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.id =
      p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  if
    v_action.action_type
      <> 'product.update_price'

    or v_action.target_resource
      <> 'product'

    or v_action.mutation_field
      <> 'price'
  then
    raise exception
      'Action is not a product price action';
  end if;

  if
    v_action.expected_value is null

    or v_action.expected_value !~
      '^(0|[1-9][0-9]{0,9})\.[0-9]{2}$'

    or v_action.proposed_value is null

    or v_action.proposed_value !~
      '^(0|[1-9][0-9]{0,9})\.[0-9]{2}$'
  then
    raise exception
      'Product price action payload is invalid';
  end if;

  v_expected_price :=
    v_action.expected_value::numeric(12,2);

  v_proposed_price :=
    v_action.proposed_value::numeric(12,2);

  if
    v_expected_price < 0
    or v_proposed_price < 0

    or v_expected_price
      is not distinct from
      v_proposed_price
  then
    raise exception
      'Product price action payload is invalid';
  end if;

  if
    v_action.requested_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action requester mismatch';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      v_action.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  -- Terminal states are replay-safe.
  if v_action.status in (
    'executed',
    'stale',
    'failed',
    'cancelled'
  ) then
    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  if v_action.status = 'executing' then
    raise exception
      'Controlled action is already executing';
  end if;

  if v_action.status <> 'confirmed' then
    raise exception
      'Controlled action must be confirmed before execution';
  end if;

  if
    v_action.confirmed_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action confirmation requester mismatch';
  end if;

  -- ----------------------------------------------------------
  -- EXECUTION AUDIT START
  -- ----------------------------------------------------------

  update public.ai_controlled_actions
  set
    status =
      'executing',

    executed_by =
      v_user_id,

    execution_started_at =
      now(),

    finalized_at =
      null,

    error_message =
      null
  where id =
    v_action.id;

  -- ----------------------------------------------------------
  -- EXACT NUMERIC PRODUCT PRICE COMPARE-AND-SET
  -- ----------------------------------------------------------

  update public.products
  set
    price =
      v_proposed_price
  where
    id =
      v_action.target_id

    and organization_id =
      v_action.organization_id

    and price
      is not distinct from
      v_expected_price;

  get diagnostics
    v_affected =
      row_count;

  if v_affected = 1 then
    update public.ai_controlled_actions
    set
      status =
        'executed',

      finalized_at =
        now(),

      error_message =
        null
    where id =
      v_action.id;

    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  -- ----------------------------------------------------------
  -- ZERO ROWS: STALE OR TARGET REMOVED
  -- ----------------------------------------------------------

  select exists (
    select 1
    from public.products p
    where
      p.id =
        v_action.target_id
      and p.organization_id =
        v_action.organization_id
  )
  into
    v_target_exists;

  if v_target_exists then
    update public.ai_controlled_actions
    set
      status =
        'stale',

      finalized_at =
        now(),

      error_message =
        'Product price changed after proposal confirmation'
    where id =
      v_action.id;
  else
    update public.ai_controlled_actions
    set
      status =
        'failed',

      finalized_at =
        now(),

      error_message =
        'Product no longer exists'
    where id =
      v_action.id;
  end if;

  return jsonb_build_object(
    'action_id',
    v_action.id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.execute_ai_controlled_product_status_action (
  p_action_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;

  v_affected integer;
  v_target_exists boolean;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_action_id is null then
    raise exception
      'action_id is required';
  end if;

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.id =
      p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  if
    v_action.action_type
      <> 'product.update_status'
    or v_action.target_resource
      <> 'product'
    or v_action.mutation_field
      <> 'status'
  then
    raise exception
      'Action is not a product status action';
  end if;

  if
    v_action.expected_value is null
    or v_action.expected_value not in (
      'active',
      'inactive'
    )
    or v_action.proposed_value is null
    or v_action.proposed_value not in (
      'active',
      'inactive'
    )
    or v_action.expected_value
      is not distinct from
      v_action.proposed_value
  then
    raise exception
      'Product status action payload is invalid';
  end if;

  if
    v_action.requested_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action requester mismatch';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      v_action.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  -- Terminal states are replay-safe.
  if v_action.status in (
    'executed',
    'stale',
    'failed',
    'cancelled'
  ) then
    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  if v_action.status = 'executing' then
    raise exception
      'Controlled action is already executing';
  end if;

  if v_action.status <> 'confirmed' then
    raise exception
      'Controlled action must be confirmed before execution';
  end if;

  if
    v_action.confirmed_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action confirmation requester mismatch';
  end if;

  -- ----------------------------------------------------------
  -- EXECUTION AUDIT START
  -- ----------------------------------------------------------

  update public.ai_controlled_actions
  set
    status =
      'executing',

    executed_by =
      v_user_id,

    execution_started_at =
      now(),

    finalized_at =
      null,

    error_message =
      null
  where id =
    v_action.id;

  -- ----------------------------------------------------------
  -- EXACT PRODUCT STATUS COMPARE-AND-SET
  -- ----------------------------------------------------------

  update public.products
  set
    status =
      v_action.proposed_value
  where
    id =
      v_action.target_id

    and organization_id =
      v_action.organization_id

    and status
      is not distinct from
      v_action.expected_value;

  get diagnostics
    v_affected =
      row_count;

  if v_affected = 1 then
    update public.ai_controlled_actions
    set
      status =
        'executed',

      finalized_at =
        now(),

      error_message =
        null
    where id =
      v_action.id;

    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  -- ----------------------------------------------------------
  -- ZERO ROWS: STALE OR TARGET REMOVED
  -- ----------------------------------------------------------

  select exists (
    select 1
    from public.products p
    where
      p.id =
        v_action.target_id
      and p.organization_id =
        v_action.organization_id
  )
  into
    v_target_exists;

  if v_target_exists then
    update public.ai_controlled_actions
    set
      status =
        'stale',

      finalized_at =
        now(),

      error_message =
        'Product status changed after proposal confirmation'
    where id =
      v_action.id;
  else
    update public.ai_controlled_actions
    set
      status =
        'failed',

      finalized_at =
        now(),

      error_message =
        'Product no longer exists'
    where id =
      v_action.id;
  end if;

  return jsonb_build_object(
    'action_id',
    v_action.id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.execute_automation_action (
  p_action_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;

  v_run uuid;
  v_rule uuid;

  v_status text;
  v_action_type text;
  v_target_type text;

  v_product uuid;
  v_variant uuid;

  v_before numeric;
  v_requested numeric;
  v_current numeric;

  v_rule_active boolean;
begin
  if auth.uid() is null then
    raise exception
      'Authentication required';
  end if;


  select
    organization_id,
    run_id,
    rule_id,
    status,
    action_type,
    target_type,
    product_id,
    variant_id,
    before_price,
    requested_price
  into
    v_org,
    v_run,
    v_rule,
    v_status,
    v_action_type,
    v_target_type,
    v_product,
    v_variant,
    v_before,
    v_requested
  from public.automation_actions
  where id = p_action_id
  for update;


  if not found then
    raise exception
      'Automation action not found';
  end if;


  if not public.is_organization_member(
    v_org
  ) then
    raise exception
      'Organization access denied';
  end if;


  if v_status <> 'pending' then
    raise exception
      'Only pending automation actions may be executed';
  end if;


  select is_active
  into v_rule_active
  from public.automation_rules
  where id = v_rule
    and organization_id = v_org;


  if not coalesce(
    v_rule_active,
    false
  ) then
    update public.automation_actions
    set
      status = 'failed',
      error_message =
        'Automation rule is inactive'
    where id = p_action_id;

    update public.automation_runs
    set
      status = 'failed',
      error_message =
        'Automation rule is inactive',
      completed_at = now()
    where id = v_run
      and organization_id = v_org;

    return jsonb_build_object(
      'action_id',
      p_action_id,
      'status',
      'failed',
      'error',
      'Automation rule is inactive'
    );
  end if;


  if v_action_type <>
    'set_internal_price'
  then
    raise exception
      'Unsupported automation action';
  end if;


  -- Lock the commerce row and verify that
  -- the price has not changed since proposal.

  if v_target_type = 'product' then

    select price::numeric
    into v_current
    from public.products
    where id = v_product
      and organization_id = v_org
    for update;

  elsif v_target_type = 'variant' then

    select price::numeric
    into v_current
    from public.product_variants
    where id = v_variant
      and organization_id = v_org
    for update;

  else
    raise exception
      'Unsupported automation target';
  end if;


  if v_current is null then
    update public.automation_actions
    set
      status = 'failed',
      error_message =
        'Commerce target not found'
    where id = p_action_id;

    update public.automation_runs
    set
      status = 'failed',
      error_message =
        'Commerce target not found',
      completed_at = now()
    where id = v_run
      and organization_id = v_org;

    return jsonb_build_object(
      'action_id',
      p_action_id,
      'status',
      'failed',
      'error',
      'Commerce target not found'
    );
  end if;


  -- Stale proposal protection.
  if v_current is distinct from v_before then
    update public.automation_actions
    set
      status = 'failed',
      error_message =
        'Internal price changed since proposal'
    where id = p_action_id;

    update public.automation_runs
    set
      status = 'failed',
      error_message =
        'Internal price changed since proposal',
      completed_at = now()
    where id = v_run
      and organization_id = v_org;

    return jsonb_build_object(
      'action_id',
      p_action_id,
      'status',
      'failed',
      'error',
      'Internal price changed since proposal'
    );
  end if;


  if v_target_type = 'product' then

    update public.products
    set
      price = v_requested
    where id = v_product
      and organization_id = v_org;

  else

    update public.product_variants
    set
      price = v_requested
    where id = v_variant
      and organization_id = v_org;

  end if;


  update public.automation_actions
  set
    status = 'executed',
    applied_price = v_requested,
    error_message = null,
    executed_by = auth.uid(),
    executed_at = now()
  where id = p_action_id;


  update public.automation_runs
  set
    status = 'executed',
    error_message = null,
    completed_at = now()
  where id = v_run
    and organization_id = v_org;


  return jsonb_build_object(
    'action_id',
    p_action_id,
    'status',
    'executed',
    'applied_price',
    v_requested
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.fail_billing_checkout_session (
  p_checkout_session_id uuid,
  p_failure_code        text,
  p_metadata            jsonb DEFAULT '{}'::jsonb
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_session public.billing_checkout_sessions%rowtype;
begin
  if p_checkout_session_id is null then
    raise exception
      'checkout session id is required';
  end if;

  if length(
    btrim(
      coalesce(
        p_failure_code,
        ''
      )
    )
  ) = 0 then
    raise exception
      'failure code is required';
  end if;

  if jsonb_typeof(
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  ) <> 'object' then
    raise exception
      'metadata must be a json object';
  end if;

  select s.*
  into v_session
  from public.billing_checkout_sessions s
  where s.id =
        p_checkout_session_id
  for update;

  if v_session.id is null then
    return 'missing_session';
  end if;

  if v_session.status = 'failed' then
    return 'already_failed';
  end if;

  if v_session.status <> 'created' then
    return 'session_not_failable';
  end if;

  update public.billing_checkout_sessions
  set
    status = 'failed',
    failure_code =
      btrim(p_failure_code),
    metadata =
      coalesce(
        public.billing_checkout_sessions.metadata,
        '{}'::jsonb
      )
      ||
      coalesce(
        p_metadata,
        '{}'::jsonb
      ),
    updated_at =
      now()
  where id =
        p_checkout_session_id;

  return 'failed';
end;
$function$;

CREATE OR REPLACE FUNCTION public.finish_ai_agent_run (
  p_run_id         uuid,
  p_status         text,
  p_output_data    jsonb DEFAULT NULL::jsonb,
  p_summary        text  DEFAULT NULL::text,
  p_recommendation text  DEFAULT NULL::text,
  p_risks          jsonb DEFAULT '[]'::jsonb,
  p_next_actions   jsonb DEFAULT '[]'::jsonb,
  p_error_message  text  DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;
  v_current_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_status not in (
    'completed',
    'failed'
  ) then
    raise exception
      'Final agent status must be completed or failed';
  end if;

  if p_output_data is not null
     and jsonb_typeof(p_output_data) <> 'object' then
    raise exception 'Output data must be a JSON object';
  end if;

  if p_risks is null
     or jsonb_typeof(p_risks) <> 'array' then
    raise exception 'Risks must be a JSON array';
  end if;

  if p_next_actions is null
     or jsonb_typeof(p_next_actions) <> 'array' then
    raise exception 'Next actions must be a JSON array';
  end if;

  select
    organization_id,
    status
  into
    v_org,
    v_current_status
  from public.ai_agent_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception 'AI agent run not found';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'Organization access denied';
  end if;

  if v_current_status <> 'running' then
    raise exception
      'Only running agent runs may be finished';
  end if;

  update public.ai_agent_runs
  set
    status = p_status,
    output_data = p_output_data,
    summary = nullif(btrim(p_summary), ''),
    recommendation = nullif(
      btrim(p_recommendation),
      ''
    ),
    risks = p_risks,
    next_actions = p_next_actions,
    error_message = nullif(
      btrim(p_error_message),
      ''
    ),
    completed_at = now()
  where id = p_run_id;

  return p_run_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_ai_controlled_action (
  p_organization_id uuid,
  p_action_id       uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if
    p_organization_id is null
    or p_action_id is null
  then
    raise exception
      'organization_id and action_id are required';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.id =
      p_action_id;

  /*
   * Cross-organization and nonexistent IDs remain
   * indistinguishable to the caller.
   */
  if not found then
    return null;
  end if;

  /*
   * Explicit safe projection.
   *
   * Never expose:
   * - idempotency_key
   * - requested_by
   * - confirmed_by
   * - executed_by
   * - organization membership data
   *
   * The generic snapshot fields are controlled persisted
   * values required to review product.update_name.
   */
  return jsonb_build_object(
    'id',
      v_action.id,

    'contract_version',
      v_action.contract_version,

    'action_type',
      v_action.action_type,

    'status',
      v_action.status,

    'target_resource',
      v_action.target_resource,

    'target_id',
      v_action.target_id,

    'expected_description',
      v_action.expected_description,

    'proposed_description',
      v_action.proposed_description,

    'mutation_field',
      v_action.mutation_field,

    'expected_value',
      v_action.expected_value,

    'proposed_value',
      v_action.proposed_value,

    'created_at',
      v_action.created_at,

    'confirmed_at',
      v_action.confirmed_at,

    'execution_started_at',
      v_action.execution_started_at,

    'finalized_at',
      v_action.finalized_at,

    'error_message',
      v_action.error_message
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_ai_controlled_actions (
  p_organization_id uuid,
  p_limit           integer DEFAULT 50,
  p_offset          integer DEFAULT 0,
  p_status          text    DEFAULT NULL::text
)
  RETURNS TABLE (
    id                   uuid,
    contract_version     smallint,
    action_type          text,
    status               text,
    target_resource      text,
    target_id            uuid,
    expected_description text,
    proposed_description text,
    mutation_field       text,
    expected_value       text,
    proposed_value       text,
    created_at           timestamp with time zone,
    confirmed_at         timestamp with time zone,
    execution_started_at timestamp with time zone,
    finalized_at         timestamp with time zone,
    error_message        text
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if
    p_limit is null
    or p_limit < 1
    or p_limit > 100
  then
    raise exception
      'limit must be between 1 and 100';
  end if;

  if
    p_offset is null
    or p_offset < 0
    or p_offset > 10000
  then
    raise exception
      'offset must be between 0 and 10000';
  end if;

  if
    p_status is not null
    and p_status not in (
      'proposed',
      'confirmed',
      'executing',
      'executed',
      'stale',
      'failed',
      'cancelled'
    )
  then
    raise exception
      'Unsupported controlled action status';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  /*
   * Explicit safe projection.
   *
   * Never expose:
   * - organization_id
   * - idempotency_key
   * - requested_by
   * - confirmed_by
   * - executed_by
   * - organization membership data
   */
  return query
  select
    a.id,
    a.contract_version,
    a.action_type,
    a.status,
    a.target_resource,
    a.target_id,
    a.expected_description,
    a.proposed_description,
    a.mutation_field,
    a.expected_value,
    a.proposed_value,
    a.created_at,
    a.confirmed_at,
    a.execution_started_at,
    a.finalized_at,
    a.error_message
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and (
      p_status is null
      or a.status =
        p_status
    )
  order by
    a.created_at desc,
    a.id desc
  limit
    p_limit
  offset
    p_offset;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_ai_controlled_publication (
  p_organization_id uuid,
  p_publication_id  uuid
)
  RETURNS SETOF public.ai_controlled_publications
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_user_id uuid;
  v_role text;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'Controlled publication requires owner or admin';
  end if;

  return query
  select
    p.*
  from
    public.ai_controlled_publications p
  where
    p.organization_id =
      p_organization_id
    and p.id =
      p_publication_id
  limit 1;
end;

$function$;

CREATE OR REPLACE FUNCTION public.get_ai_controlled_publications (
  p_organization_id uuid,
  p_limit           integer DEFAULT 20,
  p_offset          integer DEFAULT 0,
  p_status          text    DEFAULT NULL::text
)
  RETURNS SETOF public.ai_controlled_publications
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_user_id uuid;
  v_role text;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_limit < 1
  or p_limit > 100 then
    raise exception
      'Invalid controlled publication limit';
  end if;

  if p_offset < 0 then
    raise exception
      'Invalid controlled publication offset';
  end if;

  if p_status is not null
  and p_status not in (
    'proposed',
    'confirmed',
    'stale'
  ) then
    raise exception
      'Invalid controlled publication status';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'Controlled publication requires owner or admin';
  end if;

  return query
  select
    p.*
  from
    public.ai_controlled_publications p
  where
    p.organization_id =
      p_organization_id
    and (
      p_status is null
      or p.status =
        p_status
    )
  order by
    p.created_at desc,
    p.id desc
  limit
    p_limit
  offset
    p_offset;
end;

$function$;

CREATE OR REPLACE FUNCTION public.get_ai_usage_summary (
  p_organization_id uuid,
  p_period_start    timestamp with time zone DEFAULT date_trunc('month'::text, now()),
  p_period_end      timestamp with time zone DEFAULT now()
)
  RETURNS jsonb
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select jsonb_build_object(
    'organization_id', p_organization_id,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'requests', count(*),
    'completed_requests',
      count(*) filter (where request_status = 'completed'),
    'failed_requests',
      count(*) filter (where request_status = 'failed'),
    'input_tokens', coalesce(sum(input_tokens), 0),
    'cached_input_tokens', coalesce(sum(cached_input_tokens), 0),
    'cache_write_tokens', coalesce(sum(cache_write_tokens), 0),
    'output_tokens', coalesce(sum(output_tokens), 0),
    'total_tokens', coalesce(sum(total_tokens), 0),
    'estimated_cost_usd', coalesce(sum(estimated_cost_usd), 0),
    'credits_charged', coalesce(sum(credits_charged), 0),
    'credit_balance',
      (
        select coalesce(sum(c.amount), 0)
        from public.ai_credit_ledger c
        where c.organization_id = p_organization_id
      )
  )
  from public.ai_usage_ledger u
  where u.organization_id = p_organization_id
    and u.created_at >= p_period_start
    and u.created_at < p_period_end;
$function$;

CREATE OR REPLACE FUNCTION public.get_billing_overview (
  p_organization_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_period_start timestamptz;

  v_subscription jsonb := null;
  v_plan jsonb := null;

  v_usage jsonb := '{}'::jsonb;

  v_usage_updated_at timestamptz := null;

  v_plans jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'Organization is required';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'Organization access denied';
  end if;

  v_period_start :=
    date_trunc(
      'month',
      now()
    );

  select
    jsonb_build_object(
      'id',
      s.id,

      'status',
      s.status,

      'provider',
      s.provider,

      'provider_customer_id',
      s.provider_customer_id,

      'provider_subscription_id',
      s.provider_subscription_id,

      'current_period_start',
      s.current_period_start,

      'current_period_end',
      s.current_period_end,

      'trial_ends_at',
      s.trial_ends_at,

      'cancel_at_period_end',
      s.cancel_at_period_end
    ),

    jsonb_build_object(
      'id',
      p.id,

      'slug',
      p.slug,

      'name',
      p.name,

      'description',
      p.description,

      'currency',
      p.currency,

      'price_monthly',
      p.price_monthly,

      'price_annual',
      p.price_annual,

      'features',
      p.features,

      'limits',
      p.limits
    )

  into
    v_subscription,
    v_plan

  from public.organization_subscriptions s

  join public.billing_plans p
    on p.id = s.plan_id

  where s.organization_id =
    p_organization_id

  limit 1;

  -- Safety fallback if an organization was created without
  -- a subscription row for any reason.
  if v_plan is null then

    select
      jsonb_build_object(
        'id',
        p.id,

        'slug',
        p.slug,

        'name',
        p.name,

        'description',
        p.description,

        'currency',
        p.currency,

        'price_monthly',
        p.price_monthly,

        'price_annual',
        p.price_annual,

        'features',
        p.features,

        'limits',
        p.limits
      )

    into v_plan

    from public.billing_plans p

    where p.slug =
      'default'

    limit 1;

  end if;

  select
    bu.metrics,
    bu.updated_at

  into
    v_usage,
    v_usage_updated_at

  from public.billing_usage bu

  where bu.organization_id =
      p_organization_id

    and bu.period_start =
      v_period_start

  limit 1;

  if v_usage is null then
    v_usage :=
      '{}'::jsonb;
  end if;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,

          'slug',
          p.slug,

          'name',
          p.name,

          'description',
          p.description,

          'currency',
          p.currency,

          'price_monthly',
          p.price_monthly,

          'price_annual',
          p.price_annual,

          'features',
          p.features,

          'limits',
          p.limits,

          'is_public',
          p.is_public
        )
        order by
          p.sort_order,
          p.name
      ),
      '[]'::jsonb
    )

  into v_plans

  from public.billing_plans p

  where p.is_active
    and p.is_public;

  return jsonb_build_object(
    'subscription',
    v_subscription,

    'plan',
    v_plan,

    'usage',
    v_usage,

    'usage_updated_at',
    v_usage_updated_at,

    'period',
    jsonb_build_object(
      'start',
      v_period_start,

      'end',
      v_period_start +
        interval '1 month'
    ),

    'plans',
    v_plans,

    'provider_checkout_configured',
    false
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_commerce_analytics (
  p_organization_id uuid,
  p_days            integer DEFAULT 30
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_start timestamptz;

  v_orders bigint := 0;
  v_completed bigint := 0;
  v_pending bigint := 0;
  v_processing bigint := 0;
  v_cancelled bigint := 0;

  v_revenue numeric := 0;
  v_cogs numeric := 0;
  v_gross_profit numeric := 0;
  v_aov numeric := 0;

  v_products bigint := 0;
  v_active_products bigint := 0;

  v_base_stock numeric := 0;
  v_base_retail_value numeric := 0;
  v_base_cost_value numeric := 0;

  v_variants bigint := 0;
  v_variant_stock numeric := 0;
  v_variant_retail_value numeric := 0;
  v_variant_cost_value numeric := 0;

  v_research_total bigint := 0;
  v_research_shortlisted bigint := 0;
  v_research_approved bigint := 0;
  v_research_rejected bigint := 0;
  v_avg_opportunity numeric := 0;

  v_price_targets bigint := 0;
  v_active_price_targets bigint := 0;
  v_price_observations bigint := 0;
  v_price_alerts bigint := 0;

  v_automation_rules bigint := 0;
  v_active_automation_rules bigint := 0;
  v_automation_runs bigint := 0;
  v_automation_executed bigint := 0;
  v_automation_proposed bigint := 0;
  v_automation_failed bigint := 0;
  v_pending_actions bigint := 0;

  v_research_ai_runs bigint := 0;
  v_description_ai_runs bigint := 0;
  v_agent_runs bigint := 0;
  v_agent_completed bigint := 0;
  v_agent_failed bigint := 0;

  v_daily_sales jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception 'Organization is required';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception 'Organization access denied';
  end if;

  if p_days is null
     or p_days < 1
     or p_days > 365 then
    raise exception
      'Analytics period must be between 1 and 365 days';
  end if;

  v_start :=
    now() - make_interval(days => p_days);


  -- =======================================================
  -- ORDERS
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where status = 'completed'
    ),

    count(*) filter (
      where status = 'pending'
    ),

    count(*) filter (
      where status = 'processing'
    ),

    count(*) filter (
      where status = 'cancelled'
    )
  into
    v_orders,
    v_completed,
    v_pending,
    v_processing,
    v_cancelled
  from public.orders
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  -- =======================================================
  -- COMPLETED SALES
  --
  -- order_items has:
  -- price
  -- cost_price_snapshot
  --
  -- Tenant ownership comes from orders.organization_id.
  -- =======================================================

  select
    coalesce(
      sum(
        oi.quantity::numeric *
        oi.price::numeric
      ),
      0
    ),

    coalesce(
      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot::numeric
      ),
      0
    )
  into
    v_revenue,
    v_cogs
  from public.order_items oi

  join public.orders o
    on o.id = oi.order_id

  where o.organization_id =
      p_organization_id

    and o.status =
      'completed'

    and o.created_at >=
      v_start;


  v_gross_profit :=
    v_revenue - v_cogs;


  if v_completed > 0 then
    v_aov :=
      v_revenue /
      v_completed;
  end if;


  -- =======================================================
  -- CATALOG
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where status = 'active'
    ),

    coalesce(
      sum(stock::numeric),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        price::numeric
      ),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        cost_price::numeric
      ),
      0
    )
  into
    v_products,
    v_active_products,
    v_base_stock,
    v_base_retail_value,
    v_base_cost_value
  from public.products
  where organization_id =
    p_organization_id;


  select
    count(*),

    coalesce(
      sum(stock::numeric),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        price::numeric
      ),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        cost_price::numeric
      ),
      0
    )
  into
    v_variants,
    v_variant_stock,
    v_variant_retail_value,
    v_variant_cost_value
  from public.product_variants
  where organization_id =
    p_organization_id;


  -- =======================================================
  -- PRODUCT RESEARCH
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where status = 'shortlisted'
    ),

    count(*) filter (
      where status = 'approved'
    ),

    count(*) filter (
      where status = 'rejected'
    ),

    coalesce(
      avg(opportunity_score),
      0
    )
  into
    v_research_total,
    v_research_shortlisted,
    v_research_approved,
    v_research_rejected,
    v_avg_opportunity
  from public.product_research_items
  where organization_id =
    p_organization_id;


  -- =======================================================
  -- PRICE MONITORING
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where is_active
    )
  into
    v_price_targets,
    v_active_price_targets
  from public.price_monitor_targets
  where organization_id =
    p_organization_id;


  select
    count(*),

    count(*) filter (
      where threshold_triggered
    )
  into
    v_price_observations,
    v_price_alerts
  from public.price_observations
  where organization_id =
      p_organization_id
    and observed_at >= v_start;


  -- =======================================================
  -- AUTOMATION
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where is_active
    )
  into
    v_automation_rules,
    v_active_automation_rules
  from public.automation_rules
  where organization_id =
    p_organization_id;


  select
    count(*),

    count(*) filter (
      where status = 'executed'
    ),

    count(*) filter (
      where status = 'proposed'
    ),

    count(*) filter (
      where status = 'failed'
    )
  into
    v_automation_runs,
    v_automation_executed,
    v_automation_proposed,
    v_automation_failed
  from public.automation_runs
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  select
    count(*)
  into
    v_pending_actions
  from public.automation_actions
  where organization_id =
      p_organization_id
    and status = 'pending';


  -- =======================================================
  -- AI ACTIVITY
  -- =======================================================

  select count(*)
  into v_research_ai_runs
  from public.product_research_ai_runs
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  select count(*)
  into v_description_ai_runs
  from public.product_description_generations
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  select
    count(*),

    count(*) filter (
      where status = 'completed'
    ),

    count(*) filter (
      where status = 'failed'
    )
  into
    v_agent_runs,
    v_agent_completed,
    v_agent_failed
  from public.ai_agent_runs
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  -- =======================================================
  -- DAILY SALES TREND
  -- =======================================================

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'date',
          x.day,

          'orders',
          x.order_count,

          'completed_orders',
          x.completed_count,

          'revenue',
          x.revenue
        )
        order by x.day
      ),
      '[]'::jsonb
    )
  into
    v_daily_sales
  from (
    select
      d.day::date as day,

      count(
        distinct o.id
      ) as order_count,

      count(
        distinct o.id
      ) filter (
        where o.status =
          'completed'
      ) as completed_count,

      coalesce(
        sum(
          oi.quantity::numeric *
          oi.price::numeric
        ) filter (
          where o.status =
            'completed'
        ),
        0
      ) as revenue

    from generate_series(
      current_date -
        (p_days - 1),

      current_date,

      interval '1 day'
    ) as d(day)

    left join public.orders o
      on o.organization_id =
           p_organization_id

     and o.created_at::date =
           d.day::date

    left join public.order_items oi
      on oi.order_id =
           o.id

    group by
      d.day::date
  ) x;


  -- =======================================================
  -- RESPONSE
  -- =======================================================

  return jsonb_build_object(
    'generated_at',
    now(),

    'period_days',
    p_days,

    'period_start',
    v_start,

    'sales',
    jsonb_build_object(
      'orders',
      v_orders,

      'completed_orders',
      v_completed,

      'pending_orders',
      v_pending,

      'processing_orders',
      v_processing,

      'cancelled_orders',
      v_cancelled,

      'revenue',
      v_revenue,

      'cogs',
      v_cogs,

      'gross_profit',
      v_gross_profit,

      'average_order_value',
      v_aov
    ),

    'catalog',
    jsonb_build_object(
      'products',
      v_products,

      'active_products',
      v_active_products,

      'base_stock_units',
      v_base_stock,

      'base_retail_value',
      v_base_retail_value,

      'base_cost_value',
      v_base_cost_value,

      'variants',
      v_variants,

      'variant_stock_units',
      v_variant_stock,

      'variant_retail_value',
      v_variant_retail_value,

      'variant_cost_value',
      v_variant_cost_value
    ),

    'research',
    jsonb_build_object(
      'total',
      v_research_total,

      'shortlisted',
      v_research_shortlisted,

      'approved',
      v_research_approved,

      'rejected',
      v_research_rejected,

      'average_opportunity_score',
      v_avg_opportunity
    ),

    'price_monitoring',
    jsonb_build_object(
      'targets',
      v_price_targets,

      'active_targets',
      v_active_price_targets,

      'observations',
      v_price_observations,

      'threshold_alerts',
      v_price_alerts
    ),

    'automation',
    jsonb_build_object(
      'rules',
      v_automation_rules,

      'active_rules',
      v_active_automation_rules,

      'runs',
      v_automation_runs,

      'executed_runs',
      v_automation_executed,

      'proposed_runs',
      v_automation_proposed,

      'failed_runs',
      v_automation_failed,

      'pending_actions',
      v_pending_actions
    ),

    'ai_activity',
    jsonb_build_object(
      'research_runs',
      v_research_ai_runs,

      'description_runs',
      v_description_ai_runs,

      'agent_runs',
      v_agent_runs,

      'agent_completed',
      v_agent_completed,

      'agent_failed',
      v_agent_failed
    ),

    'daily_sales',
    v_daily_sales
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_inventory_alerts (
  p_organization_id uuid,
  p_limit           integer DEFAULT 50
)
  RETURNS TABLE (
    target_type         text,
    target_id           uuid,
    product_id          uuid,
    name                text,
    sku                 text,
    stock               integer,
    low_stock_threshold integer,
    stock_status        text
  )
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception 'User is not a member of this organization'
      using errcode = '42501';
  end if;

  if p_limit is null
     or p_limit < 1
     or p_limit > 100 then
    raise exception 'Alert limit must be between 1 and 100'
      using errcode = 'P0001';
  end if;


  return query

  select
    x.target_type,
    x.target_id,
    x.product_id,
    x.name,
    x.sku,
    x.stock,
    x.low_stock_threshold,
    x.stock_status
  from (

    select
      'product'::text as target_type,
      p.id as target_id,
      p.id as product_id,
      p.name,
      p.sku,
      p.stock,
      p.low_stock_threshold,
      case
        when p.stock = 0
          then 'out_of_stock'
        else 'low_stock'
      end::text as stock_status

    from public.products p

    where p.organization_id = p_organization_id
      and p.status = 'active'
      and (
        p.stock = 0
        or (
          p.stock > 0
          and p.stock <= p.low_stock_threshold
        )
      )


    union all


    select
      'variant'::text as target_type,
      pv.id as target_id,
      pv.product_id,
      pv.name,
      pv.sku,
      pv.stock,
      pv.low_stock_threshold,
      case
        when pv.stock = 0
          then 'out_of_stock'
        else 'low_stock'
      end::text as stock_status

    from public.product_variants pv

    where pv.organization_id = p_organization_id
      and pv.status = 'active'
      and (
        pv.stock = 0
        or (
          pv.stock > 0
          and pv.stock <= pv.low_stock_threshold
        )
      )

  ) x

  order by
    case
      when x.stock_status = 'out_of_stock' then 0
      else 1
    end,
    x.stock asc,
    x.name asc

  limit p_limit;

end;
$function$;

CREATE OR REPLACE FUNCTION public.get_inventory_intelligence (
  p_organization_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_products jsonb;
  v_variants jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception 'User is not a member of this organization'
      using errcode = '42501';
  end if;


  select jsonb_build_object(
    'total_items',
      count(*),

    'active_items',
      count(*) filter (
        where status = 'active'
      ),

    'total_stock',
      coalesce(sum(stock), 0),

    'low_stock',
      count(*) filter (
        where status = 'active'
          and stock > 0
          and stock <= low_stock_threshold
      ),

    'out_of_stock',
      count(*) filter (
        where status = 'active'
          and stock = 0
      ),

    'inventory_cost_value',
      coalesce(
        sum(
          stock::numeric * cost_price
        ),
        0
      ),

    'inventory_selling_value',
      coalesce(
        sum(
          stock::numeric * price
        ),
        0
      ),

    'potential_profit',
      coalesce(
        sum(
          stock::numeric * (price - cost_price)
        ),
        0
      )
  )
  into v_products
  from public.products
  where organization_id = p_organization_id;


  select jsonb_build_object(
    'total_items',
      count(*),

    'active_items',
      count(*) filter (
        where status = 'active'
      ),

    'total_stock',
      coalesce(sum(stock), 0),

    'low_stock',
      count(*) filter (
        where status = 'active'
          and stock > 0
          and stock <= low_stock_threshold
      ),

    'out_of_stock',
      count(*) filter (
        where status = 'active'
          and stock = 0
      ),

    'inventory_cost_value',
      coalesce(
        sum(
          stock::numeric * cost_price
        ),
        0
      ),

    'inventory_selling_value',
      coalesce(
        sum(
          stock::numeric * price
        ),
        0
      ),

    'potential_profit',
      coalesce(
        sum(
          stock::numeric * (price - cost_price)
        ),
        0
      )
  )
  into v_variants
  from public.product_variants
  where organization_id = p_organization_id;


  return jsonb_build_object(
    'products', v_products,
    'variants', v_variants
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_authorized_shops (
  p_marketplace_account_id uuid
)
  RETURNS TABLE (
    id               uuid,
    external_shop_id text,
    shop_code        text,
    name             text,
    region           text,
    seller_type      text,
    status           text,
    is_selected      boolean,
    last_seen_at     timestamp with time zone,
    created_at       timestamp with time zone,
    updated_at       timestamp with time zone
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    s.id,
    s.external_shop_id,
    s.shop_code,
    s.name,
    s.region,
    s.seller_type,
    s.status,
    s.is_selected,
    s.last_seen_at,
    s.created_at,
    s.updated_at
  from public.marketplace_authorized_shops s
  where s.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = s.organization_id
        and m.user_id = auth.uid()
    )
  order by
    s.is_selected desc,
    s.status asc,
    s.name asc;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_catalog_products (
  p_marketplace_account_id uuid,
  p_limit                  integer DEFAULT 200
)
  RETURNS TABLE (
    id                   uuid,
    external_product_id  text,
    title                text,
    external_status      text,
    sku_count            bigint,
    seller_skus          text[],
    last_seen_at         timestamp with time zone,
    external_update_time timestamp with time zone
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    p.id,
    p.external_product_id,
    p.title,
    p.external_status,
    count(s.id)::bigint as sku_count,
    coalesce(
      array_agg(s.seller_sku order by s.seller_sku)
        filter (where s.seller_sku is not null),
      '{}'::text[]
    ) as seller_skus,
    p.last_seen_at,
    p.external_update_time
  from public.marketplace_catalog_products p
  left join public.marketplace_catalog_skus s
    on s.catalog_product_id = p.id
   and s.organization_id = p.organization_id
  where p.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = p.organization_id
        and m.user_id = auth.uid()
    )
  group by
    p.id,
    p.external_product_id,
    p.title,
    p.external_status,
    p.last_seen_at,
    p.external_update_time
  order by
    p.last_seen_at desc,
    p.title asc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_connection_refresh_context (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid
)
  RETURNS TABLE (
    provider                 text,
    status                   text,
    open_id                  text,
    user_type                integer,
    access_token_ciphertext  text,
    refresh_token_ciphertext text,
    access_token_expires_at  timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    granted_scopes           text[]
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    c.provider,
    c.status,
    c.open_id,
    c.user_type,
    c.access_token_ciphertext,
    c.refresh_token_ciphertext,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id =
        p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_connection_secret (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid
)
  RETURNS TABLE (
    provider                 text,
    status                   text,
    access_token_ciphertext  text,
    refresh_token_ciphertext text,
    access_token_expires_at  timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    granted_scopes           text[]
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    c.provider,
    c.status,
    c.access_token_ciphertext,
    c.refresh_token_ciphertext,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_connection_status (
  p_marketplace_account_id uuid
)
  RETURNS TABLE (
    provider                 text,
    status                   text,
    connected_at             timestamp with time zone,
    access_token_expires_at  timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    granted_scopes           text[],
    updated_at               timestamp with time zone
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    c.provider,
    c.status,
    c.connected_at,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes,
    c.updated_at
  from public.marketplace_connections c
  where c.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = auth.uid()
    )
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_external_order_bridge_readiness (
  p_marketplace_account_id uuid
)
  RETURNS TABLE (
    external_order_row_id    uuid,
    external_order_id        text,
    total_items              bigint,
    mapped_items             bigint,
    unmapped_items           bigint,
    ambiguous_items          bigint,
    linked_internal_order_id uuid,
    ready                    boolean
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  with scoped_orders as (
    select
      o.id,
      o.organization_id,
      o.marketplace_account_id,
      o.external_order_id
    from public.marketplace_external_orders o
    where o.marketplace_account_id = p_marketplace_account_id
      and exists (
        select 1
        from public.organization_members m
        where m.organization_id = o.organization_id
          and m.user_id = auth.uid()
      )
  ),
  item_mapping as (
    select
      o.id as external_order_row_id,
      i.id as external_item_id,

      (
        select count(*)
        from public.marketplace_listings l
        where l.organization_id = o.organization_id
          and l.marketplace_account_id = o.marketplace_account_id
          and l.target_type = 'variant'
          and l.variant_id is not null
          and l.listing_status = 'active'
          and l.sync_enabled = true
          and i.seller_sku is not null
          and l.external_sku is not null
          and lower(btrim(l.external_sku)) =
              lower(btrim(i.seller_sku))
      ) as variant_match_count,

      (
        select count(*)
        from public.marketplace_listings l
        where l.organization_id = o.organization_id
          and l.marketplace_account_id = o.marketplace_account_id
          and l.target_type = 'product'
          and l.product_id is not null
          and l.listing_status = 'active'
          and l.sync_enabled = true
          and i.external_product_id is not null
          and l.external_listing_id is not null
          and btrim(l.external_listing_id) =
              btrim(i.external_product_id)
      ) as product_match_count

    from scoped_orders o
    join public.marketplace_external_order_items i
      on i.external_order_id = o.id
     and i.organization_id = o.organization_id
  ),
  aggregate_mapping as (
    select
      o.id as external_order_row_id,
      count(m.external_item_id)::bigint as total_items,

      count(m.external_item_id) filter (
        where
          m.variant_match_count = 1
          or (
            m.variant_match_count = 0
            and m.product_match_count = 1
          )
      )::bigint as mapped_items,

      count(m.external_item_id) filter (
        where
          m.variant_match_count = 0
          and m.product_match_count = 0
      )::bigint as unmapped_items,

      count(m.external_item_id) filter (
        where
          m.variant_match_count > 1
          or (
            m.variant_match_count = 0
            and m.product_match_count > 1
          )
      )::bigint as ambiguous_items

    from scoped_orders o
    left join item_mapping m
      on m.external_order_row_id = o.id
    group by o.id
  )
  select
    o.id,
    o.external_order_id,
    coalesce(a.total_items, 0)::bigint,
    coalesce(a.mapped_items, 0)::bigint,
    coalesce(a.unmapped_items, 0)::bigint,
    coalesce(a.ambiguous_items, 0)::bigint,

    (
      select l.order_id
      from public.marketplace_order_links l
      where l.organization_id = o.organization_id
        and l.marketplace_account_id =
            o.marketplace_account_id
        and l.external_order_id = o.external_order_id
      order by l.created_at desc
      limit 1
    ) as linked_internal_order_id,

    (
      coalesce(a.total_items, 0) > 0
      and coalesce(a.mapped_items, 0) =
          coalesce(a.total_items, 0)
      and coalesce(a.unmapped_items, 0) = 0
      and coalesce(a.ambiguous_items, 0) = 0
      and not exists (
        select 1
        from public.marketplace_order_links l
        where l.organization_id = o.organization_id
          and l.marketplace_account_id =
              o.marketplace_account_id
          and l.external_order_id = o.external_order_id
      )
    ) as ready

  from scoped_orders o
  left join aggregate_mapping a
    on a.external_order_row_id = o.id
  order by o.id;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_external_orders (
  p_marketplace_account_id uuid,
  p_limit                  integer DEFAULT 200
)
  RETURNS TABLE (
    id                       uuid,
    external_order_id        text,
    external_status          text,
    payment_currency         text,
    payment_subtotal         numeric,
    payment_total_amount     numeric,
    item_count               bigint,
    external_create_time     timestamp with time zone,
    external_update_time     timestamp with time zone,
    last_seen_at             timestamp with time zone,
    linked_internal_order_id uuid
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    o.id,
    o.external_order_id,
    o.external_status,
    o.payment_currency,
    o.payment_subtotal,
    o.payment_total_amount,
    count(i.id)::bigint as item_count,
    o.external_create_time,
    o.external_update_time,
    o.last_seen_at,
    (
      select l.order_id
      from public.marketplace_order_links l
      where l.marketplace_account_id =
              o.marketplace_account_id
        and l.organization_id = o.organization_id
        and l.external_order_id = o.external_order_id
      order by l.created_at desc
      limit 1
    ) as linked_internal_order_id
  from public.marketplace_external_orders o
  left join public.marketplace_external_order_items i
    on i.external_order_id = o.id
   and i.organization_id = o.organization_id
  where o.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = o.organization_id
        and m.user_id = auth.uid()
    )
  group by
    o.id,
    o.external_order_id,
    o.external_status,
    o.payment_currency,
    o.payment_subtotal,
    o.payment_total_amount,
    o.external_create_time,
    o.external_update_time,
    o.last_seen_at,
    o.marketplace_account_id,
    o.organization_id
  order by
    o.external_update_time desc nulls last,
    o.last_seen_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_order_status_reconciliation (
  p_marketplace_account_id uuid
)
  RETURNS TABLE (
    external_order_row_id uuid,
    external_order_id     text,
    external_status       text,
    internal_order_id     uuid,
    internal_status       text,
    proposed_status       text,
    action_required       boolean,
    reason                text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  with scoped as (
    select
      eo.id as external_order_row_id,
      eo.external_order_id,
      upper(btrim(eo.external_status)) as external_status,
      l.order_id as internal_order_id,
      o.status as internal_status
    from public.marketplace_external_orders eo
    join public.marketplace_order_links l
      on l.organization_id = eo.organization_id
     and l.marketplace_account_id =
         eo.marketplace_account_id
     and l.external_order_id = eo.external_order_id
    join public.orders o
      on o.id = l.order_id
     and o.organization_id = eo.organization_id
    where eo.marketplace_account_id =
          p_marketplace_account_id
      and exists (
        select 1
        from public.organization_members m
        where m.organization_id = eo.organization_id
          and m.user_id = auth.uid()
      )
  ),
  proposal as (
    select
      s.*,
      case
        when s.internal_status in ('completed', 'cancelled')
          then null

        when s.external_status in (
          'UNPAID',
          'ON_HOLD'
        )
          then null

        when s.external_status in (
          'AWAITING_SHIPMENT',
          'PARTIALLY_SHIPPING',
          'AWAITING_COLLECTION',
          'IN_TRANSIT',
          'DELIVERED'
        )
        and s.internal_status = 'pending'
          then 'processing'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'pending'
          then 'processing'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'processing'
          then 'completed'

        when s.external_status in (
          'CANCEL',
          'CANCELLED'
        )
        and s.internal_status in (
          'pending',
          'processing'
        )
          then 'cancelled'

        else null
      end as proposed_status,

      case
        when s.internal_status = 'completed'
          then 'Internal order is already completed.'

        when s.internal_status = 'cancelled'
          then 'Internal order is already cancelled.'

        when s.external_status = 'UNPAID'
          then 'Marketplace order is still unpaid.'

        when s.external_status = 'ON_HOLD'
          then 'Marketplace order is still inside the hold/remorse stage.'

        when s.external_status in (
          'AWAITING_SHIPMENT',
          'PARTIALLY_SHIPPING',
          'AWAITING_COLLECTION',
          'IN_TRANSIT'
        )
        and s.internal_status = 'pending'
          then 'Marketplace fulfillment started; approval will move the internal order to processing.'

        when s.external_status = 'DELIVERED'
        and s.internal_status = 'pending'
          then 'Marketplace order is delivered; approval first moves the internal order to processing. Completion waits for marketplace COMPLETED.'

        when s.external_status in (
          'AWAITING_SHIPMENT',
          'PARTIALLY_SHIPPING',
          'AWAITING_COLLECTION',
          'IN_TRANSIT',
          'DELIVERED'
        )
        and s.internal_status = 'processing'
          then 'Internal processing state is aligned; terminal completion waits for marketplace COMPLETED.'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'pending'
          then 'Marketplace is completed, but internal authority requires pending -> processing before processing -> completed.'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'processing'
          then 'Marketplace is completed; approval can complete the internal order.'

        when s.external_status in (
          'CANCEL',
          'CANCELLED'
        )
        and s.internal_status in (
          'pending',
          'processing'
        )
          then 'Marketplace is cancelled; approval can cancel the internal order through the protected status workflow.'

        else 'No supported reconciliation action for this status pair.'
      end as reason
    from scoped s
  )
  select
    external_order_row_id,
    external_order_id,
    external_status,
    internal_order_id,
    internal_status,
    proposed_status,
    proposed_status is not null as action_required,
    reason
  from proposal
  order by external_order_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_order_sync_context (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid
)
  RETURNS TABLE (
    provider                text,
    connection_status       text,
    access_token_ciphertext text,
    access_token_expires_at timestamp with time zone,
    granted_scopes          text[],
    authorized_shop_id      uuid,
    external_shop_id        text,
    shop_cipher_ciphertext  text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    c.provider,
    c.status,
    c.access_token_ciphertext,
    c.access_token_expires_at,
    c.granted_scopes,
    s.id,
    s.external_shop_id,
    s.shop_cipher_ciphertext
  from public.marketplace_connections c
  join public.marketplace_authorized_shops s
    on s.marketplace_account_id = c.marketplace_account_id
   and s.organization_id = c.organization_id
   and s.is_selected = true
   and s.status = 'active'
  where c.organization_id = p_organization_id
    and c.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_product_sync_context (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid
)
  RETURNS TABLE (
    provider                text,
    connection_status       text,
    access_token_ciphertext text,
    access_token_expires_at timestamp with time zone,
    granted_scopes          text[],
    authorized_shop_id      uuid,
    external_shop_id        text,
    shop_cipher_ciphertext  text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    c.provider,
    c.status,
    c.access_token_ciphertext,
    c.access_token_expires_at,
    c.granted_scopes,
    s.id,
    s.external_shop_id,
    s.shop_cipher_ciphertext
  from public.marketplace_connections c
  join public.marketplace_authorized_shops s
    on s.marketplace_account_id = c.marketplace_account_id
   and s.organization_id = c.organization_id
   and s.is_selected = true
   and s.status = 'active'
  where c.organization_id = p_organization_id
    and c.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketplace_webhook_events (
  p_marketplace_account_id uuid,
  p_limit                  integer DEFAULT 100
)
  RETURNS TABLE (
    id                   uuid,
    notification_id      text,
    notification_type    integer,
    external_shop_id     text,
    external_entity_id   text,
    external_status      text,
    external_update_time timestamp with time zone,
    processing_status    text,
    attempt_count        integer,
    last_attempt_at      timestamp with time zone,
    processing_message   text,
    received_at          timestamp with time zone
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  select
    e.id,
    e.notification_id,
    e.notification_type,
    e.external_shop_id,
    e.external_entity_id,
    e.external_status,
    e.external_update_time,
    e.processing_status,
    e.attempt_count,
    e.last_attempt_at,
    e.processing_message,
    e.received_at
  from public.marketplace_webhook_events e
  where e.marketplace_account_id =
        p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = e.organization_id
        and m.user_id = auth.uid()
    )
  order by e.received_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$function$;

CREATE OR REPLACE FUNCTION public.get_product_performance (
  p_organization_id uuid,
  p_product_id      uuid DEFAULT NULL::uuid
)
  RETURNS TABLE (
    product_id       uuid,
    product_name     text,
    sku              text,
    stock            integer,
    total_units_sold bigint,
    revenue          numeric,
    cost             numeric,
    profit           numeric,
    margin           numeric
  )
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  return query

  with completed_sales as (

    select
      oi.product_id,

      sum(oi.quantity)::bigint
        as units_sold,

      sum(
        oi.quantity::numeric * oi.price
      )
        as sales_revenue,

      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot
      )
        as sales_cost

    from public.orders o

    join public.order_items oi
      on oi.order_id = o.id

    where o.organization_id =
            p_organization_id

      and o.status = 'completed'

    group by oi.product_id
  )

  select
    p.id,
    p.name,
    p.sku,
    p.stock,

    coalesce(
      cs.units_sold,
      0
    )::bigint,

    coalesce(
      cs.sales_revenue,
      0
    )::numeric,

    coalesce(
      cs.sales_cost,
      0
    )::numeric,

    (
      coalesce(
        cs.sales_revenue,
        0
      )
      -
      coalesce(
        cs.sales_cost,
        0
      )
    )::numeric,

    case
      when coalesce(
        cs.sales_revenue,
        0
      ) > 0
      then round(
        (
          (
            coalesce(
              cs.sales_revenue,
              0
            )
            -
            coalesce(
              cs.sales_cost,
              0
            )
          )
          /
          cs.sales_revenue
        ) * 100,
        2
      )
      else 0::numeric
    end

  from public.products p

  left join completed_sales cs
    on cs.product_id = p.id

  where p.organization_id =
          p_organization_id

    and (
      p_product_id is null
      or p.id = p_product_id
    )

  order by
    coalesce(
      cs.sales_revenue,
      0
    ) desc,
    p.name asc;

end;
$function$;

CREATE OR REPLACE FUNCTION public.get_publishing_channel_destinations (
  p_organization_id uuid,
  p_provider        text DEFAULT NULL::text
)
  RETURNS TABLE (
    id                      uuid,
    provider                text,
    destination_type        text,
    external_destination_id text,
    display_name            text,
    status                  text,
    capabilities            text[],
    is_selected             boolean,
    created_at              timestamp with time zone,
    updated_at              timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_provider text;
begin
  if auth.uid() is null then
    raise exception
      'authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where
      m.organization_id =
        p_organization_id
      and m.user_id =
        auth.uid()
  ) then
    raise exception
      'organization membership required';
  end if;

  v_provider :=
    nullif(
      lower(
        btrim(
          coalesce(
            p_provider,
            ''
          )
        )
      ),
      ''
    );

  if
    v_provider is not null
    and (
      length(v_provider) > 100
      or v_provider !~
        '^[a-z0-9][a-z0-9._-]{0,99}$'
    )
  then
    raise exception
      'invalid publishing provider';
  end if;

  return query
  select
    d.id,
    d.provider,
    d.destination_type,
    d.external_destination_id,
    d.display_name,
    d.status,
    d.capabilities,
    d.is_selected,
    d.created_at,
    d.updated_at
  from
    public.publishing_channel_destinations d
  where
    d.organization_id =
      p_organization_id
    and (
      v_provider is null
      or d.provider =
        v_provider
    )
  order by
    d.is_selected desc,
    d.provider asc,
    d.display_name asc,
    d.id asc;
end
$function$;

CREATE OR REPLACE FUNCTION public.get_publishing_provider_connections (
  p_organization_id uuid,
  p_provider        text DEFAULT NULL::text
)
  RETURNS TABLE (
    id                      uuid,
    organization_id         uuid,
    provider                text,
    external_account_id     text,
    authorization_status    text,
    granted_scopes          text[],
    supported_capabilities  text[],
    credential_reference_id uuid,
    credential_expires_at   timestamp with time zone,
    credential_updated_at   timestamp with time zone,
    revoked_at              timestamp with time zone,
    version                 bigint,
    updated_at              timestamp with time zone
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
  AS $function$
declare
  v_provider text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'organization_owner_or_admin_required'
      using errcode = '42501';
  end if;

  v_provider :=
    case
      when p_provider is null then null
      else lower(btrim(p_provider))
    end;

  if v_provider = '' then
    raise exception 'provider_invalid'
      using errcode = '22023';
  end if;

  return query
  select
    c.id,
    c.organization_id,
    c.provider,
    c.external_account_id,
    c.authorization_status,
    c.granted_scopes,
    c.supported_capabilities,
    c.credential_reference_id,
    c.credential_expires_at,
    c.credential_updated_at,
    c.revoked_at,
    c.version,
    c.updated_at
  from public.publishing_provider_connections c
  where c.organization_id = p_organization_id
    and (
      v_provider is null
      or c.provider = v_provider
    )
  order by c.provider, c.created_at, c.id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_publishing_provider_execution_credentials (
  p_organization_id uuid,
  p_provider        text
)
  RETURNS TABLE (
    connection_id           uuid,
    external_account_id     text,
    granted_scopes          text[],
    credential_reference_id uuid,
    access_token_ciphertext text,
    access_token_expires_at timestamp with time zone,
    encryption_key_version  text
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
  AS $function$
declare
  v_provider text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_required'
      using errcode = '22023';
  end if;

  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  if v_provider = '' then
    raise exception 'provider_required'
      using errcode = '22023';
  end if;

  return query
  select
    c.id,
    c.external_account_id,
    c.granted_scopes,
    c.credential_reference_id,
    pc.access_token_ciphertext,
    pc.access_token_expires_at,
    pc.encryption_key_version
  from public.publishing_provider_connections c
  join public.publishing_provider_credentials pc
    on pc.id = c.credential_reference_id
   and pc.connection_id = c.id
  where c.organization_id = p_organization_id
    and c.provider = v_provider
    and c.authorization_status = 'authorized'
    and c.revoked_at is null
  order by
    c.updated_at desc,
    c.id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_sales_performance_summary (
  p_organization_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_completed_orders bigint;
  v_units_sold bigint;
  v_revenue numeric;
  v_cost numeric;
  v_profit numeric;
  v_margin numeric;
  v_products_sold bigint;
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  select
    count(distinct o.id)::bigint,

    coalesce(
      sum(oi.quantity),
      0
    )::bigint,

    coalesce(
      sum(
        oi.quantity::numeric *
        oi.price
      ),
      0
    )::numeric,

    coalesce(
      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot
      ),
      0
    )::numeric,

    count(
      distinct oi.product_id
    )::bigint

  into
    v_completed_orders,
    v_units_sold,
    v_revenue,
    v_cost,
    v_products_sold

  from public.orders o

  join public.order_items oi
    on oi.order_id = o.id

  where o.organization_id =
          p_organization_id

    and o.status = 'completed';


  v_profit :=
    v_revenue - v_cost;


  v_margin :=
    case
      when v_revenue > 0 then
        round(
          (
            v_profit /
            v_revenue
          ) * 100,
          2
        )

      else 0::numeric
    end;


  return jsonb_build_object(
    'completed_orders',
      v_completed_orders,

    'units_sold',
      v_units_sold,

    'products_sold',
      v_products_sold,

    'revenue',
      v_revenue,

    'cost',
      v_cost,

    'profit',
      v_profit,

    'margin',
      v_margin,

    'average_order_value',
      case
        when v_completed_orders > 0
        then round(
          v_revenue /
          v_completed_orders,
          2
        )
        else 0::numeric
      end
  );

end;
$function$;

CREATE OR REPLACE FUNCTION public.get_sales_trend (
  p_organization_id uuid,
  p_days            integer DEFAULT 30
)
  RETURNS TABLE (
    sale_date  date,
    units_sold bigint,
    revenue    numeric,
    cost       numeric,
    profit     numeric,
    margin     numeric
  )
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  if p_days is null
     or p_days < 1
     or p_days > 365 then
    raise exception
      'p_days must be between 1 and 365'
      using errcode = 'P0001';
  end if;


  return query

  with date_series as (

    select
      generate_series(
        current_date -
          (p_days - 1),
        current_date,
        interval '1 day'
      )::date as day

  ),

  daily_sales as (

    select
      o.completed_at::date
        as day,

      sum(oi.quantity)::bigint
        as daily_units,

      sum(
        oi.quantity::numeric *
        oi.price
      )::numeric
        as daily_revenue,

      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot
      )::numeric
        as daily_cost

    from public.orders o

    join public.order_items oi
      on oi.order_id = o.id

    where o.organization_id =
            p_organization_id

      and o.status = 'completed'

      and o.completed_at >=
          (
            current_date -
            (p_days - 1)
          )

    group by
      o.completed_at::date
  )

  select
    ds.day,

    coalesce(
      d.daily_units,
      0
    )::bigint,

    coalesce(
      d.daily_revenue,
      0
    )::numeric,

    coalesce(
      d.daily_cost,
      0
    )::numeric,

    (
      coalesce(
        d.daily_revenue,
        0
      )
      -
      coalesce(
        d.daily_cost,
        0
      )
    )::numeric,

    case

      when coalesce(
        d.daily_revenue,
        0
      ) > 0

      then round(
        (
          (
            coalesce(
              d.daily_revenue,
              0
            )
            -
            coalesce(
              d.daily_cost,
              0
            )
          )
          /
          d.daily_revenue
        ) * 100,
        2
      )

      else 0::numeric

    end

  from date_series ds

  left join daily_sales d
    on d.day = ds.day

  order by ds.day;

end;
$function$;

CREATE OR REPLACE FUNCTION public.is_organization_member (
  target_organization_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.prepare_product_image()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_has_images boolean;
begin

  perform pg_advisory_xact_lock(
    hashtextextended(
      new.organization_id::text
      || ':'
      || new.product_id::text,
      0
    )
  );


  if tg_op = 'INSERT' then

    -- Assign next display position.
    if new.sort_order is null then

      select
        coalesce(max(pi.sort_order) + 1, 0)
      into new.sort_order
      from public.product_images pi
      where pi.organization_id = new.organization_id
        and pi.product_id = new.product_id;

    end if;


    select exists (
      select 1
      from public.product_images pi
      where pi.organization_id = new.organization_id
        and pi.product_id = new.product_id
    )
    into v_has_images;


    -- First image is always primary.
    if not v_has_images then

      new.is_primary := true;

    elsif new.is_primary then

      update public.product_images
      set is_primary = false
      where organization_id = new.organization_id
        and product_id = new.product_id
        and is_primary = true;

    end if;


  elsif tg_op = 'UPDATE' then

    if new.sort_order is null then
      new.sort_order := old.sort_order;
    end if;


    -- New primary replaces existing primary.
    if new.is_primary = true
       and old.is_primary = false then

      update public.product_images
      set is_primary = false
      where organization_id = new.organization_id
        and product_id = new.product_id
        and id <> new.id
        and is_primary = true;

    end if;

  end if;


  new.updated_at := now();

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.process_billing_checkout_payment_event (
  p_organization_id         uuid,
  p_provider                text,
  p_external_event_id       text,
  p_reference_id            text,
  p_provider_transaction_id text,
  p_payment_outcome         text,
  p_gross_amount            numeric,
  p_currency                text,
  p_verification_method     text,
  p_metadata                jsonb   DEFAULT '{}'::jsonb
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_event public.billing_events%rowtype;

  v_session
    public.billing_checkout_sessions%rowtype;

  v_provider text;
  v_external_event_id text;
  v_reference_id text;
  v_provider_transaction_id text;
  v_payment_outcome text;
  v_currency text;
  v_verification_method text;

  v_result text;

  v_checkout_metadata jsonb;
begin

  -- ==========================================================
  -- NORMALIZE / VALIDATE INPUT
  -- ==========================================================

  if p_organization_id is null then
    raise exception
      'organization id is required';
  end if;


  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );


  v_external_event_id :=
    btrim(
      coalesce(
        p_external_event_id,
        ''
      )
    );


  v_reference_id :=
    btrim(
      coalesce(
        p_reference_id,
        ''
      )
    );


  v_provider_transaction_id :=
    btrim(
      coalesce(
        p_provider_transaction_id,
        ''
      )
    );


  v_payment_outcome :=
    lower(
      btrim(
        coalesce(
          p_payment_outcome,
          ''
        )
      )
    );


  v_currency :=
    upper(
      btrim(
        coalesce(
          p_currency,
          ''
        )
      )
    );


  v_verification_method :=
    lower(
      btrim(
        coalesce(
          p_verification_method,
          ''
        )
      )
    );


  if length(v_provider) = 0 then
    raise exception
      'provider is required';
  end if;


  if length(v_external_event_id) = 0 then
    raise exception
      'external event id is required';
  end if;


  if length(v_reference_id) = 0 then
    raise exception
      'reference id is required';
  end if;


  if length(v_provider_transaction_id) = 0 then
    raise exception
      'provider transaction id is required';
  end if;


  if v_payment_outcome not in (
    'pending',
    'completed',
    'expired',
    'canceled',
    'denied',
    'unknown'
  ) then
    raise exception
      'unsupported payment outcome';
  end if;


  if p_gross_amount is null
     or p_gross_amount <= 0 then

    raise exception
      'gross amount must be positive';
  end if;


  if length(v_currency) = 0 then
    raise exception
      'currency is required';
  end if;


  if v_verification_method not in (
    'notification_signature',
    'provider_status_api'
  ) then
    raise exception
      'unsupported verification method';
  end if;


  if jsonb_typeof(
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  ) <> 'object' then

    raise exception
      'metadata must be a json object';
  end if;


  -- ==========================================================
  -- TERMINAL OUTCOMES REQUIRE PROVIDER STATUS API VERIFICATION
  -- ==========================================================

  if v_payment_outcome in (
    'completed',
    'expired',
    'canceled',
    'denied'
  )
  and v_verification_method <>
      'provider_status_api' then

    return
      'status_verification_required';
  end if;


  -- ==========================================================
  -- LOCK BILLING INBOX EVENT
  -- ==========================================================

  select e.*
  into v_event
  from public.billing_events e
  where e.organization_id =
        p_organization_id
    and e.provider =
        v_provider
    and e.external_event_id =
        v_external_event_id
  for update;


  if v_event.id is null then
    return
      'missing_event';
  end if;


  if v_event.status = 'processed' then
    return
      'already_processed';
  end if;


  if v_event.status <> 'received' then
    return
      'event_not_processable';
  end if;


  -- ==========================================================
  -- LOCK AUTHORITATIVE CHECKOUT
  -- ==========================================================

  select s.*
  into v_session
  from public.billing_checkout_sessions s
  where s.organization_id =
        p_organization_id
    and s.provider =
        v_provider
    and s.reference_id =
        v_reference_id
  for update;


  if v_session.id is null then
    return
      'missing_checkout';
  end if;


  -- ==========================================================
  -- AUTHORITATIVE AMOUNT / CURRENCY CHECK
  -- ==========================================================

  if v_session.amount <>
     p_gross_amount then

    return
      'amount_mismatch';
  end if;


  if v_session.currency <>
     v_currency then

    return
      'currency_mismatch';
  end if;


  -- ==========================================================
  -- PROVIDER TRANSACTION BINDING
  -- ==========================================================

  if nullif(
    btrim(
      coalesce(
        v_session.provider_transaction_id,
        ''
      )
    ),
    ''
  ) is not null
  and btrim(
    v_session.provider_transaction_id
  ) <>
      v_provider_transaction_id then

    return
      'transaction_mismatch';
  end if;


  if exists (
    select 1
    from public.billing_checkout_sessions other_session
    where other_session.provider =
          v_provider
      and other_session.provider_transaction_id =
          v_provider_transaction_id
      and other_session.id <>
          v_session.id
  ) then

    return
      'transaction_conflict';
  end if;


  v_checkout_metadata :=
    coalesce(
      v_session.metadata,
      '{}'::jsonb
    )
    ||
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
    ||
    jsonb_build_object(
      'last_payment_event_id',
        v_external_event_id,

      'last_payment_outcome',
        v_payment_outcome,

      'last_payment_verification_method',
        v_verification_method
    );


  -- ==========================================================
  -- COMPLETED IS NEVER REGRESSED
  -- ==========================================================

  if v_session.status = 'completed' then

    update public.billing_checkout_sessions
    set
      provider_transaction_id =
        coalesce(
          nullif(
            btrim(
              provider_transaction_id
            ),
            ''
          ),
          v_provider_transaction_id
        ),

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    if v_payment_outcome =
       'completed' then

      v_result :=
        'already_completed';

    else

      v_result :=
        'ignored_terminal';

    end if;


    update public.billing_events
    set
      status =
        'processed',

      processed_at =
        now()

    where id =
          v_event.id;


    return
      v_result;
  end if;


  -- ==========================================================
  -- OTHER TERMINAL STATES DO NOT REGRESS
  -- ==========================================================

  if v_session.status in (
    'expired',
    'canceled',
    'failed'
  ) then

    update public.billing_checkout_sessions
    set
      provider_transaction_id =
        coalesce(
          nullif(
            btrim(
              provider_transaction_id
            ),
            ''
          ),
          v_provider_transaction_id
        ),

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    if v_session.status = 'expired'
       and v_payment_outcome =
           'expired' then

      v_result :=
        'already_expired';

    elsif v_session.status = 'canceled'
       and v_payment_outcome =
           'canceled' then

      v_result :=
        'already_canceled';

    elsif v_session.status = 'failed'
       and v_payment_outcome =
           'denied'
       and v_session.failure_code =
           'PAYMENT_PROVIDER_DENIED' then

      v_result :=
        'already_denied';

    else

      v_result :=
        'ignored_terminal';

    end if;


    update public.billing_events
    set
      status =
        'processed',

      processed_at =
        now()

    where id =
          v_event.id;


    return
      v_result;
  end if;


  -- ==========================================================
  -- COMPLETED RACE PROTECTION
  --
  -- Checkout provider session should normally be attached and
  -- status=ready before completion is applied.
  --
  -- If a provider notification races ahead of the checkout route,
  -- keep the billing event as received. A later duplicate delivery
  -- can retry processing after attach reaches ready.
  -- ==========================================================

  if v_payment_outcome = 'completed'
     and v_session.status =
         'created' then

    return
      'checkout_not_ready';
  end if;


  -- ==========================================================
  -- PENDING
  --
  -- Notification signature does not bind transaction_id.
  --
  -- Signature-only pending events are auditable through
  -- billing_events, but MUST NOT bind provider_transaction_id
  -- or mutate checkout metadata/state.
  --
  -- Transaction identity may only be bound after an
  -- authoritative provider status API verification.
  -- ==========================================================

  if v_payment_outcome =
     'pending' then

    if v_verification_method =
       'provider_status_api' then

      update public.billing_checkout_sessions
      set
        provider_transaction_id =
          v_provider_transaction_id,

        metadata =
          v_checkout_metadata,

        updated_at =
          now()

      where id =
            v_session.id;


      v_result :=
        'pending';

    else

      v_result :=
        'pending_unverified';

    end if;

  end if;

  -- ==========================================================
  -- UNKNOWN
  --
  -- Preserve the provider event in billing_events, but do not
  -- mutate checkout identity from signature-only payload fields.
  --
  -- Only an authoritative provider status API response may bind
  -- provider_transaction_id or provider-derived metadata.
  -- ==========================================================

  if v_payment_outcome =
     'unknown' then

    if v_verification_method =
       'provider_status_api' then

      update public.billing_checkout_sessions
      set
        provider_transaction_id =
          v_provider_transaction_id,

        metadata =
          v_checkout_metadata,

        updated_at =
          now()

      where id =
            v_session.id;


      v_result :=
        'ignored_unknown';

    else

      v_result :=
        'ignored_unknown_unverified';

    end if;

  end if;

  -- ==========================================================
  -- COMPLETED
  -- ==========================================================

  if v_payment_outcome =
     'completed' then

    if v_session.status <>
       'ready' then

      return
        'checkout_not_completable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'completed',

      provider_transaction_id =
        v_provider_transaction_id,

      completed_at =
        coalesce(
          completed_at,
          now()
        ),

      failure_code =
        null,

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'completed';
  end if;


  -- ==========================================================
  -- EXPIRED
  -- ==========================================================

  if v_payment_outcome =
     'expired' then

    if v_session.status not in (
      'created',
      'ready'
    ) then

      return
        'checkout_not_expirable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'expired',

      provider_transaction_id =
        v_provider_transaction_id,

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'expired';
  end if;


  -- ==========================================================
  -- CANCELED
  -- ==========================================================

  if v_payment_outcome =
     'canceled' then

    if v_session.status not in (
      'created',
      'ready'
    ) then

      return
        'checkout_not_cancelable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'canceled',

      provider_transaction_id =
        v_provider_transaction_id,

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'canceled';
  end if;


  -- ==========================================================
  -- DENIED
  --
  -- Existing checkout schema has no separate "denied" state.
  -- Provider denial therefore maps to controlled status=failed.
  -- ==========================================================

  if v_payment_outcome =
     'denied' then

    if v_session.status not in (
      'created',
      'ready'
    ) then

      return
        'checkout_not_deniable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'failed',

      provider_transaction_id =
        v_provider_transaction_id,

      failure_code =
        'PAYMENT_PROVIDER_DENIED',

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'denied';
  end if;


  -- ==========================================================
  -- INTERNAL CONTRACT GUARD
  -- ==========================================================

  if v_result is null then
    raise exception
      'payment event processor reached no outcome';
  end if;


  -- ==========================================================
  -- EVENT IS PROCESSED ONLY AFTER ACCEPTED HANDLING
  -- ==========================================================

  update public.billing_events
  set
    status =
      'processed',

    processed_at =
      now()

  where id =
        v_event.id;


  return
    v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.process_billing_subscription_event (
  p_organization_id          uuid,
  p_provider                 text,
  p_external_event_id        text,
  p_plan_slug                text,
  p_provider_customer_id     text,
  p_provider_subscription_id text,
  p_subscription_status      text,
  p_current_period_start     timestamp with time zone,
  p_current_period_end       timestamp with time zone,
  p_trial_ends_at            timestamp with time zone,
  p_cancel_at_period_end     boolean,
  p_metadata                 jsonb
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_event public.billing_events%rowtype;
  v_plan public.billing_plans%rowtype;
begin
  if p_organization_id is null then
    raise exception 'organization id is required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_external_event_id, ''))) = 0 then
    raise exception 'external event id is required';
  end if;

  if length(btrim(coalesce(p_plan_slug, ''))) = 0 then
    raise exception 'plan slug is required';
  end if;

  if length(
    btrim(coalesce(p_provider_subscription_id, ''))
  ) = 0 then
    raise exception 'provider subscription id is required';
  end if;

  if length(
    btrim(coalesce(p_subscription_status, ''))
  ) = 0 then
    raise exception 'subscription status is required';
  end if;

  if p_plan_slug not in ('starter', 'pro') then
    raise exception 'unsupported commercial plan';
  end if;

  if p_subscription_status not in (
    'active',
    'canceled',
    'incomplete',
    'past_due',
    'trialing'
  ) then
    raise exception 'invalid subscription status';
  end if;

  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'metadata must be a json object';
  end if;

  select e.*
  into v_event
  from public.billing_events e
  where e.organization_id = p_organization_id
    and e.provider = lower(btrim(p_provider))
    and e.external_event_id = btrim(p_external_event_id)
  for update;

  if v_event.id is null then
    return 'missing_event';
  end if;

  if v_event.status = 'processed' then
    return 'already_processed';
  end if;

  if v_event.status <> 'received' then
    return 'event_not_processable';
  end if;

  select p.*
  into v_plan
  from public.billing_plans p
  where p.slug = btrim(p_plan_slug)
    and p.is_active
  limit 1;

  if v_plan.id is null then
    raise exception 'billing plan not found or inactive';
  end if;

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    provider,
    provider_customer_id,
    provider_subscription_id,
    status,
    current_period_start,
    current_period_end,
    trial_ends_at,
    cancel_at_period_end,
    metadata,
    updated_at
  )
  values (
    p_organization_id,
    v_plan.id,
    lower(btrim(p_provider)),
    nullif(btrim(coalesce(p_provider_customer_id, '')), ''),
    nullif(btrim(coalesce(p_provider_subscription_id, '')), ''),
    p_subscription_status,
    p_current_period_start,
    p_current_period_end,
    p_trial_ends_at,
    coalesce(p_cancel_at_period_end, false),
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (organization_id)
  do update set
    plan_id = excluded.plan_id,
    provider = excluded.provider,
    provider_customer_id = excluded.provider_customer_id,
    provider_subscription_id = excluded.provider_subscription_id,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    trial_ends_at = excluded.trial_ends_at,
    cancel_at_period_end = excluded.cancel_at_period_end,
    metadata =
      coalesce(public.organization_subscriptions.metadata, '{}'::jsonb)
      || excluded.metadata,
    updated_at = now();

  update public.billing_events
  set
    status = 'processed',
    processed_at = now()
  where id = v_event.id;

  return 'processed';
end;
$function$;

CREATE OR REPLACE FUNCTION public.propose_ai_controlled_product_description_action (
  p_organization_id      uuid,
  p_product_id           uuid,
  p_expected_description text,
  p_proposed_description text,
  p_idempotency_key      text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_key text;
  v_proposed_description text;

  v_current_description text;

  v_existing
    public.ai_controlled_actions%rowtype;

  v_action_id uuid;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if p_product_id is null then
    raise exception
      'product_id is required';
  end if;

  v_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if
    length(v_key) = 0
    or length(v_key) > 128
  then
    raise exception
      'invalid idempotency key';
  end if;

  v_proposed_description :=
    btrim(
      coalesce(
        p_proposed_description,
        ''
      )
    );

  if length(v_proposed_description) = 0 then
    raise exception
      'proposed description is required';
  end if;

  if
    coalesce(
      btrim(p_expected_description),
      ''
    ) =
    v_proposed_description
  then
    raise exception
      'proposed description does not change the current description';
  end if;

  select
    m.role::text
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    coalesce(v_role, '')
    not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin'
      using errcode = '42501';
  end if;

  -- ----------------------------------------------------------
  -- Idempotent replay is checked before current product state.
  -- A successfully persisted action remains replayable even
  -- after later product changes or execution.
  -- ----------------------------------------------------------

  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if found then
    if
      v_existing.requested_by
        is distinct from v_user_id
      or v_existing.action_type
        <> 'product.update_description'
      or v_existing.target_resource
        <> 'product'
      or v_existing.target_id
        is distinct from p_product_id
      or v_existing.expected_description
        is distinct from p_expected_description
      or v_existing.proposed_description
        <> v_proposed_description
    then
      raise exception
        'idempotency key conflict';
    end if;

    return jsonb_build_object(
      'action_id',
        v_existing.id,
      'status',
        v_existing.status,
      'created',
        false,
      'idempotent_replay',
        true
    );
  end if;

  -- ----------------------------------------------------------
  -- Current product must match the preview snapshot at the
  -- moment a new proposal is persisted.
  -- ----------------------------------------------------------

  select
    p.description
  into
    v_current_description
  from public.products p
  where
    p.id = p_product_id
    and p.organization_id =
      p_organization_id;

  if not found then
    raise exception
      'Product not found';
  end if;

  if
    v_current_description
      is distinct from
        p_expected_description
  then
    raise exception
      'Product description changed before proposal creation';
  end if;

  insert into public.ai_controlled_actions (
    contract_version,
    organization_id,
    requested_by,
    action_type,
    status,
    target_resource,
    target_id,
    expected_description,
    proposed_description,
    idempotency_key
  )
  values (
    1,
    p_organization_id,
    v_user_id,
    'product.update_description',
    'proposed',
    'product',
    p_product_id,
    p_expected_description,
    v_proposed_description,
    v_key
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning id
  into v_action_id;

  if v_action_id is not null then
    return jsonb_build_object(
      'action_id',
        v_action_id,
      'status',
        'proposed',
      'created',
        true,
      'idempotent_replay',
        false
    );
  end if;

  -- ----------------------------------------------------------
  -- Concurrent request won the unique-key race.
  -- Validate that it is the exact same logical request.
  -- ----------------------------------------------------------

  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if not found then
    raise exception
      'Unable to resolve idempotent controlled action';
  end if;

  if
    v_existing.requested_by
      is distinct from v_user_id
    or v_existing.action_type
      <> 'product.update_description'
    or v_existing.target_resource
      <> 'product'
    or v_existing.target_id
      is distinct from p_product_id
    or v_existing.expected_description
      is distinct from p_expected_description
    or v_existing.proposed_description
      <> v_proposed_description
  then
    raise exception
      'idempotency key conflict';
  end if;

  return jsonb_build_object(
    'action_id',
      v_existing.id,
    'status',
      v_existing.status,
    'created',
      false,
    'idempotent_replay',
      true
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.propose_ai_controlled_product_name_action (
  p_organization_id uuid,
  p_product_id      uuid,
  p_expected_name   text,
  p_proposed_name   text,
  p_idempotency_key text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_key text;
  v_proposed_name text;
  v_current_name text;

  v_existing
    public.ai_controlled_actions%rowtype;

  v_action_id uuid;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if p_product_id is null then
    raise exception
      'product_id is required';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  v_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if length(v_key) = 0 then
    raise exception
      'idempotency key is required';
  end if;

  v_proposed_name :=
    btrim(
      coalesce(
        p_proposed_name,
        ''
      )
    );

  if length(v_proposed_name) = 0 then
    raise exception
      'proposed product name is required';
  end if;

  -- ----------------------------------------------------------
  -- IDEMPOTENT REPLAY BEFORE CURRENT-TARGET VALIDATION
  -- ----------------------------------------------------------

  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if found then
    if
      v_existing.requested_by
        is distinct from
        v_user_id

      or v_existing.action_type
        <> 'product.update_name'

      or v_existing.target_resource
        <> 'product'

      or v_existing.target_id
        is distinct from
        p_product_id

      or v_existing.mutation_field
        <> 'name'

      or v_existing.expected_value
        is distinct from
        p_expected_name

      or v_existing.proposed_value
        is distinct from
        v_proposed_name
    then
      raise exception
        'idempotency key conflict';
    end if;

    return jsonb_build_object(
      'action_id',
      v_existing.id
    );
  end if;

  -- ----------------------------------------------------------
  -- AUTHORITATIVE CURRENT PRODUCT SNAPSHOT
  -- ----------------------------------------------------------

  select
    p.name
  into
    v_current_name
  from public.products p
  where
    p.id =
      p_product_id
    and p.organization_id =
      p_organization_id;

  if not found then
    raise exception
      'Product not found';
  end if;

  if
    v_current_name
      is distinct from
      p_expected_name
  then
    raise exception
      'Product name changed before proposal creation';
  end if;

  if
    v_current_name
      is not distinct from
      v_proposed_name
  then
    raise exception
      'proposed product name does not change the current name';
  end if;

  -- ----------------------------------------------------------
  -- CREATE PROPOSAL
  -- ----------------------------------------------------------

  insert into public.ai_controlled_actions (
    contract_version,
    organization_id,
    requested_by,

    action_type,
    status,

    target_resource,
    target_id,

    mutation_field,
    expected_value,
    proposed_value,

    idempotency_key
  )
  values (
    1,
    p_organization_id,
    v_user_id,

    'product.update_name',
    'proposed',

    'product',
    p_product_id,

    'name',
    p_expected_name,
    v_proposed_name,

    v_key
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning id
  into v_action_id;

  if v_action_id is not null then
    return jsonb_build_object(
      'action_id',
      v_action_id
    );
  end if;

  -- Concurrent request may have won the unique-key race.
  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if not found then
    raise exception
      'controlled action proposal could not be created';
  end if;

  if
    v_existing.requested_by
      is distinct from
      v_user_id

    or v_existing.action_type
      <> 'product.update_name'

    or v_existing.target_resource
      <> 'product'

    or v_existing.target_id
      is distinct from
      p_product_id

    or v_existing.mutation_field
      <> 'name'

    or v_existing.expected_value
      is distinct from
      p_expected_name

    or v_existing.proposed_value
      is distinct from
      v_proposed_name
  then
    raise exception
      'idempotency key conflict';
  end if;

  return jsonb_build_object(
    'action_id',
    v_existing.id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.propose_ai_controlled_product_price_action (
  p_organization_id uuid,
  p_product_id      uuid,
  p_expected_price  text,
  p_proposed_price  text,
  p_idempotency_key text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_key text;

  v_expected_price numeric(12,2);
  v_proposed_price numeric(12,2);
  v_current_price numeric(12,2);

  v_existing
    public.ai_controlled_actions%rowtype;

  v_action_id uuid;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if p_product_id is null then
    raise exception
      'product_id is required';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  v_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if length(v_key) = 0 then
    raise exception
      'idempotency key is required';
  end if;

  if
    p_expected_price is null
    or p_expected_price !~
      '^(0|[1-9][0-9]{0,9})\.[0-9]{2}$'
  then
    raise exception
      'expected product price must be canonical numeric(12,2) text';
  end if;

  if
    p_proposed_price is null
    or p_proposed_price !~
      '^(0|[1-9][0-9]{0,9})\.[0-9]{2}$'
  then
    raise exception
      'proposed product price must be canonical numeric(12,2) text';
  end if;

  v_expected_price :=
    p_expected_price::numeric(12,2);

  v_proposed_price :=
    p_proposed_price::numeric(12,2);

  if
    v_expected_price < 0
    or v_proposed_price < 0
  then
    raise exception
      'product price must be non-negative';
  end if;

  if
    v_expected_price
      is not distinct from
      v_proposed_price
  then
    raise exception
      'proposed product price does not change the current price';
  end if;

  -- ----------------------------------------------------------
  -- IDEMPOTENT REPLAY BEFORE CURRENT-TARGET VALIDATION
  -- ----------------------------------------------------------

  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if found then
    if
      v_existing.requested_by
        is distinct from
        v_user_id

      or v_existing.action_type
        <> 'product.update_price'

      or v_existing.target_resource
        <> 'product'

      or v_existing.target_id
        is distinct from
        p_product_id

      or v_existing.mutation_field
        <> 'price'

      or v_existing.expected_value
        is distinct from
        p_expected_price

      or v_existing.proposed_value
        is distinct from
        p_proposed_price
    then
      raise exception
        'idempotency key conflict';
    end if;

    return jsonb_build_object(
      'action_id',
      v_existing.id
    );
  end if;

  -- ----------------------------------------------------------
  -- AUTHORITATIVE CURRENT PRODUCT SNAPSHOT
  -- ----------------------------------------------------------

  select
    p.price
  into
    v_current_price
  from public.products p
  where
    p.id =
      p_product_id
    and p.organization_id =
      p_organization_id;

  if not found then
    raise exception
      'Product not found';
  end if;

  if
    v_current_price
      is distinct from
      v_expected_price
  then
    raise exception
      'Product price changed before proposal creation';
  end if;

  if
    v_current_price
      is not distinct from
      v_proposed_price
  then
    raise exception
      'proposed product price does not change the current price';
  end if;

  -- ----------------------------------------------------------
  -- CREATE PROPOSAL
  -- ----------------------------------------------------------

  insert into public.ai_controlled_actions (
    contract_version,
    organization_id,
    requested_by,

    action_type,
    status,

    target_resource,
    target_id,

    mutation_field,
    expected_value,
    proposed_value,

    idempotency_key
  )
  values (
    1,
    p_organization_id,
    v_user_id,

    'product.update_price',
    'proposed',

    'product',
    p_product_id,

    'price',
    p_expected_price,
    p_proposed_price,

    v_key
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning id
  into v_action_id;

  if v_action_id is not null then
    return jsonb_build_object(
      'action_id',
      v_action_id
    );
  end if;

  -- Concurrent request may have won the unique-key race.
  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if not found then
    raise exception
      'controlled action proposal could not be created';
  end if;

  if
    v_existing.requested_by
      is distinct from
      v_user_id

    or v_existing.action_type
      <> 'product.update_price'

    or v_existing.target_resource
      <> 'product'

    or v_existing.target_id
      is distinct from
      p_product_id

    or v_existing.mutation_field
      <> 'price'

    or v_existing.expected_value
      is distinct from
      p_expected_price

    or v_existing.proposed_value
      is distinct from
      p_proposed_price
  then
    raise exception
      'idempotency key conflict';
  end if;

  return jsonb_build_object(
    'action_id',
    v_existing.id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.propose_ai_controlled_product_status_action (
  p_organization_id uuid,
  p_product_id      uuid,
  p_expected_status text,
  p_proposed_status text,
  p_idempotency_key text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_user_id uuid;
  v_role text;

  v_key text;
  v_current_status text;

  v_existing
    public.ai_controlled_actions%rowtype;

  v_action_id uuid;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if p_product_id is null then
    raise exception
      'product_id is required';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  v_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if length(v_key) = 0 then
    raise exception
      'idempotency key is required';
  end if;

  if
    p_expected_status is null
    or p_expected_status not in (
      'active',
      'inactive'
    )
  then
    raise exception
      'expected product status is invalid';
  end if;

  if
    p_proposed_status is null
    or p_proposed_status not in (
      'active',
      'inactive'
    )
  then
    raise exception
      'proposed product status is invalid';
  end if;

  if
    p_expected_status
      is not distinct from
      p_proposed_status
  then
    raise exception
      'proposed product status does not change the current status';
  end if;

  -- ----------------------------------------------------------
  -- IDEMPOTENT REPLAY BEFORE CURRENT-TARGET VALIDATION
  -- ----------------------------------------------------------

  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if found then
    if
      v_existing.requested_by
        is distinct from
        v_user_id

      or v_existing.action_type
        <> 'product.update_status'

      or v_existing.target_resource
        <> 'product'

      or v_existing.target_id
        is distinct from
        p_product_id

      or v_existing.mutation_field
        <> 'status'

      or v_existing.expected_value
        is distinct from
        p_expected_status

      or v_existing.proposed_value
        is distinct from
        p_proposed_status
    then
      raise exception
        'idempotency key conflict';
    end if;

    return jsonb_build_object(
      'action_id',
      v_existing.id
    );
  end if;

  -- ----------------------------------------------------------
  -- AUTHORITATIVE CURRENT PRODUCT SNAPSHOT
  -- ----------------------------------------------------------

  select
    p.status
  into
    v_current_status
  from public.products p
  where
    p.id =
      p_product_id
    and p.organization_id =
      p_organization_id;

  if not found then
    raise exception
      'Product not found';
  end if;

  if
    v_current_status
      is distinct from
      p_expected_status
  then
    raise exception
      'Product status changed before proposal creation';
  end if;

  if
    v_current_status
      is not distinct from
      p_proposed_status
  then
    raise exception
      'proposed product status does not change the current status';
  end if;

  -- ----------------------------------------------------------
  -- CREATE PROPOSAL
  -- ==========================================================

  insert into public.ai_controlled_actions (
    contract_version,
    organization_id,
    requested_by,

    action_type,
    status,

    target_resource,
    target_id,

    mutation_field,
    expected_value,
    proposed_value,

    idempotency_key
  )
  values (
    1,
    p_organization_id,
    v_user_id,

    'product.update_status',
    'proposed',

    'product',
    p_product_id,

    'status',
    p_expected_status,
    p_proposed_status,

    v_key
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning id
  into v_action_id;

  if v_action_id is not null then
    return jsonb_build_object(
      'action_id',
      v_action_id
    );
  end if;

  -- Concurrent request may have won the unique-key race.
  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if not found then
    raise exception
      'controlled action proposal could not be created';
  end if;

  if
    v_existing.requested_by
      is distinct from
      v_user_id

    or v_existing.action_type
      <> 'product.update_status'

    or v_existing.target_resource
      <> 'product'

    or v_existing.target_id
      is distinct from
      p_product_id

    or v_existing.mutation_field
      <> 'status'

    or v_existing.expected_value
      is distinct from
      p_expected_status

    or v_existing.proposed_value
      is distinct from
      p_proposed_status
  then
    raise exception
      'idempotency key conflict';
  end if;

  return jsonb_build_object(
    'action_id',
    v_existing.id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.propose_ai_controlled_publication (
  p_organization_id    uuid,
  p_authorized_shop_id uuid,
  p_proposed_content   text,
  p_idempotency_key    text
)
  RETURNS SETOF public.ai_controlled_publications
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_user_id uuid;
  v_role text;

  v_shop
    public.marketplace_authorized_shops%rowtype;

  v_content text;
  v_idempotency_key text;

  v_existing
    public.ai_controlled_publications%rowtype;

  v_inserted
    public.ai_controlled_publications%rowtype;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'Organization is required';
  end if;

  if p_authorized_shop_id is null then
    raise exception
      'Authorized shop is required';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'Controlled publication requires owner or admin';
  end if;

  v_content :=
    btrim(
      replace(
        replace(
          coalesce(
            p_proposed_content,
            ''
          ),
          E'\r\n',
          E'\n'
        ),
        E'\r',
        E'\n'
      )
    );

  if length(
    v_content
  ) = 0 then
    raise exception
      'Publication content is required';
  end if;

  if length(
    v_content
  ) > 5000 then
    raise exception
      'Publication content is too long';
  end if;

  v_idempotency_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if length(
    v_idempotency_key
  ) < 8
  or length(
    v_idempotency_key
  ) > 128
  or v_idempotency_key !~
    '^[A-Za-z0-9._:-]+$' then
    raise exception
      'Invalid controlled publication idempotency key';
  end if;

  select
    s.*
  into
    v_shop
  from
    public.marketplace_authorized_shops s
  where
    s.id =
      p_authorized_shop_id
    and s.organization_id =
      p_organization_id
    and s.status =
      'active'
    and s.is_selected
  limit 1;

  if not found then
    raise exception
      'Authorized selected shop not found';
  end if;

  if length(
    btrim(
      coalesce(
        v_shop.provider,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_shop.external_shop_id,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_shop.name,
        ''
      )
    )
  ) = 0 then
    raise exception
      'Authorized shop identity is incomplete';
  end if;

  select
    p.*
  into
    v_existing
  from
    public.ai_controlled_publications p
  where
    p.organization_id =
      p_organization_id
    and p.idempotency_key =
      v_idempotency_key
  limit 1;

  if found then
    if
      v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'marketplace_authorized_shop'
      or v_existing.target_id <>
        p_authorized_shop_id
      or v_existing.mutation_field <>
        'content'
      or v_existing.expected_value
        is not null
      or v_existing.proposed_value <>
        v_content
    then
      raise exception
        'Controlled publication idempotency key conflict';
    end if;

    return next
      v_existing;

    return;
  end if;

  insert into
    public.ai_controlled_publications (
      organization_id,
      contract_version,
      action_type,
      target_resource,
      target_id,
      mutation_field,
      expected_value,
      proposed_value,
      provider,
      external_shop_id,
      destination_name,
      requested_by_user_id,
      idempotency_key,
      status
    )
  values (
    p_organization_id,
    1,
    'content.publish_text',
    'marketplace_authorized_shop',
    p_authorized_shop_id,
    'content',
    null,
    v_content,
    lower(
      btrim(
        v_shop.provider
      )
    ),
    btrim(
      v_shop.external_shop_id
    ),
    btrim(
      v_shop.name
    ),
    v_user_id,
    v_idempotency_key,
    'proposed'
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning *
  into
    v_inserted;

  if not found then
    select
      p.*
    into
      v_existing
    from
      public.ai_controlled_publications p
    where
      p.organization_id =
        p_organization_id
      and p.idempotency_key =
        v_idempotency_key
    limit 1;

    if not found then
      raise exception
        'Controlled publication idempotency resolution failed';
    end if;

    if
      v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'marketplace_authorized_shop'
      or v_existing.target_id <>
        p_authorized_shop_id
      or v_existing.mutation_field <>
        'content'
      or v_existing.expected_value
        is not null
      or v_existing.proposed_value <>
        v_content
    then
      raise exception
        'Controlled publication idempotency key conflict';
    end if;

    return next
      v_existing;

    return;
  end if;

  return next
    v_inserted;

  return;
end;

$function$;

CREATE OR REPLACE FUNCTION public.propose_ai_controlled_publication_channel (
  p_organization_id           uuid,
  p_publishing_destination_id uuid,
  p_proposed_content          text,
  p_idempotency_key           text
)
  RETURNS SETOF public.ai_controlled_publications
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_user_id uuid;
  v_role text;

  v_destination
    public.publishing_channel_destinations%rowtype;

  v_content text;
  v_idempotency_key text;

  v_existing
    public.ai_controlled_publications%rowtype;

  v_inserted
    public.ai_controlled_publications%rowtype;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'Organization is required';
  end if;

  if p_publishing_destination_id is null then
    raise exception
      'Publishing destination is required';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'Controlled publication requires owner or admin';
  end if;

  v_content :=
    btrim(
      replace(
        replace(
          coalesce(
            p_proposed_content,
            ''
          ),
          E'\r\n',
          E'\n'
        ),
        E'\r',
        E'\n'
      )
    );

  if length(
    v_content
  ) = 0 then
    raise exception
      'Publication content is required';
  end if;

  if length(
    v_content
  ) > 5000 then
    raise exception
      'Publication content is too long';
  end if;

  v_idempotency_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if length(
    v_idempotency_key
  ) < 8
  or length(
    v_idempotency_key
  ) > 128
  or v_idempotency_key !~
    '^[A-Za-z0-9._:-]+$'
  then
    raise exception
      'Invalid controlled publication idempotency key';
  end if;

  select
    d.*
  into
    v_destination
  from
    public.publishing_channel_destinations d
  where
    d.id =
      p_publishing_destination_id
    and d.organization_id =
      p_organization_id
    and d.status =
      'active'
    and d.is_selected
    and 'publish_text' =
      any(
        d.capabilities
      )
  limit 1;

  if not found then
    raise exception
      'Compatible selected publishing destination not found';
  end if;

  if length(
    btrim(
      coalesce(
        v_destination.provider,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_destination.external_destination_id,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_destination.display_name,
        ''
      )
    )
  ) = 0
  then
    raise exception
      'Publishing destination identity is incomplete';
  end if;

  select
    p.*
  into
    v_existing
  from
    public.ai_controlled_publications p
  where
    p.organization_id =
      p_organization_id
    and p.idempotency_key =
      v_idempotency_key
  limit 1;

  if found then
    if
      v_existing.contract_version <>
        2
      or v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'publishing_channel_destination'
      or v_existing.target_id <>
        p_publishing_destination_id
      or v_existing.mutation_field <>
        'content'
      or v_existing.expected_value
        is not null
      or v_existing.proposed_value <>
        v_content
    then
      raise exception
        'Controlled publication idempotency key conflict';
    end if;

    return next
      v_existing;

    return;
  end if;

  insert into
    public.ai_controlled_publications (
      organization_id,
      contract_version,
      action_type,
      target_resource,
      target_id,
      mutation_field,
      expected_value,
      proposed_value,
      provider,
      external_shop_id,
      destination_name,
      destination_type,
      requested_by_user_id,
      idempotency_key,
      status
    )
  values (
    p_organization_id,
    2,
    'content.publish_text',
    'publishing_channel_destination',
    p_publishing_destination_id,
    'content',
    null,
    v_content,
    lower(
      btrim(
        v_destination.provider
      )
    ),
    btrim(
      v_destination.external_destination_id
    ),
    btrim(
      v_destination.display_name
    ),
    v_destination.destination_type,
    v_user_id,
    v_idempotency_key,
    'proposed'
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning *
  into
    v_inserted;

  if not found then
    select
      p.*
    into
      v_existing
    from
      public.ai_controlled_publications p
    where
      p.organization_id =
        p_organization_id
      and p.idempotency_key =
        v_idempotency_key
    limit 1;

    if not found then
      raise exception
        'Controlled publication idempotency resolution failed';
    end if;

    if
      v_existing.contract_version <>
        2
      or v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'publishing_channel_destination'
      or v_existing.target_id <>
        p_publishing_destination_id
      or v_existing.mutation_field <>
        'content'
      or v_existing.expected_value
        is not null
      or v_existing.proposed_value <>
        v_content
    then
      raise exception
        'Controlled publication idempotency key conflict';
    end if;

    return next
      v_existing;

    return;
  end if;

  return next
    v_inserted;

  return;
end;

$function$;

CREATE OR REPLACE FUNCTION public.provision_publishing_channel_destination (
  p_organization_id         uuid,
  p_provider                text,
  p_destination_type        text,
  p_external_destination_id text,
  p_display_name            text,
  p_capabilities            text[]
)
  RETURNS SETOF public.publishing_channel_destinations
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_provider text;
  v_external_destination_id text;
  v_display_name text;
  v_destination
    public.publishing_channel_destinations%rowtype;

begin
  if coalesce(
    auth.role(),
    ''
  ) <> 'service_role'
  then
    raise exception
      'service role required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  if
    length(v_provider) = 0
    or length(v_provider) > 100
    or v_provider !~
      '^[a-z0-9][a-z0-9._-]{0,99}$'
  then
    raise exception
      'invalid publishing provider';
  end if;

  if coalesce(
    p_destination_type,
    ''
  ) not in (
    'account',
    'page',
    'channel'
  ) then
    raise exception
      'invalid publishing destination type';
  end if;

  v_external_destination_id :=
    btrim(
      coalesce(
        p_external_destination_id,
        ''
      )
    );

  if
    length(v_external_destination_id) = 0
    or length(v_external_destination_id) > 255
  then
    raise exception
      'invalid external publishing destination id';
  end if;

  v_display_name :=
    btrim(
      coalesce(
        p_display_name,
        ''
      )
    );

  if
    length(v_display_name) = 0
    or length(v_display_name) > 200
  then
    raise exception
      'invalid publishing destination name';
  end if;

  if
    p_capabilities is null
    or cardinality(p_capabilities) > 3
    or not (
      p_capabilities <@
        array[
          'publish_text',
          'publish_image',
          'publish_video'
        ]::text[]
    )
    or cardinality(p_capabilities) <>
      (
        case
          when 'publish_text' =
            any(p_capabilities)
          then 1
          else 0
        end
        +
        case
          when 'publish_image' =
            any(p_capabilities)
          then 1
          else 0
        end
        +
        case
          when 'publish_video' =
            any(p_capabilities)
          then 1
          else 0
        end
      )
  then
    raise exception
      'invalid publishing destination capabilities';
  end if;

  insert into
    public.publishing_channel_destinations (
      organization_id,
      provider,
      destination_type,
      external_destination_id,
      display_name,
      status,
      capabilities,
      is_selected
    )
  values (
    p_organization_id,
    v_provider,
    p_destination_type,
    v_external_destination_id,
    v_display_name,
    'active',
    p_capabilities,
    false
  )
  on conflict (
    organization_id,
    provider,
    external_destination_id
  )
  do update
  set
    destination_type =
      excluded.destination_type,
    display_name =
      excluded.display_name,
    status =
      'active',
    capabilities =
      excluded.capabilities,
    updated_at =
      now()
  returning *
  into
    v_destination;

  return next
    v_destination;

  return;
end;

$function$;

CREATE OR REPLACE FUNCTION public.record_ai_usage (
  p_organization_id     uuid,
  p_user_id             uuid,
  p_feature             text,
  p_provider            text,
  p_model               text,
  p_source_kind         text   DEFAULT NULL::text,
  p_source_id           uuid   DEFAULT NULL::uuid,
  p_provider_request_id text   DEFAULT NULL::text,
  p_request_status      text   DEFAULT 'completed'::text,
  p_input_tokens        bigint DEFAULT 0,
  p_cached_input_tokens bigint DEFAULT 0,
  p_cache_write_tokens  bigint DEFAULT 0,
  p_output_tokens       bigint DEFAULT 0,
  p_total_tokens        bigint DEFAULT 0,
  p_credits_charged     bigint DEFAULT 0,
  p_metadata            jsonb  DEFAULT '{}'::jsonb
)
  RETURNS TABLE (
    usage_id           uuid,
    estimated_cost_usd numeric,
    pricing_found      boolean
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_pricing public.ai_model_pricing%rowtype;
  v_uncached_input bigint := 0;
  v_cached_input bigint := 0;
  v_cache_write bigint := 0;
  v_output bigint := 0;
  v_cost numeric(20,10) := 0;
  v_usage_id uuid;
  v_existing_cost numeric(20,10);
  v_pricing_found boolean := false;
  v_pricing_snapshot jsonb := '{}'::jsonb;
begin
  if p_organization_id is null then
    raise exception 'organization_id is required';
  end if;

  if length(btrim(coalesce(p_feature, ''))) = 0 then
    raise exception 'feature is required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_model, ''))) = 0 then
    raise exception 'model is required';
  end if;

  if p_request_status not in ('completed', 'failed') then
    raise exception 'invalid request status';
  end if;

  if least(
    p_input_tokens,
    p_cached_input_tokens,
    p_cache_write_tokens,
    p_output_tokens,
    p_total_tokens,
    p_credits_charged
  ) < 0 then
    raise exception 'token and credit quantities must be nonnegative';
  end if;

  -- Idempotency for a provider request that was already recorded.
  if p_provider_request_id is not null then
    select u.id, u.estimated_cost_usd
    into v_usage_id, v_existing_cost
    from public.ai_usage_ledger u
    where u.provider = lower(btrim(p_provider))
      and u.provider_request_id = p_provider_request_id
    limit 1;

    if found then
      return query
      select
        v_usage_id,
        v_existing_cost,
        true;
      return;
    end if;
  end if;

  select p.*
  into v_pricing
  from public.ai_model_pricing p
  where p.provider = lower(btrim(p_provider))
    and (
      lower(p.model) = lower(btrim(p_model))
      or lower(btrim(p_model)) like lower(p.model) || '-%'
    )
    and p.effective_from <= now()
    and (p.effective_to is null or p.effective_to > now())
  order by
    (lower(p.model) = lower(btrim(p_model))) desc,
    length(p.model) desc,
    p.effective_from desc
  limit 1;

  if found then
    v_pricing_found := true;

    v_cached_input :=
      least(p_cached_input_tokens, p_input_tokens);

    v_cache_write :=
      least(
        p_cache_write_tokens,
        greatest(p_input_tokens - v_cached_input, 0)
      );

    v_uncached_input :=
      greatest(
        p_input_tokens - v_cached_input - v_cache_write,
        0
      );

    v_output := p_output_tokens;

    v_cost :=
      (
        (v_uncached_input * v_pricing.input_usd_per_million)
        + (v_cached_input * v_pricing.cached_input_usd_per_million)
        + (v_cache_write * v_pricing.cache_write_usd_per_million)
        + (v_output * v_pricing.output_usd_per_million)
      ) / 1000000.0;

    v_pricing_snapshot :=
      jsonb_build_object(
        'pricing_id', v_pricing.id,
        'provider', v_pricing.provider,
        'model', v_pricing.model,
        'input_usd_per_million', v_pricing.input_usd_per_million,
        'cached_input_usd_per_million', v_pricing.cached_input_usd_per_million,
        'cache_write_usd_per_million', v_pricing.cache_write_usd_per_million,
        'output_usd_per_million', v_pricing.output_usd_per_million,
        'effective_from', v_pricing.effective_from
      );
  else
    v_pricing_snapshot :=
      jsonb_build_object(
        'pricing_status', 'unpriced',
        'provider', lower(btrim(p_provider)),
        'model', btrim(p_model)
      );
  end if;

  insert into public.ai_usage_ledger (
    organization_id,
    user_id,
    feature,
    provider,
    model,
    source_kind,
    source_id,
    provider_request_id,
    request_status,
    input_tokens,
    cached_input_tokens,
    cache_write_tokens,
    output_tokens,
    total_tokens,
    estimated_cost_usd,
    credits_charged,
    pricing_snapshot,
    metadata
  )
  values (
    p_organization_id,
    p_user_id,
    btrim(p_feature),
    lower(btrim(p_provider)),
    btrim(p_model),
    nullif(btrim(coalesce(p_source_kind, '')), ''),
    p_source_id,
    nullif(btrim(coalesce(p_provider_request_id, '')), ''),
    p_request_status,
    p_input_tokens,
    p_cached_input_tokens,
    p_cache_write_tokens,
    p_output_tokens,
    p_total_tokens,
    v_cost,
    p_credits_charged,
    v_pricing_snapshot,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_usage_id;

  if p_credits_charged > 0 then
    insert into public.ai_credit_ledger (
      organization_id,
      usage_id,
      transaction_type,
      amount,
      metadata
    )
    values (
      p_organization_id,
      v_usage_id,
      'usage',
      -p_credits_charged,
      jsonb_build_object(
        'feature', btrim(p_feature),
        'provider', lower(btrim(p_provider)),
        'model', btrim(p_model)
      )
    );
  end if;

  return query
  select
    v_usage_id,
    v_cost,
    v_pricing_found;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_billing_webhook_event (
  p_organization_id   uuid,
  p_provider          text,
  p_external_event_id text,
  p_event_type        text,
  p_payload           jsonb
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  if p_organization_id is null then
    raise exception 'organization id is required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_external_event_id, ''))) = 0 then
    raise exception 'external event id is required';
  end if;

  if length(btrim(coalesce(p_event_type, ''))) = 0 then
    raise exception 'event type is required';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'payload must be a json object';
  end if;

  insert into public.billing_events (
    organization_id,
    provider,
    external_event_id,
    event_type,
    status,
    payload
  )
  values (
    p_organization_id,
    lower(btrim(p_provider)),
    btrim(p_external_event_id),
    btrim(p_event_type),
    'received',
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (provider, external_event_id)
  where external_event_id is not null
  do nothing;

  if not found then
    return 'duplicate';
  end if;

  return 'recorded';
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_inventory_stock_movement()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_stock_before integer;
  v_stock_after integer;
  v_delta integer;

  v_target_type text;
  v_product_id uuid;
  v_variant_id uuid;

  v_movement_type text;
  v_reference_type text;
  v_reference_id uuid;
  v_reference_id_text text;
  v_note text;
begin
  if tg_op = 'INSERT' then
    if new.stock = 0 then
      return new;
    end if;

    v_stock_before := 0;
    v_stock_after := new.stock;
    v_delta := new.stock;

    v_movement_type := nullif(
      current_setting('app.inventory_movement_type', true),
      ''
    );

    if v_movement_type is null then
      v_movement_type := 'opening';
    end if;

  elsif tg_op = 'UPDATE' then
    if new.stock is not distinct from old.stock then
      return new;
    end if;

    v_stock_before := old.stock;
    v_stock_after := new.stock;
    v_delta := new.stock - old.stock;

    v_movement_type := nullif(
      current_setting('app.inventory_movement_type', true),
      ''
    );

    if v_movement_type is null then
      v_movement_type := 'adjustment';
    end if;

  else
    return new;
  end if;

  if v_movement_type not in (
    'opening',
    'adjustment',
    'order_deduction',
    'order_restore'
  ) then
    v_movement_type := 'adjustment';
  end if;

  if tg_table_name = 'products' then
    v_target_type := 'product';
    v_product_id := new.id;
    v_variant_id := null;

  elsif tg_table_name = 'product_variants' then
    v_target_type := 'variant';
    v_product_id := null;
    v_variant_id := new.id;

  else
    raise exception
      'Unexpected inventory stock table: %',
      tg_table_name;
  end if;

  v_reference_type := nullif(
    current_setting('app.inventory_reference_type', true),
    ''
  );

  v_reference_id_text := nullif(
    current_setting('app.inventory_reference_id', true),
    ''
  );

  if v_reference_id_text is not null then
    v_reference_id := v_reference_id_text::uuid;
  else
    v_reference_id := null;
  end if;

  v_note := nullif(
    current_setting('app.inventory_note', true),
    ''
  );

  insert into public.inventory_movements (
    organization_id,
    target_type,
    product_id,
    variant_id,
    movement_type,
    quantity_delta,
    stock_before,
    stock_after,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    new.organization_id,
    v_target_type,
    v_product_id,
    v_variant_id,
    v_movement_type,
    v_delta,
    v_stock_before,
    v_stock_after,
    v_reference_type,
    v_reference_id,
    v_note,
    auth.uid()
  );

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_marketplace_webhook_event (
  p_provider             text,
  p_external_shop_id     text,
  p_dedupe_key           text,
  p_notification_id      text,
  p_notification_type    integer,
  p_external_entity_id   text,
  p_external_status      text,
  p_external_update_time timestamp with time zone,
  p_payload_sha256       text,
  p_metadata             jsonb
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_shop public.marketplace_authorized_shops%rowtype;
begin
  if length(btrim(coalesce(p_provider, ''))) = 0
     or length(btrim(coalesce(p_external_shop_id, ''))) = 0
     or length(btrim(coalesce(p_dedupe_key, ''))) = 0 then
    raise exception 'provider, external shop id, and dedupe key are required';
  end if;

  if coalesce(p_payload_sha256, '') !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid payload sha256';
  end if;

  select s.*
  into v_shop
  from public.marketplace_authorized_shops s
  where s.provider = lower(btrim(p_provider))
    and s.external_shop_id = btrim(p_external_shop_id)
    and s.status = 'active'
  order by
    s.is_selected desc,
    s.updated_at desc
  limit 1;

  if v_shop.id is null then
    return 'unmatched_shop';
  end if;

  insert into public.marketplace_webhook_events (
    organization_id,
    marketplace_account_id,
    authorized_shop_id,
    provider,
    dedupe_key,
    notification_id,
    notification_type,
    external_shop_id,
    external_entity_id,
    external_status,
    external_update_time,
    payload_sha256,
    processing_status,
    metadata
  )
  values (
    v_shop.organization_id,
    v_shop.marketplace_account_id,
    v_shop.id,
    lower(btrim(p_provider)),
    btrim(p_dedupe_key),
    nullif(btrim(coalesce(p_notification_id, '')), ''),
    p_notification_type,
    btrim(p_external_shop_id),
    nullif(btrim(coalesce(p_external_entity_id, '')), ''),
    nullif(btrim(coalesce(p_external_status, '')), ''),
    p_external_update_time,
    lower(p_payload_sha256),
    'received',
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (provider, dedupe_key)
  do nothing;

  if not found then
    return 'duplicate';
  end if;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    external_id,
    message,
    metadata
  )
  values (
    v_shop.organization_id,
    v_shop.marketplace_account_id,
    'inbound',
    case
      when p_external_entity_id is not null then 'order'
      else 'account'
    end,
    'webhook_received',
    'success',
    nullif(btrim(coalesce(p_external_entity_id, '')), ''),
    'Authenticated marketplace webhook received.',
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'notification_id',
        nullif(btrim(coalesce(p_notification_id, '')), ''),
      'notification_type', p_notification_type,
      'dedupe_key', btrim(p_dedupe_key)
    )
  );

  return 'recorded';
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_price_observation (
  p_target_id      uuid,
  p_observed_price numeric,
  p_notes          text                     DEFAULT NULL::text,
  p_observed_at    timestamp with time zone DEFAULT now(),
  p_metadata       jsonb                    DEFAULT '{}'::jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;

  v_product uuid;
  v_variant uuid;

  v_source_name text;
  v_source_url text;

  v_threshold numeric;
  v_basis text;
  v_direction text;

  v_active boolean;

  v_internal numeric;
  v_previous numeric;

  v_change_amount numeric;
  v_change_percent numeric;

  v_internal_difference numeric;
  v_internal_difference_percent numeric;

  v_comparison_percent numeric;

  v_triggered boolean := false;

  v_observation uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_observed_price is null
     or p_observed_price < 0 then
    raise exception
      'Observed price must be zero or greater';
  end if;

  if p_metadata is null
     or jsonb_typeof(p_metadata) <> 'object' then
    raise exception
      'Metadata must be a JSON object';
  end if;

  select
    organization_id,
    product_id,
    variant_id,
    source_name,
    source_url,
    threshold_percent,
    comparison_basis,
    direction,
    is_active
  into
    v_org,
    v_product,
    v_variant,
    v_source_name,
    v_source_url,
    v_threshold,
    v_basis,
    v_direction,
    v_active
  from public.price_monitor_targets
  where id = p_target_id;

  if not found then
    raise exception 'Price monitor target not found';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'Organization access denied';
  end if;

  if not v_active then
    raise exception 'Price monitor target is inactive';
  end if;


  -- Current internal commerce price.
  if v_product is not null then
    select price::numeric
    into v_internal
    from public.products
    where id = v_product
      and organization_id = v_org;

  elsif v_variant is not null then
    select price::numeric
    into v_internal
    from public.product_variants
    where id = v_variant
      and organization_id = v_org;
  end if;


  -- Previous monitored price.
  select observed_price
  into v_previous
  from public.price_observations
  where target_id = p_target_id
    and organization_id = v_org
  order by
    observed_at desc,
    created_at desc
  limit 1;


  if v_previous is not null then
    v_change_amount :=
      p_observed_price - v_previous;

    if v_previous <> 0 then
      v_change_percent :=
        (
          (p_observed_price - v_previous)
          / v_previous
        ) * 100;
    end if;
  end if;


  if v_internal is not null then
    v_internal_difference :=
      p_observed_price - v_internal;

    if v_internal <> 0 then
      v_internal_difference_percent :=
        (
          (p_observed_price - v_internal)
          / v_internal
        ) * 100;
    end if;
  end if;


  if v_basis = 'previous' then
    v_comparison_percent :=
      v_change_percent;
  else
    v_comparison_percent :=
      v_internal_difference_percent;
  end if;


  if v_comparison_percent is not null then
    if v_direction = 'any' then
      v_triggered :=
        abs(v_comparison_percent) >= v_threshold;

    elsif v_direction = 'increase' then
      v_triggered :=
        v_comparison_percent >= v_threshold;

    elsif v_direction = 'decrease' then
      v_triggered :=
        v_comparison_percent <= -v_threshold;
    end if;
  end if;


  insert into public.price_observations (
    id,
    organization_id,
    target_id,

    observed_price,

    internal_price_snapshot,
    previous_price,

    change_amount,
    change_percent,

    difference_from_internal,
    difference_from_internal_percent,

    threshold_percent_snapshot,
    comparison_basis_snapshot,
    direction_snapshot,

    threshold_triggered,

    source_name,
    source_url,

    notes,
    metadata,

    observed_at,
    created_by
  )
  values (
    v_observation,
    v_org,
    p_target_id,

    p_observed_price,

    v_internal,
    v_previous,

    v_change_amount,
    v_change_percent,

    v_internal_difference,
    v_internal_difference_percent,

    v_threshold,
    v_basis,
    v_direction,

    v_triggered,

    v_source_name,
    v_source_url,

    nullif(btrim(p_notes), ''),
    p_metadata,

    coalesce(p_observed_at, now()),
    auth.uid()
  );

  return v_observation;
end;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_billing_usage (
  p_organization_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_period_start timestamptz;
  v_period_end timestamptz;

  v_products bigint := 0;
  v_monthly_orders bigint := 0;

  v_research_items bigint := 0;
  v_price_targets bigint := 0;
  v_automation_rules bigint := 0;

  v_research_ai bigint := 0;
  v_description_ai bigint := 0;
  v_agent_ai bigint := 0;

  v_monthly_ai_runs bigint := 0;

  v_metrics jsonb;
begin
  if auth.uid() is null then
    raise exception
      'Authentication required';
  end if;


  if p_organization_id is null then
    raise exception
      'Organization is required';
  end if;


  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'Organization access denied';
  end if;


  v_period_start :=
    date_trunc(
      'month',
      now()
    );


  v_period_end :=
    v_period_start +
    interval '1 month';


  -- Products
  select count(*)
  into v_products
  from public.products
  where organization_id =
    p_organization_id;


  -- Orders in current billing period
  select count(*)
  into v_monthly_orders
  from public.orders
  where organization_id =
      p_organization_id

    and created_at >=
      v_period_start

    and created_at <
      v_period_end;


  -- Research items
  select count(*)
  into v_research_items
  from public.product_research_items
  where organization_id =
    p_organization_id;


  -- Price monitoring targets
  select count(*)
  into v_price_targets
  from public.price_monitor_targets
  where organization_id =
    p_organization_id;


  -- Automation rules
  select count(*)
  into v_automation_rules
  from public.automation_rules
  where organization_id =
    p_organization_id;


  -- AI research runs this month
  select count(*)
  into v_research_ai
  from public.product_research_ai_runs
  where organization_id =
      p_organization_id

    and created_at >=
      v_period_start

    and created_at <
      v_period_end;


  -- AI description runs this month
  select count(*)
  into v_description_ai
  from public.product_description_generations
  where organization_id =
      p_organization_id

    and created_at >=
      v_period_start

    and created_at <
      v_period_end;


  -- AI agent runs this month
  select count(*)
  into v_agent_ai
  from public.ai_agent_runs
  where organization_id =
      p_organization_id

    and created_at >=
      v_period_start

    and created_at <
      v_period_end;


  v_monthly_ai_runs :=
    v_research_ai +
    v_description_ai +
    v_agent_ai;


  v_metrics :=
    jsonb_build_object(
      'products',
      v_products,

      'monthly_orders',
      v_monthly_orders,

      'research_items',
      v_research_items,

      'price_monitor_targets',
      v_price_targets,

      'automation_rules',
      v_automation_rules,

      'monthly_ai_runs',
      v_monthly_ai_runs,

      'ai_research_runs',
      v_research_ai,

      'ai_description_runs',
      v_description_ai,

      'ai_agent_runs',
      v_agent_ai
    );


  insert into public.billing_usage (
    organization_id,

    period_start,
    period_end,

    metrics,

    updated_at
  )
  values (
    p_organization_id,

    v_period_start,
    v_period_end,

    v_metrics,

    now()
  )

  on conflict (
    organization_id,
    period_start
  )

  do update
  set
    period_end =
      excluded.period_end,

    metrics =
      excluded.metrics,

    updated_at =
      now();


  return v_metrics;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reorder_product_images (
  p_organization_id uuid,
  p_product_id      uuid,
  p_image_ids       uuid[]
)
  RETURNS integer
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_expected_count integer;
  v_requested_count integer;
  v_distinct_count integer;
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  if p_image_ids is null then
    raise exception
      'Image order is required'
      using errcode = 'P0001';
  end if;


  v_requested_count :=
    coalesce(array_length(p_image_ids, 1), 0);


  select count(*)
  into v_distinct_count
  from (
    select distinct x.image_id
    from unnest(p_image_ids) as x(image_id)
  ) d;


  if v_requested_count <> v_distinct_count then
    raise exception
      'Image order contains duplicate image IDs'
      using errcode = 'P0001';
  end if;


  perform pg_advisory_xact_lock(
    hashtextextended(
      p_organization_id::text
      || ':'
      || p_product_id::text,
      0
    )
  );


  select count(*)
  into v_expected_count
  from public.product_images
  where organization_id = p_organization_id
    and product_id = p_product_id;


  if v_requested_count <> v_expected_count then
    raise exception
      'Image order must include every product image'
      using errcode = 'P0001';
  end if;


  if exists (
    select 1
    from unnest(p_image_ids) as x(image_id)
    where not exists (
      select 1
      from public.product_images pi
      where pi.id = x.image_id
        and pi.organization_id = p_organization_id
        and pi.product_id = p_product_id
    )
  ) then

    raise exception
      'Image order contains an invalid product image'
      using errcode = 'P0001';

  end if;


  update public.product_images pi
  set sort_order = ordered.sort_order
  from (
    select
      x.image_id,
      (x.ordinality - 1)::integer as sort_order
    from unnest(p_image_ids)
      with ordinality as x(image_id, ordinality)
  ) ordered
  where pi.id = ordered.image_id
    and pi.organization_id = p_organization_id
    and pi.product_id = p_product_id;


  return v_requested_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.repair_product_primary_image()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_next_image_id uuid;
begin

  if not old.is_primary then
    return old;
  end if;


  perform pg_advisory_xact_lock(
    hashtextextended(
      old.organization_id::text
      || ':'
      || old.product_id::text,
      0
    )
  );


  select pi.id
  into v_next_image_id
  from public.product_images pi
  where pi.organization_id = old.organization_id
    and pi.product_id = old.product_id
  order by
    pi.sort_order,
    pi.created_at,
    pi.id
  limit 1;


  if v_next_image_id is not null then

    update public.product_images
    set is_primary = true
    where id = v_next_image_id
      and organization_id = old.organization_id
      and product_id = old.product_id;

  end if;


  return old;
end;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_publishing_channel_destination (
  p_organization_id           uuid,
  p_publishing_destination_id uuid
)
  RETURNS SETOF public.publishing_channel_destinations
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_destination
    public.publishing_channel_destinations%rowtype;

begin
  if coalesce(
    auth.role(),
    ''
  ) <> 'service_role'
  then
    raise exception
      'service role required';
  end if;

  if
    p_organization_id is null
    or p_publishing_destination_id is null
  then
    raise exception
      'organization and publishing destination are required';
  end if;

  update
    public.publishing_channel_destinations
  set
    status =
      'revoked',
    is_selected =
      false,
    updated_at =
      now()
  where
    id =
      p_publishing_destination_id
    and organization_id =
      p_organization_id
  returning *
  into
    v_destination;

  if not found then
    raise exception
      'publishing destination not found';
  end if;

  return next
    v_destination;

  return;
end;

$function$;

CREATE OR REPLACE FUNCTION public.revoke_publishing_provider_connection (
  p_organization_id uuid,
  p_connection_id   uuid
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
  AS $function$
declare
  v_provider text;
  v_external_account_id text;
  v_connection_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_required'
      using errcode = '22023';
  end if;

  if p_connection_id is null then
    raise exception 'connection_required'
      using errcode = '22023';
  end if;

  select
    c.provider,
    c.external_account_id
  into
    v_provider,
    v_external_account_id
  from public.publishing_provider_connections c
  where c.id = p_connection_id
    and c.organization_id = p_organization_id;

  if v_provider is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_organization_id::text
      || ':'
      || v_provider
      || ':'
      || v_external_account_id,
      0
    )
  );

  select c.id
  into v_connection_id
  from public.publishing_provider_connections c
  where c.id = p_connection_id
    and c.organization_id = p_organization_id
  for update;

  if v_connection_id is null then
    return false;
  end if;

  update public.publishing_provider_connections
  set
    authorization_status = 'revoked',
    revoked_at = now(),
    credential_updated_at = now(),
    version = version + 1,
    updated_at = now()
  where id = v_connection_id;

  delete from public.publishing_provider_credentials
  where connection_id = v_connection_id;

  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.select_marketplace_authorized_shop (
  p_marketplace_account_id uuid,
  p_authorized_shop_id     uuid
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_organization_id uuid;
  v_external_shop_id text;
  v_name text;
  v_region text;
begin
  select
    s.organization_id,
    s.external_shop_id,
    s.name,
    s.region
  into
    v_organization_id,
    v_external_shop_id,
    v_name,
    v_region
  from public.marketplace_authorized_shops s
  where s.id = p_authorized_shop_id
    and s.marketplace_account_id = p_marketplace_account_id
    and s.status = 'active'
  limit 1;

  if v_organization_id is null then
    raise exception 'authorized shop not found';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = v_organization_id
      and m.user_id = auth.uid()
  ) then
    raise exception 'user is not an organization member';
  end if;

  update public.marketplace_authorized_shops
  set
    is_selected = false,
    updated_at = now()
  where marketplace_account_id = p_marketplace_account_id
    and organization_id = v_organization_id
    and is_selected;

  update public.marketplace_authorized_shops
  set
    is_selected = true,
    updated_at = now()
  where id = p_authorized_shop_id
    and marketplace_account_id = p_marketplace_account_id
    and organization_id = v_organization_id;

  update public.marketplace_accounts
  set
    external_shop_id = v_external_shop_id,
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'selected_shop_name', v_name,
        'selected_shop_region', v_region
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = v_organization_id;

  return v_external_shop_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.select_publishing_channel_destination (
  p_organization_id           uuid,
  p_publishing_destination_id uuid
)
  RETURNS SETOF public.publishing_channel_destinations
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$

declare
  v_user_id uuid;
  v_role text;
  v_provider text;
  v_destination
    public.publishing_channel_destinations%rowtype;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'authentication required';
  end if;

  if
    p_organization_id is null
    or p_publishing_destination_id is null
  then
    raise exception
      'organization and publishing destination are required';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'publishing destination selection requires owner or admin';
  end if;

  select
    d.provider
  into
    v_provider
  from
    public.publishing_channel_destinations d
  where
    d.id =
      p_publishing_destination_id
    and d.organization_id =
      p_organization_id
    and d.status =
      'active'
  limit 1;

  if not found then
    raise exception
      'active publishing destination not found';
  end if;

  -- Lock the provider row-set first, in deterministic id order.
  -- This avoids two concurrent selections pre-locking different
  -- target rows and then deadlocking while locking the full set.
  perform
    1
  from
    public.publishing_channel_destinations d
  where
    d.organization_id =
      p_organization_id
    and d.provider =
      v_provider
  order by
    d.id
  for update;

  -- Re-read the target after the provider row-set is locked so
  -- concurrent revocation/status changes fail closed.
  select
    d.*
  into
    v_destination
  from
    public.publishing_channel_destinations d
  where
    d.id =
      p_publishing_destination_id
    and d.organization_id =
      p_organization_id
    and d.provider =
      v_provider
    and d.status =
      'active'
  for update;

  if not found then
    raise exception
      'publishing destination changed before selection';
  end if;

  update
    public.publishing_channel_destinations
  set
    is_selected =
      false,
    updated_at =
      now()
  where
    organization_id =
      p_organization_id
    and provider =
      v_destination.provider
    and is_selected
    and id <>
      p_publishing_destination_id;

  update
    public.publishing_channel_destinations
  set
    is_selected =
      true,
    updated_at =
      now()
  where
    id =
      p_publishing_destination_id
    and organization_id =
      p_organization_id
  returning *
  into
    v_destination;

  if not found then
    raise exception
      'publishing destination selection failed';
  end if;

  return next
    v_destination;

  return;
end;

$function$;

CREATE OR REPLACE FUNCTION public.set_ai_business_profile_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_category_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_low_stock_threshold (
  p_organization_id     uuid,
  p_low_stock_threshold integer,
  p_product_id          uuid    DEFAULT NULL::uuid,
  p_variant_id          uuid    DEFAULT NULL::uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_target_type text;
  v_target_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception 'User is not a member of this organization'
      using errcode = '42501';
  end if;

  if p_low_stock_threshold is null
     or p_low_stock_threshold < 0 then
    raise exception 'Low stock threshold must be zero or greater'
      using errcode = 'P0001';
  end if;

  if (
    p_product_id is null
    and p_variant_id is null
  )
  or (
    p_product_id is not null
    and p_variant_id is not null
  ) then
    raise exception
      'Exactly one inventory target is required'
      using errcode = 'P0001';
  end if;


  if p_product_id is not null then

    update public.products
    set low_stock_threshold = p_low_stock_threshold
    where id = p_product_id
      and organization_id = p_organization_id;

    if not found then
      raise exception
        'Product not found in this organization'
        using errcode = 'P0001';
    end if;

    v_target_type := 'product';
    v_target_id := p_product_id;

  else

    update public.product_variants
    set low_stock_threshold = p_low_stock_threshold
    where id = p_variant_id
      and organization_id = p_organization_id;

    if not found then
      raise exception
        'Product variant not found in this organization'
        using errcode = 'P0001';
    end if;

    v_target_type := 'variant';
    v_target_id := p_variant_id;

  end if;


  return jsonb_build_object(
    'target_type', v_target_type,
    'target_id', v_target_id,
    'low_stock_threshold', p_low_stock_threshold
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_primary_product_image (
  p_organization_id uuid,
  p_product_id      uuid,
  p_image_id        uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  perform pg_advisory_xact_lock(
    hashtextextended(
      p_organization_id::text
      || ':'
      || p_product_id::text,
      0
    )
  );


  update public.product_images
  set is_primary = true
  where id = p_image_id
    and organization_id = p_organization_id
    and product_id = p_product_id;


  if not found then
    raise exception
      'Product image not found in this organization'
      using errcode = 'P0001';
  end if;


  return p_image_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_product_variant_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.start_ai_agent_run (
  p_agent_id      uuid,
  p_objective     text,
  p_input_context jsonb,
  p_provider      text,
  p_model         text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_org uuid;
  v_active boolean;
  v_run uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_objective is null
     or length(btrim(p_objective)) = 0 then
    raise exception 'Agent objective is required';
  end if;

  if p_input_context is null
     or jsonb_typeof(p_input_context) <> 'object' then
    raise exception 'Input context must be a JSON object';
  end if;

  if p_provider is null
     or length(btrim(p_provider)) = 0 then
    raise exception 'Provider is required';
  end if;

  if p_model is null
     or length(btrim(p_model)) = 0 then
    raise exception 'Model is required';
  end if;

  select
    organization_id,
    is_active
  into
    v_org,
    v_active
  from public.ai_agents
  where id = p_agent_id;

  if not found then
    raise exception 'AI agent not found';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'Organization access denied';
  end if;

  if not v_active then
    raise exception 'AI agent is inactive';
  end if;

  insert into public.ai_agent_runs (
    id,
    organization_id,
    agent_id,
    status,
    objective,
    provider_snapshot,
    model_snapshot,
    input_context,
    created_by
  )
  values (
    v_run,
    v_org,
    p_agent_id,
    'running',
    btrim(p_objective),
    btrim(p_provider),
    btrim(p_model),
    p_input_context,
    auth.uid()
  );

  return v_run;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_marketplace_authorized_shops (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid,
  p_provider               text,
  p_shops                  jsonb,
  p_request_id             text
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_shop jsonb;
  v_provider text;
  v_external_shop_id text;
  v_name text;
  v_ciphertext text;
  v_count integer := 0;
begin
  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  if length(v_provider) = 0 then
    raise exception
      'marketplace provider is required';
  end if;

  if jsonb_typeof(p_shops) <> 'array' then
    raise exception
      'p_shops must be a json array';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id =
          p_organization_id
      and m.user_id =
          p_user_id
  ) then
    raise exception
      'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id =
          p_marketplace_account_id
      and a.organization_id =
          p_organization_id
  ) then
    raise exception
      'marketplace account not found';
  end if;

  -- The RPC provider must match the connector identity of
  -- the marketplace account. This prevents a service-role
  -- caller from persisting Shopee shops under a TikTok account
  -- or TikTok shops under a Shopee account.
  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id =
          p_marketplace_account_id
      and a.organization_id =
          p_organization_id
      and lower(
            btrim(
              coalesce(
                a.provider,
                ''
              )
            )
          ) =
          v_provider
  ) then
    raise exception
      'marketplace account provider does not match sync provider';
  end if;

  -- Preserve existing sync behavior:
  -- all previously authorized shops for this account
  -- are marked inactive before the incoming set is applied.
  update public.marketplace_authorized_shops
  set
    status = 'inactive',
    is_selected = false,
    updated_at = now()
  where organization_id =
        p_organization_id
    and marketplace_account_id =
        p_marketplace_account_id;

  for v_shop in
    select value
    from jsonb_array_elements(p_shops)
  loop
    v_external_shop_id :=
      btrim(
        coalesce(
          v_shop->>'external_shop_id',
          ''
        )
      );

    v_name :=
      btrim(
        coalesce(
          v_shop->>'name',
          ''
        )
      );

    -- Preserve SQL NULL for providers that do not use
    -- TikTok's shop_cipher credential.
    v_ciphertext :=
      nullif(
        btrim(
          coalesce(
            v_shop->>'shop_cipher_ciphertext',
            ''
          )
        ),
        ''
      );

    if length(v_external_shop_id) = 0
       or length(v_name) = 0 then
      raise exception
        'authorized shop payload is incomplete';
    end if;

    -- TikTok Shop keeps its existing credential invariant.
    if v_provider = 'tiktok_shop'
       and v_ciphertext is null then
      raise exception
        'TikTok Shop authorized shop requires encrypted shop cipher';
    end if;

    insert into public.marketplace_authorized_shops (
      organization_id,
      marketplace_account_id,
      provider,
      external_shop_id,
      shop_code,
      name,
      region,
      seller_type,
      shop_cipher_ciphertext,
      status,
      last_seen_at,
      updated_at
    )
    values (
      p_organization_id,
      p_marketplace_account_id,
      v_provider,
      v_external_shop_id,

      nullif(
        btrim(
          coalesce(
            v_shop->>'shop_code',
            ''
          )
        ),
        ''
      ),

      v_name,

      nullif(
        btrim(
          coalesce(
            v_shop->>'region',
            ''
          )
        ),
        ''
      ),

      nullif(
        btrim(
          coalesce(
            v_shop->>'seller_type',
            ''
          )
        ),
        ''
      ),

      v_ciphertext,

      'active',
      now(),
      now()
    )
    on conflict (
      marketplace_account_id,
      external_shop_id
    )
    do update set
      provider =
        excluded.provider,

      shop_code =
        excluded.shop_code,

      name =
        excluded.name,

      region =
        excluded.region,

      seller_type =
        excluded.seller_type,

      shop_cipher_ciphertext =
        excluded.shop_cipher_ciphertext,

      status =
        'active',

      last_seen_at =
        now(),

      updated_at =
        now();

    v_count :=
      v_count + 1;
  end loop;

  update public.marketplace_accounts
  set
    last_synced_at =
      now(),

    metadata =
      coalesce(
        metadata,
        '{}'::jsonb
      )
      || jsonb_build_object(
        'connector',
        v_provider,

        'authorized_shop_count',
        v_count
      ),

    updated_at =
      now()

  where id =
        p_marketplace_account_id
    and organization_id =
        p_organization_id;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    message,
    metadata
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    'inbound',
    'account',
    'authorized_shops_sync',
    'success',

    format(
      'Synced %s authorized shop(s).',
      v_count
    ),

    jsonb_build_object(
      'provider',
      v_provider,

      'request_id',
      nullif(
        btrim(
          coalesce(
            p_request_id,
            ''
          )
        ),
        ''
      ),

      'shop_count',
      v_count
    )
  );

  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_order_status (
  p_organization_id uuid,
  p_order_id        uuid,
  p_new_status      text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_current_status text;
  v_item record;
  v_remaining_stock integer;
begin

  if auth.uid() is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
  end if;


  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  if p_new_status not in (
    'processing',
    'completed',
    'cancelled'
  ) then
    raise exception
      'Invalid target order status'
      using errcode = 'P0001';
  end if;


  select status
  into v_current_status
  from public.orders
  where id = p_order_id
    and organization_id = p_organization_id
  for update;


  if not found then
    raise exception
      'Order not found in this organization'
      using errcode = 'P0001';
  end if;


  if v_current_status in (
    'completed',
    'cancelled'
  ) then
    raise exception
      'Order is already in a terminal status'
      using errcode = 'P0001';
  end if;


  -- =======================================================
  -- pending -> processing
  -- =======================================================

  if v_current_status = 'pending'
     and p_new_status = 'processing' then


    perform set_config(
      'app.inventory_movement_type',
      'order_deduction',
      true
    );

    perform set_config(
      'app.inventory_reference_type',
      'order',
      true
    );

    perform set_config(
      'app.inventory_reference_id',
      p_order_id::text,
      true
    );

    perform set_config(
      'app.inventory_note',
      'Stock deducted when order entered processing',
      true
    );


    -- Canonical lock/update order for product + variant targets
    for v_item in

      select
        targets.target_type,
        targets.target_id,
        targets.quantity
      from (

        select
          'product'::text as target_type,
          oi.product_id as target_id,
          sum(oi.quantity)::integer as quantity
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is null
        group by oi.product_id

        union all

        select
          'variant'::text as target_type,
          oi.variant_id as target_id,
          sum(oi.quantity)::integer as quantity
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is not null
        group by oi.variant_id

      ) targets

      order by
        targets.target_type,
        targets.target_id

    loop


      if v_item.target_type = 'product' then

        update public.products
        set stock = stock - v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
          and stock >= v_item.quantity
        returning stock
        into v_remaining_stock;


        if not found then
          raise exception
            'Insufficient stock or product unavailable for product %',
            v_item.target_id
            using errcode = 'P0001';
        end if;


      elsif v_item.target_type = 'variant' then

        update public.product_variants
        set stock = stock - v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
          and stock >= v_item.quantity
        returning stock
        into v_remaining_stock;


        if not found then
          raise exception
            'Insufficient stock or variant unavailable for variant %',
            v_item.target_id
            using errcode = 'P0001';
        end if;

      end if;

    end loop;


  -- =======================================================
  -- pending -> cancelled
  -- No stock was deducted
  -- =======================================================

  elsif v_current_status = 'pending'
        and p_new_status = 'cancelled' then

    null;


  -- =======================================================
  -- processing -> completed
  -- Stock stays deducted
  -- =======================================================

  elsif v_current_status = 'processing'
        and p_new_status = 'completed' then

    null;


  -- =======================================================
  -- processing -> cancelled
  -- Restore product / variant inventory
  -- =======================================================

  elsif v_current_status = 'processing'
        and p_new_status = 'cancelled' then


    perform set_config(
      'app.inventory_movement_type',
      'order_restore',
      true
    );

    perform set_config(
      'app.inventory_reference_type',
      'order',
      true
    );

    perform set_config(
      'app.inventory_reference_id',
      p_order_id::text,
      true
    );

    perform set_config(
      'app.inventory_note',
      'Stock restored when processing order was cancelled',
      true
    );


    for v_item in

      select
        targets.target_type,
        targets.target_id,
        targets.quantity
      from (

        select
          'product'::text as target_type,
          oi.product_id as target_id,
          sum(oi.quantity)::integer as quantity
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is null
        group by oi.product_id

        union all

        select
          'variant'::text as target_type,
          oi.variant_id as target_id,
          sum(oi.quantity)::integer as quantity
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is not null
        group by oi.variant_id

      ) targets

      order by
        targets.target_type,
        targets.target_id

    loop


      if v_item.target_type = 'product' then

        update public.products
        set stock = stock + v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
        returning stock
        into v_remaining_stock;


        if not found then
          raise exception
            'Product integrity error for product %',
            v_item.target_id
            using errcode = 'P0001';
        end if;


      elsif v_item.target_type = 'variant' then

        update public.product_variants
        set stock = stock + v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
        returning stock
        into v_remaining_stock;


        if not found then
          raise exception
            'Variant integrity error for variant %',
            v_item.target_id
            using errcode = 'P0001';
        end if;

      end if;

    end loop;


  else

    raise exception
      'Invalid order status transition: % -> %',
      v_current_status,
      p_new_status
      using errcode = 'P0001';

  end if;


  -- =======================================================
  -- Clear transaction-local inventory context
  -- =======================================================

  perform set_config(
    'app.inventory_movement_type',
    '',
    true
  );

  perform set_config(
    'app.inventory_reference_type',
    '',
    true
  );

  perform set_config(
    'app.inventory_reference_id',
    '',
    true
  );

  perform set_config(
    'app.inventory_note',
    '',
    true
  );


  -- completed_at stays consistent with status constraint
  update public.orders
  set
    status = p_new_status,
    completed_at =
      case
        when p_new_status = 'completed'
          then now()
        else null
      end
  where id = p_order_id
    and organization_id = p_organization_id;


  return p_new_status;

end;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_marketplace_catalog_page (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_authorized_shop_id     uuid,
  p_user_id                uuid,
  p_provider               text,
  p_products               jsonb,
  p_request_id             text,
  p_total_count            integer,
  p_has_more               boolean
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_product jsonb;
  v_sku jsonb;
  v_catalog_product_id uuid;
  v_external_product_id text;
  v_title text;
  v_external_status text;
  v_count integer := 0;
begin
  if jsonb_typeof(p_products) <> 'array' then
    raise exception 'p_products must be a json array';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_authorized_shops s
    where s.id = p_authorized_shop_id
      and s.organization_id = p_organization_id
      and s.marketplace_account_id = p_marketplace_account_id
      and s.is_selected = true
      and s.status = 'active'
  ) then
    raise exception 'selected authorized shop not found';
  end if;

  for v_product in
    select value
    from jsonb_array_elements(p_products)
  loop
    v_external_product_id :=
      btrim(coalesce(v_product->>'external_product_id', ''));

    v_title :=
      btrim(coalesce(v_product->>'title', ''));

    v_external_status :=
      btrim(coalesce(v_product->>'status', 'UNKNOWN'));

    if length(v_external_product_id) = 0
       or length(v_title) = 0 then
      raise exception 'catalog product payload is incomplete';
    end if;

    insert into public.marketplace_catalog_products (
      organization_id,
      marketplace_account_id,
      authorized_shop_id,
      provider,
      external_product_id,
      title,
      external_status,
      external_create_time,
      external_update_time,
      last_seen_at,
      updated_at
    )
    values (
      p_organization_id,
      p_marketplace_account_id,
      p_authorized_shop_id,
      lower(btrim(p_provider)),
      v_external_product_id,
      v_title,
      coalesce(nullif(v_external_status, ''), 'UNKNOWN'),
      case
        when (v_product->>'create_time') ~ '^[0-9]+$'
          then to_timestamp((v_product->>'create_time')::double precision)
        else null
      end,
      case
        when (v_product->>'update_time') ~ '^[0-9]+$'
          then to_timestamp((v_product->>'update_time')::double precision)
        else null
      end,
      now(),
      now()
    )
    on conflict (authorized_shop_id, external_product_id)
    do update set
      provider = excluded.provider,
      title = excluded.title,
      external_status = excluded.external_status,
      external_create_time = excluded.external_create_time,
      external_update_time = excluded.external_update_time,
      last_seen_at = now(),
      updated_at = now()
    returning id into v_catalog_product_id;

    for v_sku in
      select value
      from jsonb_array_elements(
        coalesce(v_product->'skus', '[]'::jsonb)
      )
    loop
      if length(
        btrim(coalesce(v_sku->>'external_sku_id', ''))
      ) = 0 then
        continue;
      end if;

      insert into public.marketplace_catalog_skus (
        organization_id,
        catalog_product_id,
        external_sku_id,
        seller_sku,
        currency,
        sale_price,
        tax_exclusive_price,
        inventory,
        last_seen_at,
        updated_at
      )
      values (
        p_organization_id,
        v_catalog_product_id,
        btrim(v_sku->>'external_sku_id'),
        nullif(btrim(coalesce(v_sku->>'seller_sku', '')), ''),
        nullif(btrim(coalesce(v_sku->>'currency', '')), ''),
        case
          when coalesce(v_sku->>'sale_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_sku->>'sale_price')::numeric
          else null
        end,
        case
          when coalesce(v_sku->>'tax_exclusive_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_sku->>'tax_exclusive_price')::numeric
          else null
        end,
        case
          when jsonb_typeof(v_sku->'inventory') = 'array'
            then v_sku->'inventory'
          else '[]'::jsonb
        end,
        now(),
        now()
      )
      on conflict (catalog_product_id, external_sku_id)
      do update set
        seller_sku = excluded.seller_sku,
        currency = excluded.currency,
        sale_price = excluded.sale_price,
        tax_exclusive_price = excluded.tax_exclusive_price,
        inventory = excluded.inventory,
        last_seen_at = now(),
        updated_at = now();
    end loop;

    v_count := v_count + 1;
  end loop;

  update public.marketplace_accounts
  set
    last_synced_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'catalog_last_page_count', v_count,
        'catalog_total_count', greatest(coalesce(p_total_count, v_count), 0),
        'catalog_has_more', coalesce(p_has_more, false)
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = p_organization_id;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    message,
    metadata
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    'inbound',
    'product',
    'catalog_page_sync',
    'success',
    format('Synced %s marketplace product(s).', v_count),
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'request_id', nullif(btrim(coalesce(p_request_id, '')), ''),
      'page_count', v_count,
      'total_count', greatest(coalesce(p_total_count, v_count), 0),
      'has_more', coalesce(p_has_more, false)
    )
  );

  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_marketplace_connection (
  p_organization_id          uuid,
  p_marketplace_account_id   uuid,
  p_connected_by             uuid,
  p_provider                 text,
  p_open_id                  text,
  p_access_token_ciphertext  text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at  timestamp with time zone,
  p_refresh_token_expires_at timestamp with time zone,
  p_granted_scopes           text[],
  p_user_type                integer,
  p_metadata                 jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_connection_id uuid;
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_connected_by
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id = p_marketplace_account_id
      and a.organization_id = p_organization_id
  ) then
    raise exception 'marketplace account not found';
  end if;

  if length(btrim(coalesce(p_access_token_ciphertext, ''))) = 0
     or length(btrim(coalesce(p_refresh_token_ciphertext, ''))) = 0 then
    raise exception 'encrypted marketplace tokens are required';
  end if;

  insert into public.marketplace_connections (
    organization_id,
    marketplace_account_id,
    provider,
    open_id,
    access_token_ciphertext,
    refresh_token_ciphertext,
    access_token_expires_at,
    refresh_token_expires_at,
    granted_scopes,
    user_type,
    status,
    connected_by,
    connected_at,
    last_refreshed_at,
    metadata,
    updated_at
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    lower(btrim(p_provider)),
    nullif(btrim(coalesce(p_open_id, '')), ''),
    p_access_token_ciphertext,
    p_refresh_token_ciphertext,
    p_access_token_expires_at,
    p_refresh_token_expires_at,
    coalesce(p_granted_scopes, '{}'::text[]),
    p_user_type,
    'active',
    p_connected_by,
    now(),
    null,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (marketplace_account_id)
  do update set
    provider = excluded.provider,
    open_id = excluded.open_id,
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    access_token_expires_at = excluded.access_token_expires_at,
    refresh_token_expires_at = excluded.refresh_token_expires_at,
    granted_scopes = excluded.granted_scopes,
    user_type = excluded.user_type,
    status = 'active',
    connected_by = excluded.connected_by,
    connected_at = now(),
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_connection_id;

  update public.marketplace_accounts
  set
    status = 'active',
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'connector', lower(btrim(p_provider)),
        'connection_status', 'connected'
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = p_organization_id;

  return v_connection_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_marketplace_external_order_page (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_authorized_shop_id     uuid,
  p_user_id                uuid,
  p_provider               text,
  p_orders                 jsonb,
  p_request_id             text,
  p_total_count            integer,
  p_has_more               boolean
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_order jsonb;
  v_item jsonb;
  v_external_order_row_id uuid;
  v_external_order_id text;
  v_external_status text;
  v_count integer := 0;
begin
  if jsonb_typeof(p_orders) <> 'array' then
    raise exception 'p_orders must be a json array';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_authorized_shops s
    where s.id = p_authorized_shop_id
      and s.organization_id = p_organization_id
      and s.marketplace_account_id = p_marketplace_account_id
      and s.is_selected = true
      and s.status = 'active'
  ) then
    raise exception 'selected authorized shop not found';
  end if;

  for v_order in
    select value
    from jsonb_array_elements(p_orders)
  loop
    v_external_order_id :=
      btrim(coalesce(v_order->>'external_order_id', ''));

    v_external_status :=
      btrim(coalesce(v_order->>'status', 'UNKNOWN'));

    if length(v_external_order_id) = 0 then
      raise exception 'external order payload is incomplete';
    end if;

    insert into public.marketplace_external_orders (
      organization_id,
      marketplace_account_id,
      authorized_shop_id,
      provider,
      external_order_id,
      external_status,
      payment_currency,
      payment_subtotal,
      payment_shipping_fee,
      payment_original_shipping_fee,
      payment_seller_discount,
      payment_platform_discount,
      payment_total_amount,
      fulfillment_type,
      delivery_option_name,
      is_sample_order,
      external_create_time,
      external_update_time,
      last_seen_at,
      updated_at
    )
    values (
      p_organization_id,
      p_marketplace_account_id,
      p_authorized_shop_id,
      lower(btrim(p_provider)),
      v_external_order_id,
      coalesce(nullif(v_external_status, ''), 'UNKNOWN'),
      nullif(btrim(coalesce(v_order#>>'{payment,currency}', '')), ''),
      case
        when coalesce(v_order#>>'{payment,sub_total}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,sub_total}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,shipping_fee}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,shipping_fee}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,original_shipping_fee}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,original_shipping_fee}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,seller_discount}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,seller_discount}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,platform_discount}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,platform_discount}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,total_amount}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,total_amount}')::numeric
        else null
      end,
      nullif(btrim(coalesce(v_order->>'fulfillment_type', '')), ''),
      nullif(btrim(coalesce(v_order->>'delivery_option_name', '')), ''),
      coalesce((v_order->>'is_sample_order')::boolean, false),
      case
        when (v_order->>'create_time') ~ '^[0-9]+$'
          then to_timestamp((v_order->>'create_time')::double precision)
        else null
      end,
      case
        when (v_order->>'update_time') ~ '^[0-9]+$'
          then to_timestamp((v_order->>'update_time')::double precision)
        else null
      end,
      now(),
      now()
    )
    on conflict (authorized_shop_id, external_order_id)
    do update set
      provider = excluded.provider,
      external_status = excluded.external_status,
      payment_currency = excluded.payment_currency,
      payment_subtotal = excluded.payment_subtotal,
      payment_shipping_fee = excluded.payment_shipping_fee,
      payment_original_shipping_fee =
        excluded.payment_original_shipping_fee,
      payment_seller_discount = excluded.payment_seller_discount,
      payment_platform_discount =
        excluded.payment_platform_discount,
      payment_total_amount = excluded.payment_total_amount,
      fulfillment_type = excluded.fulfillment_type,
      delivery_option_name = excluded.delivery_option_name,
      is_sample_order = excluded.is_sample_order,
      external_create_time = excluded.external_create_time,
      external_update_time = excluded.external_update_time,
      last_seen_at = now(),
      updated_at = now()
    returning id into v_external_order_row_id;

    delete from public.marketplace_external_order_items
    where external_order_id = v_external_order_row_id
      and organization_id = p_organization_id;

    for v_item in
      select value
      from jsonb_array_elements(
        coalesce(v_order->'line_items', '[]'::jsonb)
      )
    loop
      if length(
        btrim(coalesce(v_item->>'external_line_item_id', ''))
      ) = 0 then
        continue;
      end if;

      insert into public.marketplace_external_order_items (
        organization_id,
        external_order_id,
        external_line_item_id,
        external_product_id,
        product_name,
        external_sku_id,
        sku_name,
        seller_sku,
        quantity,
        original_price,
        sale_price,
        updated_at
      )
      values (
        p_organization_id,
        v_external_order_row_id,
        btrim(v_item->>'external_line_item_id'),
        nullif(btrim(coalesce(v_item->>'external_product_id', '')), ''),
        nullif(btrim(coalesce(v_item->>'product_name', '')), ''),
        nullif(btrim(coalesce(v_item->>'external_sku_id', '')), ''),
        nullif(btrim(coalesce(v_item->>'sku_name', '')), ''),
        nullif(btrim(coalesce(v_item->>'seller_sku', '')), ''),
        greatest(
          coalesce((v_item->>'quantity')::integer, 1),
          1
        ),
        case
          when coalesce(v_item->>'original_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_item->>'original_price')::numeric
          else null
        end,
        case
          when coalesce(v_item->>'sale_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_item->>'sale_price')::numeric
          else null
        end,
        now()
      );
    end loop;

    v_count := v_count + 1;
  end loop;

  update public.marketplace_accounts
  set
    last_synced_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'external_order_last_page_count', v_count,
        'external_order_total_count',
          greatest(coalesce(p_total_count, v_count), 0),
        'external_order_has_more', coalesce(p_has_more, false)
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = p_organization_id;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    message,
    metadata
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    'inbound',
    'order',
    'external_order_page_sync',
    'success',
    format('Synced %s external marketplace order(s).', v_count),
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'request_id', nullif(btrim(coalesce(p_request_id, '')), ''),
      'page_count', v_count,
      'total_count', greatest(coalesce(p_total_count, v_count), 0),
      'has_more', coalesce(p_has_more, false)
    )
  );

  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_publishing_provider_connection (
  p_organization_id          uuid,
  p_provider                 text,
  p_external_account_id      text,
  p_connected_by_user_id     uuid,
  p_granted_scopes           text[],
  p_supported_capabilities   text[],
  p_access_token_ciphertext  text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at  timestamp with time zone,
  p_refresh_token_expires_at timestamp with time zone,
  p_token_type               text,
  p_encryption_key_version   text
)
  RETURNS TABLE (
    connection_id           uuid,
    credential_reference_id uuid,
    connection_version      bigint
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
  AS $function$
declare
  v_provider text;
  v_external_account_id text;
  v_granted_scopes text[];
  v_supported_capabilities text[];
  v_connection_id uuid;
  v_credential_reference_id uuid;
  v_connection_version bigint;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_required'
      using errcode = '22023';
  end if;

  v_provider :=
    lower(btrim(coalesce(p_provider, '')));

  v_external_account_id :=
    btrim(coalesce(p_external_account_id, ''));

  if v_provider = '' then
    raise exception 'provider_required'
      using errcode = '22023';
  end if;

  if v_external_account_id = '' then
    raise exception 'external_account_required'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_access_token_ciphertext, '')) = '' then
    raise exception 'access_token_ciphertext_required'
      using errcode = '22023';
  end if;

  if (
    p_refresh_token_ciphertext is not null
    and btrim(p_refresh_token_ciphertext) = ''
  ) then
    raise exception 'refresh_token_ciphertext_invalid'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_encryption_key_version, '')) = '' then
    raise exception 'encryption_key_version_required'
      using errcode = '22023';
  end if;

  select coalesce(
    array_agg(
      distinct btrim(scope_value)
      order by btrim(scope_value)
    ),
    '{}'::text[]
  )
  into v_granted_scopes
  from unnest(
    coalesce(p_granted_scopes, '{}'::text[])
  ) as scope_value
  where btrim(scope_value) <> '';

  select coalesce(
    array_agg(
      distinct btrim(capability_value)
      order by btrim(capability_value)
    ),
    '{}'::text[]
  )
  into v_supported_capabilities
  from unnest(
    coalesce(p_supported_capabilities, '{}'::text[])
  ) as capability_value
  where btrim(capability_value) <> '';

  if not (
    v_supported_capabilities <@ array[
      'publish_text',
      'publish_image',
      'publish_video'
    ]::text[]
  ) then
    raise exception 'unsupported_capability'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_organization_id::text
      || ':'
      || v_provider
      || ':'
      || v_external_account_id,
      0
    )
  );

  insert into public.publishing_provider_connections (
    organization_id,
    provider,
    external_account_id,
    authorization_status,
    granted_scopes,
    supported_capabilities,
    credential_expires_at,
    credential_updated_at,
    connected_by_user_id,
    authorized_at,
    revoked_at,
    version,
    created_at,
    updated_at
  )
  values (
    p_organization_id,
    v_provider,
    v_external_account_id,
    'authorized',
    v_granted_scopes,
    v_supported_capabilities,
    p_access_token_expires_at,
    now(),
    p_connected_by_user_id,
    now(),
    null,
    1,
    now(),
    now()
  )
  on conflict (
    organization_id,
    provider,
    external_account_id
  )
  do update set
    authorization_status = 'authorized',
    granted_scopes = excluded.granted_scopes,
    supported_capabilities = excluded.supported_capabilities,
    credential_expires_at = excluded.credential_expires_at,
    credential_updated_at = now(),
    connected_by_user_id = excluded.connected_by_user_id,
    authorized_at = now(),
    revoked_at = null,
    version =
      public.publishing_provider_connections.version + 1,
    updated_at = now()
  returning
    public.publishing_provider_connections.id,
    public.publishing_provider_connections.credential_reference_id,
    public.publishing_provider_connections.version
  into
    v_connection_id,
    v_credential_reference_id,
    v_connection_version;

  insert into public.publishing_provider_credentials (
    id,
    connection_id,
    credential_kind,
    storage_kind,
    access_token_ciphertext,
    refresh_token_ciphertext,
    access_token_expires_at,
    refresh_token_expires_at,
    token_type,
    encryption_key_version,
    created_at,
    updated_at,
    rotated_at
  )
  values (
    v_credential_reference_id,
    v_connection_id,
    'publishing_provider_oauth',
    'server_encrypted',
    p_access_token_ciphertext,
    p_refresh_token_ciphertext,
    p_access_token_expires_at,
    p_refresh_token_expires_at,
    nullif(btrim(coalesce(p_token_type, '')), ''),
    p_encryption_key_version,
    now(),
    now(),
    now()
  )
  on conflict (id)
  do update set
    connection_id = excluded.connection_id,
    credential_kind = 'publishing_provider_oauth',
    storage_kind = 'server_encrypted',
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    access_token_expires_at = excluded.access_token_expires_at,
    refresh_token_expires_at = excluded.refresh_token_expires_at,
    token_type = excluded.token_type,
    encryption_key_version = excluded.encryption_key_version,
    updated_at = now(),
    rotated_at = now();

  return query
  select
    v_connection_id,
    v_credential_reference_id,
    v_connection_version;
end;
$function$;

ALTER TABLE "public"."ai_agent_runs"
  ADD CONSTRAINT "ai_agent_runs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."ai_agent_steps"
  ADD CONSTRAINT "ai_agent_steps_run_org_fkey" FOREIGN KEY (run_id, organization_id) REFERENCES public.ai_agent_runs(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_agent_runs"
  ADD CONSTRAINT "ai_agent_runs_agent_org_fkey" FOREIGN KEY (agent_id, organization_id) REFERENCES public.ai_agents(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_business_profiles"
  ADD CONSTRAINT "ai_business_profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."ai_business_profiles"
  ADD CONSTRAINT "ai_business_profiles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."ai_controlled_publications"
  ADD CONSTRAINT "ai_controlled_publications_confirmed_by_user_id_fkey" FOREIGN KEY (confirmed_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."ai_controlled_publications"
  ADD CONSTRAINT "ai_controlled_publications_contract_target_check"
    CHECK
    ((((contract_version = 1) AND (target_resource = 'marketplace_authorized_shop'::text) AND (destination_type IS NULL) AND (legacy_authorized_shop_id = target_id) AND
    (publishing_destination_id IS NULL)) OR
    ((contract_version = 2) AND (target_resource = 'publishing_channel_destination'::text) AND (destination_type = ANY (ARRAY['account'::text, 'page'::text, 'channel'::text])) AND
    (publishing_destination_id = target_id) AND (legacy_authorized_shop_id IS NULL))));

ALTER TABLE "public"."ai_controlled_publications"
  ADD CONSTRAINT "ai_controlled_publications_requested_by_user_id_fkey" FOREIGN KEY (requested_by_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE "public"."ai_conversation_messages"
  ADD CONSTRAINT "ai_conversation_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_conversation_messages"
  ADD CONSTRAINT "ai_conversation_messages_conversation_fkey" FOREIGN KEY (conversation_id, organization_id, user_id)
    REFERENCES public.ai_conversations(id, organization_id, user_id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_conversations"
  ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_memories"
  ADD CONSTRAINT "ai_memories_source_conversation_id_fkey" FOREIGN KEY (source_conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;

ALTER TABLE "public"."ai_memories"
  ADD CONSTRAINT "ai_memories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_credit_ledger"
  ADD CONSTRAINT "ai_credit_ledger_usage_id_fkey" FOREIGN KEY (usage_id) REFERENCES public.ai_usage_ledger(id) ON DELETE RESTRICT;

ALTER TABLE "public"."ai_usage_ledger"
  ADD CONSTRAINT "ai_usage_ledger_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."automation_actions"
  ADD CONSTRAINT "automation_actions_executed_by_fkey" FOREIGN KEY (executed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."automation_actions"
  ADD CONSTRAINT "automation_actions_rule_org_fkey" FOREIGN KEY (rule_id, organization_id) REFERENCES public.automation_rules(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."automation_runs"
  ADD CONSTRAINT "automation_runs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."automation_actions"
  ADD CONSTRAINT "automation_actions_run_org_fkey" FOREIGN KEY (run_id, organization_id) REFERENCES public.automation_runs(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."automation_runs"
  ADD CONSTRAINT "automation_runs_rule_org_fkey" FOREIGN KEY (rule_id, organization_id) REFERENCES public.automation_rules(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."billing_checkout_entitlement_activations"
  ADD CONSTRAINT "billing_checkout_entitlement_activatio_checkout_session_id_fkey" FOREIGN KEY (checkout_session_id) REFERENCES public.billing_checkout_sessions(id)
    ON DELETE CASCADE;

ALTER TABLE "public"."billing_checkout_entitlement_activations"
  ADD CONSTRAINT "billing_checkout_entitlement_activations_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id);

ALTER TABLE "public"."billing_checkout_sessions"
  ADD CONSTRAINT "billing_checkout_sessions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id);

ALTER TABLE "public"."marketplace_authorized_shops"
  ADD CONSTRAINT "marketplace_authorized_shops_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id)
    REFERENCES public.marketplace_accounts(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_controlled_publications"
  ADD CONSTRAINT "ai_controlled_publications_legacy_authorized_shop_fkey" FOREIGN KEY (legacy_authorized_shop_id) REFERENCES public.marketplace_authorized_shops(id)
    ON DELETE RESTRICT;

ALTER TABLE "public"."marketplace_catalog_products"
  ADD CONSTRAINT "marketplace_catalog_products_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id)
    REFERENCES public.marketplace_accounts(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_catalog_products"
  ADD CONSTRAINT "marketplace_catalog_products_shop_fkey" FOREIGN KEY (authorized_shop_id) REFERENCES public.marketplace_authorized_shops(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_catalog_skus"
  ADD CONSTRAINT "marketplace_catalog_skus_catalog_product_id_fkey" FOREIGN KEY (catalog_product_id) REFERENCES public.marketplace_catalog_products(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_connections"
  ADD CONSTRAINT "marketplace_connections_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id)
    REFERENCES public.marketplace_accounts(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_connections"
  ADD CONSTRAINT "marketplace_connections_connected_by_fkey" FOREIGN KEY (connected_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."marketplace_external_orders"
  ADD CONSTRAINT "marketplace_external_orders_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id)
    REFERENCES public.marketplace_accounts(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_external_order_items"
  ADD CONSTRAINT "marketplace_external_order_items_external_order_id_fkey" FOREIGN KEY (external_order_id) REFERENCES public.marketplace_external_orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_external_orders"
  ADD CONSTRAINT "marketplace_external_orders_shop_fkey" FOREIGN KEY (authorized_shop_id) REFERENCES public.marketplace_authorized_shops(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_listings"
  ADD CONSTRAINT "marketplace_listings_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id) REFERENCES public.marketplace_accounts(id, organization_id)
    ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_oauth_states"
  ADD CONSTRAINT "marketplace_oauth_states_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id)
    REFERENCES public.marketplace_accounts(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_oauth_states"
  ADD CONSTRAINT "marketplace_oauth_states_initiated_by_fkey" FOREIGN KEY (initiated_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_order_links"
  ADD CONSTRAINT "marketplace_order_links_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id)
    REFERENCES public.marketplace_accounts(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_sync_logs"
  ADD CONSTRAINT "marketplace_sync_logs_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id) REFERENCES public.marketplace_accounts(id, organization_id)
    ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_webhook_events"
  ADD CONSTRAINT "marketplace_webhook_events_account_organization_fkey" FOREIGN KEY (marketplace_account_id, organization_id)
    REFERENCES public.marketplace_accounts(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_webhook_events"
  ADD CONSTRAINT "marketplace_webhook_events_shop_fkey" FOREIGN KEY (authorized_shop_id) REFERENCES public.marketplace_authorized_shops(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;

ALTER TABLE "public"."marketplace_order_links"
  ADD CONSTRAINT "marketplace_order_links_order_organization_fkey" FOREIGN KEY (order_id, organization_id) REFERENCES public.orders(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."organization_members"
  ADD CONSTRAINT "organization_members_user_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."organization_subscriptions"
  ADD CONSTRAINT "organization_subscriptions_plan_fkey" FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id);

ALTER TABLE "public"."ai_agent_runs"
  ADD CONSTRAINT "ai_agent_runs_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_agent_steps"
  ADD CONSTRAINT "ai_agent_steps_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_agents"
  ADD CONSTRAINT "ai_agents_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_business_profiles"
  ADD CONSTRAINT "ai_business_profiles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_controlled_actions"
  ADD CONSTRAINT "ai_controlled_actions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_controlled_publications"
  ADD CONSTRAINT "ai_controlled_publications_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_conversation_messages"
  ADD CONSTRAINT "ai_conversation_messages_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_conversations"
  ADD CONSTRAINT "ai_conversations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_credit_ledger"
  ADD CONSTRAINT "ai_credit_ledger_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_memories"
  ADD CONSTRAINT "ai_memories_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_usage_ledger"
  ADD CONSTRAINT "ai_usage_ledger_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."automation_actions"
  ADD CONSTRAINT "automation_actions_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."automation_rules"
  ADD CONSTRAINT "automation_rules_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."automation_runs"
  ADD CONSTRAINT "automation_runs_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."billing_checkout_entitlement_activations"
  ADD CONSTRAINT "billing_checkout_entitlement_activations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."billing_checkout_sessions"
  ADD CONSTRAINT "billing_checkout_sessions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."billing_events"
  ADD CONSTRAINT "billing_events_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."billing_usage"
  ADD CONSTRAINT "billing_usage_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."categories"
  ADD CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."customers"
  ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."inventory_movements"
  ADD CONSTRAINT "inventory_movements_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_accounts"
  ADD CONSTRAINT "marketplace_accounts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_authorized_shops"
  ADD CONSTRAINT "marketplace_authorized_shops_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_catalog_products"
  ADD CONSTRAINT "marketplace_catalog_products_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_catalog_skus"
  ADD CONSTRAINT "marketplace_catalog_skus_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_connections"
  ADD CONSTRAINT "marketplace_connections_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_external_order_items"
  ADD CONSTRAINT "marketplace_external_order_items_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_external_orders"
  ADD CONSTRAINT "marketplace_external_orders_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_listings"
  ADD CONSTRAINT "marketplace_listings_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_oauth_states"
  ADD CONSTRAINT "marketplace_oauth_states_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_order_links"
  ADD CONSTRAINT "marketplace_order_links_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_sync_logs"
  ADD CONSTRAINT "marketplace_sync_logs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_webhook_events"
  ADD CONSTRAINT "marketplace_webhook_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."organization_ai_controls"
  ADD CONSTRAINT "organization_ai_controls_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."organization_members"
  ADD CONSTRAINT "organization_members_organization_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."organization_subscriptions"
  ADD CONSTRAINT "organization_subscriptions_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."automation_rules"
  ADD CONSTRAINT "automation_rules_monitor_org_fkey" FOREIGN KEY (price_monitor_target_id, organization_id) REFERENCES public.price_monitor_targets(id, organization_id)
    ON DELETE CASCADE;

ALTER TABLE "public"."price_monitor_targets"
  ADD CONSTRAINT "price_monitor_targets_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."price_observations"
  ADD CONSTRAINT "price_observations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."automation_runs"
  ADD CONSTRAINT "automation_runs_observation_org_fkey" FOREIGN KEY (trigger_observation_id, organization_id) REFERENCES public.price_observations(id, organization_id)
    ON DELETE CASCADE;

ALTER TABLE "public"."price_observations"
  ADD CONSTRAINT "price_observations_org_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."price_observations"
  ADD CONSTRAINT "price_observations_target_org_fkey" FOREIGN KEY (target_id, organization_id) REFERENCES public.price_monitor_targets(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."product_description_generations"
  ADD CONSTRAINT "product_description_generations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."product_description_generations"
  ADD CONSTRAINT "product_description_generations_organization_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_images"
  ADD CONSTRAINT "product_images_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_research_ai_runs"
  ADD CONSTRAINT "product_research_ai_runs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."product_research_ai_runs"
  ADD CONSTRAINT "product_research_ai_runs_organization_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_research_ai_runs"
  ADD CONSTRAINT "product_research_ai_runs_item_organization_fkey" FOREIGN KEY (research_item_id, organization_id) REFERENCES public.product_research_items(id, organization_id)
    ON DELETE CASCADE;

ALTER TABLE "public"."product_research_items"
  ADD CONSTRAINT "product_research_items_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_research_observations"
  ADD CONSTRAINT "product_research_observations_item_organization_fkey" FOREIGN KEY (research_item_id, organization_id)
    REFERENCES public.product_research_items(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."product_research_observations"
  ADD CONSTRAINT "product_research_observations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."automation_actions"
  ADD CONSTRAINT "automation_actions_variant_org_fkey" FOREIGN KEY (variant_id, organization_id) REFERENCES public.product_variants(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_listings"
  ADD CONSTRAINT "marketplace_listings_variant_organization_fkey" FOREIGN KEY (variant_id, organization_id) REFERENCES public.product_variants(id, organization_id)
    ON DELETE CASCADE;

ALTER TABLE "public"."price_monitor_targets"
  ADD CONSTRAINT "price_monitor_targets_variant_org_fkey" FOREIGN KEY (variant_id, organization_id) REFERENCES public.product_variants(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."product_variants"
  ADD CONSTRAINT "product_variants_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."inventory_movements"
  ADD CONSTRAINT "inventory_movements_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE RESTRICT;

ALTER TABLE "public"."products"
  ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE "public"."automation_actions"
  ADD CONSTRAINT "automation_actions_product_org_fkey" FOREIGN KEY (product_id, organization_id) REFERENCES public.products(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."marketplace_listings"
  ADD CONSTRAINT "marketplace_listings_product_organization_fkey" FOREIGN KEY (product_id, organization_id) REFERENCES public.products(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."price_monitor_targets"
  ADD CONSTRAINT "price_monitor_targets_product_org_fkey" FOREIGN KEY (product_id, organization_id) REFERENCES public.products(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."product_description_generations"
  ADD CONSTRAINT "product_description_generations_product_organization_fkey" FOREIGN KEY (product_id, organization_id) REFERENCES public.products(id, organization_id)
    ON DELETE CASCADE;

ALTER TABLE "public"."product_images"
  ADD CONSTRAINT "product_images_product_org_fk" FOREIGN KEY (product_id, organization_id) REFERENCES public.products(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."product_research_items"
  ADD CONSTRAINT "product_research_items_product_organization_fkey" FOREIGN KEY (linked_product_id, organization_id) REFERENCES public.products(id, organization_id) ON DELETE
    SET NULL (linked_product_id);

ALTER TABLE "public"."product_variants"
  ADD CONSTRAINT "product_variants_product_organization_fkey" FOREIGN KEY (product_id, organization_id) REFERENCES public.products(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."products"
  ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."inventory_movements"
  ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE "public"."publishing_channel_destinations"
  ADD CONSTRAINT "publishing_channel_destinations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."ai_controlled_publications"
  ADD CONSTRAINT "ai_controlled_publications_publishing_destination_fkey" FOREIGN KEY (publishing_destination_id) REFERENCES public.publishing_channel_destinations(id)
    ON DELETE RESTRICT;

ALTER TABLE "public"."publishing_provider_connections"
  ADD CONSTRAINT "publishing_provider_connections_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."publishing_provider_credentials"
  ADD CONSTRAINT "publishing_provider_credentials_connection_reference_fk" FOREIGN KEY (connection_id, id)
    REFERENCES public.publishing_provider_connections(id, credential_reference_id) ON DELETE CASCADE;

ALTER TABLE "public"."supplier_items"
  ADD CONSTRAINT "supplier_items_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."supplier_items"
  ADD CONSTRAINT "supplier_items_product_organization_fkey" FOREIGN KEY (product_id, organization_id) REFERENCES public.products(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."supplier_items"
  ADD CONSTRAINT "supplier_items_variant_organization_fkey" FOREIGN KEY (variant_id, organization_id) REFERENCES public.product_variants(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."supplier_items"
  ADD CONSTRAINT "supplier_items_supplier_organization_fkey" FOREIGN KEY (supplier_id, organization_id) REFERENCES public.suppliers(id, organization_id) ON DELETE CASCADE;

ALTER TABLE "public"."suppliers"
  ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX ai_agent_runs_agent_time_idx ON public.ai_agent_runs USING btree (agent_id, created_at DESC);

CREATE INDEX ai_agent_runs_org_time_idx ON public.ai_agent_runs USING btree (organization_id, created_at DESC);

CREATE INDEX ai_agent_runs_status_idx ON public.ai_agent_runs USING btree (organization_id, status);

CREATE INDEX ai_agent_steps_run_idx ON public.ai_agent_steps USING btree (run_id, step_number);

CREATE INDEX ai_agents_active_idx ON public.ai_agents USING btree (organization_id, is_active);

CREATE INDEX ai_agents_org_idx ON public.ai_agents USING btree (organization_id);

CREATE INDEX ai_controlled_actions_org_created_idx ON public.ai_controlled_actions USING btree (organization_id, created_at DESC);

CREATE INDEX ai_controlled_actions_org_status_created_idx ON public.ai_controlled_actions USING btree (organization_id, status, created_at DESC);

CREATE UNIQUE INDEX ai_controlled_publications_org_idempotency_uidx ON public.ai_controlled_publications USING btree (organization_id, idempotency_key);

CREATE INDEX ai_controlled_publications_org_status_created_idx ON public.ai_controlled_publications USING btree (organization_id, status, created_at DESC);

CREATE INDEX ai_controlled_publications_org_target_idx ON public.ai_controlled_publications USING btree (organization_id, target_id);

CREATE INDEX ai_conversation_messages_conversation_created_idx ON public.ai_conversation_messages USING btree (conversation_id, created_at, id);

CREATE INDEX ai_conversation_messages_owner_created_idx ON public.ai_conversation_messages USING btree (organization_id, user_id, created_at DESC);

CREATE INDEX ai_conversations_owner_recent_idx ON public.ai_conversations USING btree (organization_id, user_id, archived_at, last_message_at DESC);

CREATE INDEX ai_credit_ledger_org_created_idx ON public.ai_credit_ledger USING btree (organization_id, created_at DESC);

CREATE UNIQUE INDEX ai_credit_ledger_usage_unique ON public.ai_credit_ledger USING btree (usage_id)
  WHERE (usage_id IS NOT NULL);

CREATE UNIQUE INDEX ai_memories_owner_active_key_idx ON public.ai_memories USING btree (organization_id, user_id, memory_type, memory_key)
  WHERE (archived_at IS NULL);

CREATE INDEX ai_memories_owner_recent_idx ON public.ai_memories USING btree (organization_id, user_id, archived_at, updated_at DESC);

CREATE INDEX ai_memories_owner_type_idx ON public.ai_memories USING btree (organization_id, user_id, memory_type, archived_at);

CREATE INDEX ai_model_pricing_lookup_idx ON public.ai_model_pricing USING btree (PROVIDER, model, effective_from DESC);

CREATE INDEX ai_usage_ledger_org_created_idx ON public.ai_usage_ledger USING btree (organization_id, created_at DESC);

CREATE INDEX ai_usage_ledger_org_feature_created_idx ON public.ai_usage_ledger USING btree (organization_id, feature, created_at DESC);

CREATE INDEX ai_usage_ledger_source_idx ON public.ai_usage_ledger USING btree (source_kind, source_id)
  WHERE (source_id IS NOT NULL);

CREATE INDEX automation_actions_pending_idx ON public.automation_actions USING btree (organization_id, status, created_at DESC);

CREATE INDEX automation_actions_run_idx ON public.automation_actions USING btree (run_id);

CREATE INDEX automation_rules_active_idx ON public.automation_rules USING btree (organization_id, is_active);

CREATE INDEX automation_rules_org_idx ON public.automation_rules USING btree (organization_id);

CREATE INDEX automation_rules_target_idx ON public.automation_rules USING btree (organization_id, price_monitor_target_id);

CREATE INDEX automation_runs_org_time_idx ON public.automation_runs USING btree (organization_id, created_at DESC);

CREATE INDEX automation_runs_rule_time_idx ON public.automation_runs USING btree (rule_id, created_at DESC);

CREATE INDEX automation_runs_status_idx ON public.automation_runs USING btree (organization_id, status);

CREATE UNIQUE INDEX billing_checkout_entitlement_activations_checkout_key ON public.billing_checkout_entitlement_activations USING btree (checkout_session_id);

CREATE INDEX billing_checkout_entitlement_activations_org_created_idx ON public.billing_checkout_entitlement_activations USING btree (organization_id, created_at DESC);

CREATE INDEX billing_checkout_entitlement_activations_status_idx ON public.billing_checkout_entitlement_activations USING btree (status, created_at);

CREATE INDEX billing_checkout_sessions_org_created_idx ON public.billing_checkout_sessions USING btree (organization_id, created_at DESC);

CREATE UNIQUE INDEX billing_checkout_sessions_provider_external_session_key ON public.billing_checkout_sessions USING btree (PROVIDER, external_session_id)
  WHERE ((external_session_id IS NOT NULL) AND (btrim(external_session_id) <> ''::text));

CREATE UNIQUE INDEX billing_checkout_sessions_provider_reference_key ON public.billing_checkout_sessions USING btree (PROVIDER, reference_id);

CREATE UNIQUE INDEX billing_checkout_sessions_provider_transaction_key ON public.billing_checkout_sessions USING btree (PROVIDER, provider_transaction_id)
  WHERE ((provider_transaction_id IS NOT NULL) AND (btrim(provider_transaction_id) <> ''::text));

CREATE INDEX billing_checkout_sessions_status_idx ON public.billing_checkout_sessions USING btree (status, created_at);

CREATE INDEX billing_events_org_time_idx ON public.billing_events USING btree (organization_id, created_at DESC);

CREATE UNIQUE INDEX billing_events_provider_external_key ON public.billing_events USING btree (PROVIDER, external_event_id)
  WHERE (external_event_id IS NOT NULL);

CREATE INDEX billing_plans_active_idx ON public.billing_plans USING btree (is_active, sort_order);

CREATE INDEX billing_usage_org_period_idx ON public.billing_usage USING btree (organization_id, period_start DESC);

CREATE INDEX categories_organization_id_idx ON public.categories USING btree (organization_id);

CREATE UNIQUE INDEX categories_organization_lower_name_key ON public.categories USING btree (organization_id, lower(btrim(name)));

CREATE INDEX customers_email_idx ON public.customers USING btree (email);

CREATE INDEX customers_organization_id_idx ON public.customers USING btree (organization_id);

CREATE INDEX inventory_movements_org_type_created_idx ON public.inventory_movements USING btree (organization_id, movement_type, created_at DESC);

CREATE INDEX inventory_movements_organization_created_at_idx ON public.inventory_movements USING btree (organization_id, created_at DESC);

CREATE INDEX inventory_movements_product_created_at_idx ON public.inventory_movements USING btree (product_id, created_at DESC)
  WHERE (product_id IS NOT NULL);

CREATE INDEX inventory_movements_reference_idx ON public.inventory_movements USING btree (reference_type, reference_id)
  WHERE (reference_id IS NOT NULL);

CREATE INDEX inventory_movements_variant_created_at_idx ON public.inventory_movements USING btree (variant_id, created_at DESC)
  WHERE (variant_id IS NOT NULL);

CREATE UNIQUE INDEX marketplace_accounts_org_provider_shop_key ON public.marketplace_accounts USING btree (organization_id, lower(btrim(PROVIDER)), external_shop_id)
  WHERE (external_shop_id IS NOT NULL);

CREATE INDEX marketplace_accounts_organization_id_idx ON public.marketplace_accounts USING btree (organization_id);

CREATE INDEX marketplace_accounts_organization_status_idx ON public.marketplace_accounts USING btree (organization_id, status);

CREATE UNIQUE INDEX marketplace_authorized_shops_account_external_shop_uidx ON public.marketplace_authorized_shops USING btree (marketplace_account_id, external_shop_id);

CREATE UNIQUE INDEX marketplace_authorized_shops_one_selected_per_account_uidx ON public.marketplace_authorized_shops USING btree (marketplace_account_id)
  WHERE is_selected;

CREATE INDEX marketplace_authorized_shops_org_account_idx ON public.marketplace_authorized_shops USING btree (organization_id, marketplace_account_id, status);

CREATE INDEX marketplace_catalog_products_account_seen_idx ON public.marketplace_catalog_products USING btree (marketplace_account_id, last_seen_at DESC);

CREATE UNIQUE INDEX marketplace_catalog_products_shop_external_uidx ON public.marketplace_catalog_products USING btree (authorized_shop_id, external_product_id);

CREATE INDEX marketplace_catalog_skus_org_product_idx ON public.marketplace_catalog_skus USING btree (organization_id, catalog_product_id);

CREATE UNIQUE INDEX marketplace_catalog_skus_product_external_uidx ON public.marketplace_catalog_skus USING btree (catalog_product_id, external_sku_id);

CREATE INDEX marketplace_connections_org_status_idx ON public.marketplace_connections USING btree (organization_id, status);

CREATE UNIQUE INDEX marketplace_external_order_items_order_line_uidx ON public.marketplace_external_order_items USING btree (external_order_id, external_line_item_id);

CREATE INDEX marketplace_external_order_items_org_order_idx ON public.marketplace_external_order_items USING btree (organization_id, external_order_id);

CREATE INDEX marketplace_external_orders_account_update_idx ON public.marketplace_external_orders
  USING btree (marketplace_account_id, external_update_time DESC NULLS LAST, last_seen_at DESC);

CREATE UNIQUE INDEX marketplace_external_orders_shop_external_uidx ON public.marketplace_external_orders USING btree (authorized_shop_id, external_order_id);

CREATE INDEX marketplace_listings_account_id_idx ON public.marketplace_listings USING btree (marketplace_account_id);

CREATE UNIQUE INDEX marketplace_listings_account_product_key ON public.marketplace_listings USING btree (organization_id, marketplace_account_id, product_id)
  WHERE (target_type = 'product'::text);

CREATE UNIQUE INDEX marketplace_listings_account_variant_key ON public.marketplace_listings USING btree (organization_id, marketplace_account_id, variant_id)
  WHERE (target_type = 'variant'::text);

CREATE UNIQUE INDEX marketplace_listings_external_id_key ON public.marketplace_listings USING btree (organization_id, marketplace_account_id, external_listing_id)
  WHERE (external_listing_id IS NOT NULL);

CREATE INDEX marketplace_listings_organization_id_idx ON public.marketplace_listings USING btree (organization_id);

CREATE INDEX marketplace_listings_product_id_idx ON public.marketplace_listings USING btree (product_id)
  WHERE (product_id IS NOT NULL);

CREATE INDEX marketplace_listings_variant_id_idx ON public.marketplace_listings USING btree (variant_id)
  WHERE (variant_id IS NOT NULL);

CREATE INDEX marketplace_oauth_states_expiry_idx ON public.marketplace_oauth_states USING btree (expires_at)
  WHERE (used_at IS NULL);

CREATE INDEX marketplace_order_links_account_id_idx ON public.marketplace_order_links USING btree (marketplace_account_id);

CREATE UNIQUE INDEX marketplace_order_links_external_order_key ON public.marketplace_order_links USING btree (organization_id, marketplace_account_id, external_order_id);

CREATE UNIQUE INDEX marketplace_order_links_internal_order_key ON public.marketplace_order_links USING btree (organization_id, order_id);

CREATE INDEX marketplace_order_links_order_id_idx ON public.marketplace_order_links USING btree (order_id);

CREATE INDEX marketplace_order_links_organization_id_idx ON public.marketplace_order_links USING btree (organization_id);

CREATE INDEX marketplace_sync_logs_account_created_idx ON public.marketplace_sync_logs USING btree (marketplace_account_id, created_at DESC);

CREATE INDEX marketplace_sync_logs_organization_id_idx ON public.marketplace_sync_logs USING btree (organization_id);

CREATE INDEX marketplace_sync_logs_status_idx ON public.marketplace_sync_logs USING btree (organization_id, status);

CREATE INDEX marketplace_webhook_events_account_received_idx ON public.marketplace_webhook_events USING btree (marketplace_account_id, received_at DESC);

CREATE INDEX marketplace_webhook_events_processing_idx ON public.marketplace_webhook_events USING btree (processing_status, received_at);

CREATE UNIQUE INDEX marketplace_webhook_events_provider_dedupe_uidx ON public.marketplace_webhook_events USING btree (PROVIDER, dedupe_key);

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);

CREATE INDEX order_items_product_id_idx ON public.order_items USING btree (product_id);

CREATE INDEX order_items_variant_id_idx ON public.order_items USING btree (variant_id)
  WHERE (variant_id IS NOT NULL);

CREATE INDEX orders_created_at_idx ON public.orders USING btree (created_at DESC);

CREATE INDEX orders_customer_id_idx ON public.orders USING btree (customer_id);

CREATE INDEX orders_organization_completed_at_idx ON public.orders USING btree (organization_id, completed_at DESC)
  WHERE (status = 'completed'::text);

CREATE INDEX orders_organization_id_idx ON public.orders USING btree (organization_id);

CREATE INDEX orders_status_idx ON public.orders USING btree (status);

CREATE INDEX organization_members_organization_idx ON public.organization_members USING btree (organization_id);

CREATE INDEX organization_members_user_idx ON public.organization_members USING btree (user_id);

CREATE INDEX organization_subscriptions_plan_idx ON public.organization_subscriptions USING btree (plan_id);

CREATE UNIQUE INDEX organization_subscriptions_provider_subscription_key ON public.organization_subscriptions USING btree (PROVIDER, provider_subscription_id)
  WHERE ((provider_subscription_id IS NOT NULL) AND (btrim(provider_subscription_id) <> ''::text));

CREATE INDEX organization_subscriptions_status_idx ON public.organization_subscriptions USING btree (status);

CREATE INDEX price_monitor_targets_active_idx ON public.price_monitor_targets USING btree (organization_id, is_active);

CREATE INDEX price_monitor_targets_org_idx ON public.price_monitor_targets USING btree (organization_id);

CREATE INDEX price_monitor_targets_product_idx ON public.price_monitor_targets USING btree (organization_id, product_id)
  WHERE (product_id IS NOT NULL);

CREATE INDEX price_monitor_targets_variant_idx ON public.price_monitor_targets USING btree (organization_id, variant_id)
  WHERE (variant_id IS NOT NULL);

CREATE INDEX price_observations_alert_idx ON public.price_observations USING btree (organization_id, threshold_triggered, observed_at DESC);

CREATE INDEX price_observations_org_time_idx ON public.price_observations USING btree (organization_id, observed_at DESC);

CREATE INDEX price_observations_target_time_idx ON public.price_observations USING btree (target_id, observed_at DESC);

CREATE INDEX product_description_generations_org_idx ON public.product_description_generations USING btree (organization_id);

CREATE INDEX product_description_generations_product_created_idx ON public.product_description_generations USING btree (product_id, created_at DESC);

CREATE INDEX product_description_generations_status_idx ON public.product_description_generations USING btree (organization_id, status);

CREATE UNIQUE INDEX product_images_one_primary_per_product_idx ON public.product_images USING btree (organization_id, product_id)
  WHERE (is_primary = true);

CREATE INDEX product_images_organization_idx ON public.product_images USING btree (organization_id);

CREATE INDEX product_images_product_order_idx ON public.product_images USING btree (organization_id, product_id, sort_order, created_at);

CREATE INDEX product_research_ai_runs_item_created_idx ON public.product_research_ai_runs USING btree (research_item_id, created_at DESC);

CREATE INDEX product_research_ai_runs_org_idx ON public.product_research_ai_runs USING btree (organization_id);

CREATE INDEX product_research_ai_runs_status_idx ON public.product_research_ai_runs USING btree (organization_id, status);

CREATE INDEX product_research_items_linked_product_idx ON public.product_research_items USING btree (linked_product_id)
  WHERE (linked_product_id IS NOT NULL);

CREATE INDEX product_research_items_opportunity_score_idx ON public.product_research_items USING btree (organization_id, opportunity_score DESC)
  WHERE (opportunity_score IS NOT NULL);

CREATE INDEX product_research_items_organization_id_idx ON public.product_research_items USING btree (organization_id);

CREATE INDEX product_research_items_organization_status_idx ON public.product_research_items USING btree (organization_id, status);

CREATE INDEX product_research_observations_item_idx ON public.product_research_observations USING btree (research_item_id, observed_at DESC);

CREATE INDEX product_research_observations_organization_id_idx ON public.product_research_observations USING btree (organization_id);

CREATE INDEX product_variants_organization_id_idx ON public.product_variants USING btree (organization_id);

CREATE UNIQUE INDEX product_variants_organization_lower_sku_key ON public.product_variants USING btree (organization_id, lower(btrim(sku)));

CREATE INDEX product_variants_product_id_idx ON public.product_variants USING btree (product_id);

CREATE INDEX products_category_id_idx ON public.products USING btree (category_id);

CREATE INDEX products_organization_id_idx ON public.products USING btree (organization_id);

CREATE UNIQUE INDEX products_organization_lower_sku_key ON public.products USING btree (organization_id, lower(btrim(sku)))
  WHERE (sku IS NOT NULL);

CREATE INDEX products_status_idx ON public.products USING btree (status);

CREATE UNIQUE INDEX publishing_channel_destinations_one_selected_provider_uidx ON public.publishing_channel_destinations USING btree (organization_id, PROVIDER)
  WHERE (is_selected AND (status = 'active'::text));

CREATE UNIQUE INDEX publishing_channel_destinations_org_provider_external_uidx ON public.publishing_channel_destinations
  USING btree (organization_id, PROVIDER, external_destination_id);

CREATE INDEX publishing_channel_destinations_org_status_idx ON public.publishing_channel_destinations USING btree (organization_id, status, created_at DESC);

CREATE INDEX publishing_provider_connections_org_provider_idx ON public.publishing_provider_connections USING btree (organization_id, PROVIDER, authorization_status);

CREATE INDEX supplier_items_organization_id_idx ON public.supplier_items USING btree (organization_id);

CREATE UNIQUE INDEX supplier_items_preferred_product_key ON public.supplier_items USING btree (organization_id, product_id)
  WHERE ((target_type = 'product'::text) AND (is_preferred = true));

CREATE UNIQUE INDEX supplier_items_preferred_variant_key ON public.supplier_items USING btree (organization_id, variant_id)
  WHERE ((target_type = 'variant'::text) AND (is_preferred = true));

CREATE INDEX supplier_items_product_id_idx ON public.supplier_items USING btree (product_id)
  WHERE (product_id IS NOT NULL);

CREATE INDEX supplier_items_supplier_id_idx ON public.supplier_items USING btree (supplier_id);

CREATE UNIQUE INDEX supplier_items_supplier_product_key ON public.supplier_items USING btree (organization_id, supplier_id, product_id)
  WHERE (target_type = 'product'::text);

CREATE UNIQUE INDEX supplier_items_supplier_variant_key ON public.supplier_items USING btree (organization_id, supplier_id, variant_id)
  WHERE (target_type = 'variant'::text);

CREATE INDEX supplier_items_variant_id_idx ON public.supplier_items USING btree (variant_id)
  WHERE (variant_id IS NOT NULL);

CREATE INDEX suppliers_organization_id_idx ON public.suppliers USING btree (organization_id);

CREATE UNIQUE INDEX suppliers_organization_lower_name_key ON public.suppliers USING btree (organization_id, lower(btrim(name)));

CREATE INDEX suppliers_organization_status_idx ON public.suppliers USING btree (organization_id, status);

CREATE TRIGGER ai_business_profiles_set_updated_at
  BEFORE UPDATE ON public.ai_business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ai_business_profile_updated_at();

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_category_updated_at();

CREATE TRIGGER product_images_prepare
  BEFORE INSERT OR UPDATE OF organization_id, product_id, sort_order, is_primary, alt_text ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_product_image();

CREATE TRIGGER product_images_repair_primary
  AFTER DELETE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.repair_product_primary_image();

CREATE TRIGGER product_variants_inventory_stock_movement
  AFTER INSERT OR UPDATE OF stock ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.record_inventory_stock_movement();

CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_variant_updated_at();

CREATE TRIGGER product_variants_sku_namespace_guard
  BEFORE INSERT OR UPDATE OF organization_id, sku ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_inventory_sku_namespace();

CREATE TRIGGER products_category_organization_guard
  BEFORE INSERT OR UPDATE OF organization_id, category_id ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_category_organization();

CREATE TRIGGER products_inventory_stock_movement
  AFTER INSERT OR UPDATE OF stock ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.record_inventory_stock_movement();

CREATE TRIGGER products_sku_namespace_guard
  BEFORE INSERT OR UPDATE OF organization_id, sku ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_inventory_sku_namespace();

CREATE POLICY "Members can view AI agent runs" ON "public"."ai_agent_runs"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can view AI agent steps" ON "public"."ai_agent_steps"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create AI agents" ON "public"."ai_agents"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete AI agents" ON "public"."ai_agents"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update AI agents" ON "public"."ai_agents"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view AI agents" ON "public"."ai_agents"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "ai_business_profiles_insert_member" ON "public"."ai_business_profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.is_organization_member(organization_id) AND (created_by = auth.uid()) AND (updated_by = auth.uid())));

CREATE POLICY "ai_business_profiles_select_member" ON "public"."ai_business_profiles"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "ai_business_profiles_update_member" ON "public"."ai_business_profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK ((public.is_organization_member(organization_id) AND (updated_by = auth.uid())));

CREATE POLICY "Owners and admins can view controlled AI actions" ON "public"."ai_controlled_actions"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organization_members m
  WHERE ((m.organization_id = ai_controlled_actions.organization_id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));

CREATE POLICY "ai_conversation_messages_insert_own" ON "public"."ai_conversation_messages"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = auth.uid()) AND public.is_organization_member(organization_id) AND (EXISTS ( SELECT 1
   FROM public.ai_conversations c
  WHERE
    ((c.id = ai_conversation_messages.conversation_id) AND (c.organization_id = ai_conversation_messages.organization_id) AND (c.user_id = ai_conversation_messages.user_id) AND
    (c.user_id = auth.uid()) AND (c.archived_at IS NULL))))));

CREATE POLICY "ai_conversation_messages_select_own" ON "public"."ai_conversation_messages"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = auth.uid()) AND public.is_organization_member(organization_id)));

CREATE POLICY "ai_conversations_insert_own" ON "public"."ai_conversations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = auth.uid()) AND public.is_organization_member(organization_id)));

CREATE POLICY "ai_conversations_select_own" ON "public"."ai_conversations"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = auth.uid()) AND public.is_organization_member(organization_id)));

CREATE POLICY "ai_conversations_update_own" ON "public"."ai_conversations"
  FOR UPDATE
  TO "authenticated"
  USING (((user_id = auth.uid()) AND public.is_organization_member(organization_id)))
  WITH CHECK (((user_id = auth.uid()) AND public.is_organization_member(organization_id)));

CREATE POLICY "ai_memories_delete_own" ON "public"."ai_memories"
  FOR DELETE
  TO "authenticated"
  USING (((user_id = auth.uid()) AND public.is_organization_member(organization_id)));

CREATE POLICY "ai_memories_insert_own" ON "public"."ai_memories"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = auth.uid()) AND public.is_organization_member(organization_id) AND ((source_conversation_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.ai_conversations c
  WHERE ((c.id = ai_memories.source_conversation_id) AND (c.organization_id = ai_memories.organization_id) AND (c.user_id = ai_memories.user_id) AND (c.user_id = auth.uid())))))));

CREATE POLICY "ai_memories_select_own" ON "public"."ai_memories"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = auth.uid()) AND public.is_organization_member(organization_id)));

CREATE POLICY "ai_memories_update_own" ON "public"."ai_memories"
  FOR UPDATE
  TO "authenticated"
  USING (((user_id = auth.uid()) AND public.is_organization_member(organization_id)))
  WITH CHECK (((user_id = auth.uid()) AND public.is_organization_member(organization_id) AND ((source_conversation_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.ai_conversations c
  WHERE ((c.id = ai_memories.source_conversation_id) AND (c.organization_id = ai_memories.organization_id) AND (c.user_id = ai_memories.user_id) AND (c.user_id = auth.uid())))))));

CREATE POLICY "Members can view automation actions" ON "public"."automation_actions"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create automation rules" ON "public"."automation_rules"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete automation rules" ON "public"."automation_rules"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update automation rules" ON "public"."automation_rules"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view automation rules" ON "public"."automation_rules"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can view automation runs" ON "public"."automation_runs"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can view billing events" ON "public"."billing_events"
  FOR SELECT
  TO "authenticated"
  USING (((organization_id IS NOT NULL) AND public.is_organization_member(organization_id)));

CREATE POLICY "Authenticated users can view billing plans" ON "public"."billing_plans"
  FOR SELECT
  TO "authenticated"
  USING (is_active);

CREATE POLICY "Members can view billing usage" ON "public"."billing_usage"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization categories" ON "public"."categories"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization categories" ON "public"."categories"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization categories" ON "public"."categories"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization categories" ON "public"."categories"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization customers" ON "public"."customers"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization customers" ON "public"."customers"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization customers" ON "public"."customers"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization customers" ON "public"."customers"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization inventory movements" ON "public"."inventory_movements"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization marketplace accounts" ON "public"."marketplace_accounts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization marketplace accounts" ON "public"."marketplace_accounts"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization marketplace accounts" ON "public"."marketplace_accounts"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization marketplace accounts" ON "public"."marketplace_accounts"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization marketplace listings" ON "public"."marketplace_listings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization marketplace listings" ON "public"."marketplace_listings"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization marketplace listings" ON "public"."marketplace_listings"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization marketplace listings" ON "public"."marketplace_listings"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization marketplace order links" ON "public"."marketplace_order_links"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization marketplace order links" ON "public"."marketplace_order_links"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization marketplace order links" ON "public"."marketplace_order_links"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization marketplace order links" ON "public"."marketplace_order_links"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization marketplace sync logs" ON "public"."marketplace_sync_logs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization marketplace sync logs" ON "public"."marketplace_sync_logs"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization order items" ON "public"."order_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND public.is_organization_member(orders.organization_id)))));

CREATE POLICY "Members can delete organization order items" ON "public"."order_items"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND public.is_organization_member(orders.organization_id)))));

CREATE POLICY "Members can update organization order items" ON "public"."order_items"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND public.is_organization_member(orders.organization_id)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND public.is_organization_member(orders.organization_id)))));

CREATE POLICY "Members can view organization order items" ON "public"."order_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND public.is_organization_member(orders.organization_id)))));

CREATE POLICY "Members can create organization orders" ON "public"."orders"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization orders" ON "public"."orders"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization orders" ON "public"."orders"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization orders" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Users can view organization members" ON "public"."organization_members"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization subscription" ON "public"."organization_subscriptions"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Users can view their organizations" ON "public"."organizations"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(id));

CREATE POLICY "Members can create price monitor targets" ON "public"."price_monitor_targets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete price monitor targets" ON "public"."price_monitor_targets"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update price monitor targets" ON "public"."price_monitor_targets"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view price monitor targets" ON "public"."price_monitor_targets"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can view price observations" ON "public"."price_observations"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization description generations" ON "public"."product_description_generations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization description generations" ON "public"."product_description_generations"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization description generations" ON "public"."product_description_generations"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization description generations" ON "public"."product_description_generations"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization product images" ON "public"."product_images"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization product images" ON "public"."product_images"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization product images" ON "public"."product_images"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization product images" ON "public"."product_images"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization AI research" ON "public"."product_research_ai_runs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization AI research" ON "public"."product_research_ai_runs"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization AI research" ON "public"."product_research_ai_runs"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization AI research" ON "public"."product_research_ai_runs"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization product research" ON "public"."product_research_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization product research" ON "public"."product_research_items"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization product research" ON "public"."product_research_items"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization product research" ON "public"."product_research_items"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization research observations" ON "public"."product_research_observations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization research observations" ON "public"."product_research_observations"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization research observations" ON "public"."product_research_observations"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization research observations" ON "public"."product_research_observations"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization product variants" ON "public"."product_variants"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization product variants" ON "public"."product_variants"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization product variants" ON "public"."product_variants"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization product variants" ON "public"."product_variants"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization products" ON "public"."products"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization products" ON "public"."products"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization products" ON "public"."products"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization products" ON "public"."products"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization supplier items" ON "public"."supplier_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization supplier items" ON "public"."supplier_items"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization supplier items" ON "public"."supplier_items"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization supplier items" ON "public"."supplier_items"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create organization suppliers" ON "public"."suppliers"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete organization suppliers" ON "public"."suppliers"
  FOR DELETE
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can update organization suppliers" ON "public"."suppliers"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_organization_member(organization_id))
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can view organization suppliers" ON "public"."suppliers"
  FOR SELECT
  TO "authenticated"
  USING (public.is_organization_member(organization_id));

COMMENT ON COLUMN "public"."ai_controlled_publications"."destination_type" IS 'NULL for SG4 contract v1 marketplace shop proposals. For SG5 contract v2, one of account/page/channel.';

COMMENT ON COLUMN "public"."ai_controlled_publications"."external_shop_id" IS 'Backward-compatible physical snapshot column. SG4 contract v1 stores external shop id; SG5 contract v2 stores external publishing destination id.';

COMMENT ON COLUMN "public"."ai_controlled_publications"."legacy_authorized_shop_id" IS 'Generated typed FK for SG4 contract v1 rows. Preserves marketplace_authorized_shops referential integrity after target_id becomes polymorphic.';

COMMENT ON COLUMN "public"."ai_controlled_publications"."publishing_destination_id" IS 'Generated typed FK for SG5 contract v2 rows. Preserves publishing_channel_destinations referential integrity while target_id remains the generic target snapshot.';

COMMENT ON COLUMN "public"."publishing_provider_connections"."credential_reference_id" IS 'Stable non-secret credential reference retained across revoke and reauthorization.';

COMMENT ON COLUMN "public"."publishing_provider_credentials"."access_token_ciphertext" IS 'Opaque application-encrypted access-token ciphertext. Never expose through client RPCs.';

COMMENT ON COLUMN "public"."publishing_provider_credentials"."refresh_token_ciphertext" IS 'Opaque application-encrypted refresh-token ciphertext. Never expose through client RPCs.';

COMMENT ON CONSTRAINT "ai_controlled_actions_product_price_payload_check" ON "public"."ai_controlled_actions" IS 'product.update_price stores canonical numeric(12,2) before/after price snapshots in generic mutation fields.';

COMMENT ON CONSTRAINT "ai_controlled_actions_product_status_payload_check" ON "public"."ai_controlled_actions" IS 'product.update_status stores an exact active/inactive before/after snapshot in generic mutation fields.';

COMMENT ON FUNCTION "public"."activate_billing_checkout_entitlement"(uuid) IS 'Idempotently activates or renews paid organization entitlement from an authoritative completed billing checkout without inventing a recurring provider subscription id.';

COMMENT ON FUNCTION "public"."attach_billing_checkout_provider_session"(uuid, text, text, timestamp with time zone) IS 'Attaches a payment-provider session/token and checkout URL to a previously persisted checkout attempt.';

COMMENT ON FUNCTION "public"."claim_billing_checkout_intent"(uuid, text, text, text, jsonb) IS 'Provider-neutral checkout intent claim. Reuses ready sessions, serializes fresh provider-session creation, and bounds stale created-session reclamation before any external payment-provider call.';

COMMENT ON FUNCTION "public"."confirm_ai_controlled_action"(uuid) IS 'Explicit same-requester owner/admin confirmation for a controlled AI action.';

COMMENT ON FUNCTION "public"."confirm_ai_controlled_publication"(uuid) IS 'Explicit same-requester owner/admin confirmation for SG4 legacy or SG5 channel-target controlled publications. Revalidates the corresponding destination identity and capability. Does not publish externally.';

COMMENT ON FUNCTION "public"."create_billing_checkout_session"(uuid, text, text, text, text, jsonb) IS 'Creates or reuses an idempotent server-side checkout session while resolving authoritative commercial pricing from billing_plans.';

COMMENT ON FUNCTION "public"."execute_ai_controlled_action"(uuid) IS 'Executes a confirmed product description action exactly once using exact description compare-and-set.';

COMMENT ON FUNCTION "public"."execute_ai_controlled_action_dispatch"(uuid) IS 'Dispatches execution from the persisted immutable action_type to the matching controlled executor. It does not accept an action type from the client.';

COMMENT ON FUNCTION "public"."execute_ai_controlled_product_name_action"(uuid) IS 'Executes an explicitly confirmed product.update_name action using exact product-name compare-and-set.';

COMMENT ON FUNCTION "public"."execute_ai_controlled_product_price_action"(uuid) IS 'Executes an explicitly confirmed product.update_price action using exact numeric product-price compare-and-set.';

COMMENT ON FUNCTION "public"."execute_ai_controlled_product_status_action"(uuid) IS 'Executes an explicitly confirmed product.update_status action using exact product-status compare-and-set.';

COMMENT ON FUNCTION "public"."fail_billing_checkout_session"(uuid, text, jsonb) IS 'Marks a newly-created checkout attempt failed using a controlled internal failure classification.';

COMMENT ON FUNCTION "public"."get_ai_controlled_action"(uuid, uuid) IS 'Reads one owner/admin organization-scoped controlled AI action using an explicit safe projection for supported action types.';

COMMENT ON FUNCTION "public"."get_ai_controlled_actions"(uuid, integer, integer, text) IS 'Reads an owner/admin organization-scoped controlled AI action list using an explicit safe projection for LAKUVO Action Center.';

COMMENT ON FUNCTION "public"."get_publishing_channel_destinations"(uuid, text) IS 'Returns safe publishing destination metadata to authenticated organization members. Does not expose credentials or execute provider calls.';

COMMENT ON FUNCTION "public"."process_billing_checkout_payment_event"(uuid, text, text, text, text, text, numeric, text, text, jsonb) IS 'Atomically processes an authenticated checkout payment event against authoritative checkout amount/currency. Terminal outcomes require provider status API verification and do not directly mutate recurring subscriptions.';

COMMENT ON FUNCTION "public"."process_billing_subscription_event"(uuid, text, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp
  with time zone, boolean, jsonb) IS 'Atomically applies a normalized commercial subscription event and marks its billing inbox event processed.';

COMMENT ON FUNCTION "public"."propose_ai_controlled_product_description_action"(uuid, uuid, text, text, text) IS 'Creates or idempotently replays a persisted product description proposal. Does not mutate products.';

COMMENT ON FUNCTION "public"."propose_ai_controlled_product_name_action"(uuid, uuid, text, text, text) IS 'Creates or idempotently replays a product.update_name proposal. Does not mutate products.';

COMMENT ON FUNCTION "public"."propose_ai_controlled_product_price_action"(uuid, uuid, text, text, text) IS 'Creates or idempotently replays a product.update_price proposal. Does not mutate products. Price values are canonical decimal text.';

COMMENT ON FUNCTION "public"."propose_ai_controlled_product_status_action"(uuid, uuid, text, text, text) IS 'Creates or idempotently replays a product.update_status proposal. Does not mutate products.';

COMMENT ON FUNCTION "public"."propose_ai_controlled_publication"(uuid, uuid, text, text) IS 'Creates or idempotently replays a content.publish_text proposal for the currently selected authorized marketplace shop. Does not publish externally.';

COMMENT ON FUNCTION "public"."propose_ai_controlled_publication_channel"(uuid, uuid, text, text) IS 'Creates or idempotently replays a contract v2 content.publish_text proposal for a selected active publish_text-capable publishing channel destination. Does not publish externally.';

COMMENT ON FUNCTION "public"."provision_publishing_channel_destination"(uuid, text, text, text, text, text[]) IS 'Service-role-only idempotent provisioning of verified publishing destination metadata. Stores no credentials and performs no provider call.';

COMMENT ON FUNCTION "public"."record_billing_webhook_event"(uuid, text, text, text, jsonb) IS 'Records an authenticated provider billing webhook idempotently. Subscription mutation is intentionally separate.';

COMMENT ON FUNCTION "public"."revoke_publishing_channel_destination"(uuid, uuid) IS 'Service-role-only revocation of publishing destination metadata. Performs no provider call.';

COMMENT ON FUNCTION "public"."select_publishing_channel_destination"(uuid, uuid) IS 'Owner/admin selection of an already-provisioned active publishing destination. Cannot create or modify provider identity or capabilities.';

COMMENT ON TABLE "public"."ai_controlled_actions" IS 'Persisted human-controlled AI action lifecycle. Phase 17 initially supports only product.update_description.';

COMMENT ON TABLE "public"."ai_controlled_publications" IS 'SG4 controlled publication proposals. Stores user-reviewed publication intent and destination snapshot. Does not publish externally.';

COMMENT ON TABLE "public"."billing_checkout_entitlement_activations" IS 'Provider-neutral idempotency and audit ledger for completed checkout entitlement activation.';

COMMENT ON TABLE "public"."billing_checkout_sessions" IS 'Provider-neutral server-controlled billing checkout attempts. Price and currency are authoritative snapshots resolved from billing_plans.';

COMMENT ON TABLE "public"."publishing_channel_destinations" IS 'Provider-neutral safe publishing destination identities. Contains no provider credentials and grants no external execution authority.';

COMMENT ON TABLE "public"."publishing_provider_connections" IS 'Safe creator/social publishing connection metadata. Contains no OAuth token material.';

COMMENT ON TABLE "public"."publishing_provider_credentials" IS 'Server-only application-encrypted OAuth credential ciphertext.';

REVOKE ALL ON FUNCTION "public"."activate_billing_checkout_entitlement"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."activate_billing_checkout_entitlement"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."adjust_inventory"(uuid, integer, uuid, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."adjust_inventory"(uuid, integer, uuid, uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."append_ai_agent_step"(uuid, text, text, jsonb, jsonb, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."append_ai_agent_step"(uuid, text, text, jsonb, jsonb, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL
  ON FUNCTION "public"."apply_marketplace_connection_token_refresh"(uuid, uuid, uuid, text, text, text, timestamp WITH time zone, timestamp
    WITH time zone, text, integer, text[], text)
  FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."apply_marketplace_connection_token_refresh"(uuid, uuid, uuid, text, text, text, timestamp WITH time zone, timestamp
    WITH time zone, text, integer, text[], text)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."apply_marketplace_order_status_reconciliation"(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."apply_marketplace_order_status_reconciliation"(uuid, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."apply_product_description_generation"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."apply_product_description_generation"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."apply_product_research_ai_run"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."apply_product_research_ai_run"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."attach_billing_checkout_provider_session"(uuid, text, text, timestamp WITH time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."attach_billing_checkout_provider_session"(uuid, text, text, timestamp WITH time zone) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."bridge_marketplace_external_order"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."bridge_marketplace_external_order"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."check_ai_allowance"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."check_ai_allowance"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."claim_billing_checkout_intent"(uuid, text, text, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."claim_billing_checkout_intent"(uuid, text, text, text, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."claim_marketplace_webhook_events"(uuid, uuid, uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."claim_marketplace_webhook_events"(uuid, uuid, uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."complete_marketplace_webhook_event"(uuid, uuid, uuid, uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."complete_marketplace_webhook_event"(uuid, uuid, uuid, uuid, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."confirm_ai_controlled_action"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."confirm_ai_controlled_action"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."confirm_ai_controlled_publication"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."confirm_ai_controlled_publication"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."consume_marketplace_oauth_state"(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."consume_marketplace_oauth_state"(text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_billing_checkout_session"(uuid, text, text, text, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_billing_checkout_session"(uuid, text, text, text, text, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_default_organization"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_default_organization"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_initial_organization"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_initial_organization"(text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_marketplace_oauth_state"(uuid, uuid, uuid, text, text, timestamp WITH time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_marketplace_oauth_state"(uuid, uuid, uuid, text, text, timestamp WITH time zone) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_order"(uuid, uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_order"(uuid, uuid, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."enforce_inventory_sku_namespace"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."enforce_inventory_sku_namespace"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."enforce_product_category_organization"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."evaluate_automation_rule"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."evaluate_automation_rule"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."execute_ai_controlled_action"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."execute_ai_controlled_action"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."execute_ai_controlled_action_dispatch"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."execute_ai_controlled_action_dispatch"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."execute_ai_controlled_product_name_action"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."execute_ai_controlled_product_name_action"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."execute_ai_controlled_product_price_action"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."execute_ai_controlled_product_price_action"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."execute_ai_controlled_product_status_action"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."execute_ai_controlled_product_status_action"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."execute_automation_action"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."execute_automation_action"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."fail_billing_checkout_session"(uuid, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."fail_billing_checkout_session"(uuid, text, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."finish_ai_agent_run"(uuid, text, jsonb, text, text, jsonb, jsonb, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."finish_ai_agent_run"(uuid, text, jsonb, text, text, jsonb, jsonb, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_ai_controlled_action"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_ai_controlled_action"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_ai_controlled_actions"(uuid, integer, integer, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_ai_controlled_actions"(uuid, integer, integer, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_ai_controlled_publication"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_ai_controlled_publication"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_ai_controlled_publications"(uuid, integer, integer, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_ai_controlled_publications"(uuid, integer, integer, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_ai_usage_summary"(uuid, timestamp WITH time zone, timestamp WITH time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_ai_usage_summary"(uuid, timestamp WITH time zone, timestamp WITH time zone) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_billing_overview"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_billing_overview"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_commerce_analytics"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_commerce_analytics"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_inventory_alerts"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_inventory_alerts"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_inventory_intelligence"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_inventory_intelligence"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_authorized_shops"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_authorized_shops"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_catalog_products"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_catalog_products"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_connection_refresh_context"(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_connection_refresh_context"(uuid, uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_connection_secret"(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_connection_secret"(uuid, uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_connection_status"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_connection_status"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_external_order_bridge_readiness"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_external_order_bridge_readiness"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_external_orders"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_external_orders"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_order_status_reconciliation"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_order_status_reconciliation"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_order_sync_context"(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_order_sync_context"(uuid, uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_product_sync_context"(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_product_sync_context"(uuid, uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_marketplace_webhook_events"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_marketplace_webhook_events"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_product_performance"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_product_performance"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_publishing_channel_destinations"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_publishing_channel_destinations"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_publishing_provider_connections"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_publishing_provider_connections"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_publishing_provider_execution_credentials"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_publishing_provider_execution_credentials"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_sales_performance_summary"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_sales_performance_summary"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_sales_trend"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_sales_trend"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_organization_member"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_organization_member"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."prepare_product_image"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."prepare_product_image"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."process_billing_checkout_payment_event"(uuid, text, text, text, text, text, numeric, text, text, jsonb) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."process_billing_checkout_payment_event"(uuid, text, text, text, text, text, numeric, text, text, jsonb)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL
  ON FUNCTION "public"."process_billing_subscription_event"(uuid, text, text, text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, timestamp
    WITH time zone, boolean, jsonb)
  FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."process_billing_subscription_event"(uuid, text, text, text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, timestamp
    WITH time zone, boolean, jsonb)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."propose_ai_controlled_product_description_action"(uuid, uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."propose_ai_controlled_product_description_action"(uuid, uuid, text, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."propose_ai_controlled_product_name_action"(uuid, uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."propose_ai_controlled_product_name_action"(uuid, uuid, text, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."propose_ai_controlled_product_price_action"(uuid, uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."propose_ai_controlled_product_price_action"(uuid, uuid, text, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."propose_ai_controlled_product_status_action"(uuid, uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."propose_ai_controlled_product_status_action"(uuid, uuid, text, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."propose_ai_controlled_publication"(uuid, uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."propose_ai_controlled_publication"(uuid, uuid, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."propose_ai_controlled_publication_channel"(uuid, uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."propose_ai_controlled_publication_channel"(uuid, uuid, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."provision_publishing_channel_destination"(uuid, text, text, text, text, text[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."provision_publishing_channel_destination"(uuid, text, text, text, text, text[]) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."record_ai_usage"(uuid, uuid, text, text, text, text, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, jsonb) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."record_ai_usage"(uuid, uuid, text, text, text, text, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, jsonb)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."record_billing_webhook_event"(uuid, text, text, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."record_billing_webhook_event"(uuid, text, text, text, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."record_inventory_stock_movement"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."record_inventory_stock_movement"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."record_marketplace_webhook_event"(text, text, text, text, integer, text, text, timestamp WITH time zone, text, jsonb) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."record_marketplace_webhook_event"(text, text, text, text, integer, text, text, timestamp WITH time zone, text, jsonb)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."record_price_observation"(uuid, numeric, text, timestamp WITH time zone, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."record_price_observation"(uuid, numeric, text, timestamp WITH time zone, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."refresh_billing_usage"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."refresh_billing_usage"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."reorder_product_images"(uuid, uuid, uuid[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."reorder_product_images"(uuid, uuid, uuid[]) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."repair_product_primary_image"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."repair_product_primary_image"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."revoke_publishing_channel_destination"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."revoke_publishing_channel_destination"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."revoke_publishing_provider_connection"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."revoke_publishing_provider_connection"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."select_marketplace_authorized_shop"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."select_marketplace_authorized_shop"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."select_publishing_channel_destination"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."select_publishing_channel_destination"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_ai_business_profile_updated_at"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_ai_business_profile_updated_at"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_category_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_low_stock_threshold"(uuid, integer, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_low_stock_threshold"(uuid, integer, uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_primary_product_image"(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_primary_product_image"(uuid, uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_product_variant_updated_at"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_product_variant_updated_at"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."start_ai_agent_run"(uuid, text, jsonb, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."start_ai_agent_run"(uuid, text, jsonb, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."sync_marketplace_authorized_shops"(uuid, uuid, uuid, text, jsonb, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sync_marketplace_authorized_shops"(uuid, uuid, uuid, text, jsonb, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_order_status"(uuid, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_order_status"(uuid, uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."upsert_marketplace_catalog_page"(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."upsert_marketplace_catalog_page"(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL
  ON FUNCTION "public"."upsert_marketplace_connection"(uuid, uuid, uuid, text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, text[], integer, jsonb)
  FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."upsert_marketplace_connection"(uuid, uuid, uuid, text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, text[], integer, jsonb)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."upsert_marketplace_external_order_page"(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."upsert_marketplace_external_order_page"(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)
  TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL
  ON FUNCTION "public"."upsert_publishing_provider_connection"(uuid, text, text, uuid, text[], text[], text, text, timestamp WITH time zone, timestamp WITH time zone, text, text)
  FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."upsert_publishing_provider_connection"(uuid, text, text, uuid, text[], text[], text, text, timestamp WITH time zone, timestamp WITH time zone, text, text)
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_agent_runs" TO "anon";

REVOKE ALL ON TABLE "public"."ai_agent_runs" FROM "authenticated";

GRANT SELECT ON TABLE "public"."ai_agent_runs" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_agent_runs" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_agent_steps" TO "anon";

REVOKE ALL ON TABLE "public"."ai_agent_steps" FROM "authenticated";

GRANT SELECT ON TABLE "public"."ai_agent_steps" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_agent_steps" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_agents" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_business_profiles" TO "anon";

REVOKE ALL ON TABLE "public"."ai_business_profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."ai_business_profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_business_profiles" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_controlled_actions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_controlled_publications" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_conversation_messages" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_conversations" TO "anon";

REVOKE ALL ("archived_at") ON TABLE "public"."ai_conversations" FROM "authenticated";

GRANT UPDATE ("archived_at") ON TABLE "public"."ai_conversations" TO "authenticated";

REVOKE ALL ("last_message_at") ON TABLE "public"."ai_conversations" FROM "authenticated";

GRANT UPDATE ("last_message_at") ON TABLE "public"."ai_conversations" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."ai_conversations" FROM "authenticated";

GRANT UPDATE ("title") ON TABLE "public"."ai_conversations" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."ai_conversations" FROM "authenticated";

GRANT UPDATE ("updated_at") ON TABLE "public"."ai_conversations" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_conversations" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_credit_ledger" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_memories" TO "anon";

REVOKE ALL ON TABLE "public"."ai_memories" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."ai_memories" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_memories" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_model_pricing" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_usage_ledger" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."automation_actions" TO "anon";

REVOKE ALL ON TABLE "public"."automation_actions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."automation_actions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."automation_actions" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."automation_rules" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."automation_runs" TO "anon";

REVOKE ALL ON TABLE "public"."automation_runs" FROM "authenticated";

GRANT SELECT ON TABLE "public"."automation_runs" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."automation_runs" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."billing_checkout_entitlement_activations"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_checkout_sessions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_events" TO "anon";

REVOKE ALL ON TABLE "public"."billing_events" FROM "authenticated";

GRANT SELECT ON TABLE "public"."billing_events" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_events" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_plans" TO "anon";

REVOKE ALL ON TABLE "public"."billing_plans" FROM "authenticated";

GRANT SELECT ON TABLE "public"."billing_plans" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_plans" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_usage" TO "anon";

REVOKE ALL ON TABLE "public"."billing_usage" FROM "authenticated";

GRANT SELECT ON TABLE "public"."billing_usage" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_usage" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "anon";

REVOKE ALL ON TABLE "public"."categories" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."categories" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_movements" TO "anon";

REVOKE ALL ON TABLE "public"."inventory_movements" FROM "authenticated";

GRANT SELECT ON TABLE "public"."inventory_movements" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_movements" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_accounts" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."marketplace_authorized_shops"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."marketplace_catalog_products"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_catalog_skus" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_connections" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."marketplace_external_order_items"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_external_orders" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_listings" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_oauth_states" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_order_links" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_sync_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_webhook_events" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "anon";

REVOKE ALL ON TABLE "public"."order_items" FROM "authenticated";

GRANT SELECT ON TABLE "public"."order_items" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "anon";

REVOKE ALL ON TABLE "public"."orders" FROM "authenticated";

GRANT SELECT ON TABLE "public"."orders" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_ai_controls" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_members" TO "anon";

REVOKE ALL ON TABLE "public"."organization_members" FROM "authenticated";

GRANT SELECT ON TABLE "public"."organization_members" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_members" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_subscriptions" TO "anon";

REVOKE ALL ON TABLE "public"."organization_subscriptions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."organization_subscriptions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_subscriptions" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "anon";

REVOKE ALL ON TABLE "public"."organizations" FROM "authenticated";

GRANT SELECT ON TABLE "public"."organizations" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."price_monitor_targets" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."price_observations" TO "anon";

REVOKE ALL ON TABLE "public"."price_observations" FROM "authenticated";

GRANT SELECT ON TABLE "public"."price_observations" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."price_observations" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."product_description_generations"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_images" TO "anon";

REVOKE ALL ON TABLE "public"."product_images" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."product_images" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_images" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_research_ai_runs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_research_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."product_research_observations"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_variants" TO "anon";

REVOKE ALL ON TABLE "public"."product_variants" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."product_variants" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_variants" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."publishing_channel_destinations"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."publishing_provider_connections"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."publishing_provider_credentials"
  TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."supplier_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suppliers" TO "anon", "authenticated", "postgres", "service_role";

ALTER TABLE "public"."ai_agents"
  ADD CONSTRAINT "ai_agents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."automation_rules"
  ADD CONSTRAINT "automation_rules_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."price_monitor_targets"
  ADD CONSTRAINT "price_monitor_targets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
