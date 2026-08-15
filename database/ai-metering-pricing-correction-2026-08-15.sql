-- AICommerceOS - GPT-5.6 pricing correction
-- Permanent correction for the pricing rows inserted earlier on 2026-08-15.
--
-- OpenAI announced lower Standard API prices effective 2026-07-30:
-- - GPT-5.6 Luna:  $0.20 input / $0.02 cached read / $0.25 cache write / $1.20 output
-- - GPT-5.6 Terra: $2.00 input / $0.20 cached read / $2.50 cache write / $12.00 output
-- - GPT-5.6 Sol:   unchanged at $5.00 / $0.50 / $6.25 / $30.00
--
-- Cache read uses the documented 90% discount.
-- GPT-5.6 cache writes are billed at 1.25x uncached input.
--
-- Existing rows are corrected in-place because AICommerceOS metering was not
-- integrated into the application yet, so these rows have not priced live runs.

begin;

update public.ai_model_pricing
set
  input_usd_per_million = 0.20,
  cached_input_usd_per_million = 0.02,
  cache_write_usd_per_million = 0.25,
  output_usd_per_million = 1.20,
  source_metadata = jsonb_build_object(
    'basis', 'standard',
    'effective_date', '2026-07-30',
    'corrected_on', '2026-08-15',
    'source', 'OpenAI API platform / GPT-5.6 pricing update'
  )
where provider = 'openai'
  and model = 'gpt-5.6-luna'
  and effective_from = '2026-08-15 00:00:00+00';

update public.ai_model_pricing
set
  input_usd_per_million = 2.00,
  cached_input_usd_per_million = 0.20,
  cache_write_usd_per_million = 2.50,
  output_usd_per_million = 12.00,
  source_metadata = jsonb_build_object(
    'basis', 'standard',
    'effective_date', '2026-07-30',
    'corrected_on', '2026-08-15',
    'source', 'OpenAI API platform / GPT-5.6 pricing update'
  )
where provider = 'openai'
  and model = 'gpt-5.6-terra'
  and effective_from = '2026-08-15 00:00:00+00';

update public.ai_model_pricing
set
  input_usd_per_million = 5.00,
  cached_input_usd_per_million = 0.50,
  cache_write_usd_per_million = 6.25,
  output_usd_per_million = 30.00,
  source_metadata = jsonb_build_object(
    'basis', 'standard',
    'effective_date', '2026-07-30',
    'corrected_on', '2026-08-15',
    'source', 'OpenAI API platform / GPT-5.6 pricing update'
  )
where provider = 'openai'
  and model = 'gpt-5.6-sol'
  and effective_from = '2026-08-15 00:00:00+00';

commit;

-- Verification (read-only)
select
  provider,
  model,
  input_usd_per_million,
  cached_input_usd_per_million,
  cache_write_usd_per_million,
  output_usd_per_million,
  source_metadata
from public.ai_model_pricing
where provider = 'openai'
  and model in (
    'gpt-5.6-luna',
    'gpt-5.6-terra',
    'gpt-5.6-sol'
  )
order by model;
