import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

const baseline = await readFile(new URL('../../supabase/migrations/20260901080831_production_schema_baseline.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../../supabase/migrations/20261004001000_marketplace_server_rpc_boundary.sql', import.meta.url), 'utf8');
const names = ['create_marketplace_oauth_state', 'consume_marketplace_oauth_state',
  'get_marketplace_connection_secret', 'get_marketplace_connection_refresh_context',
  'upsert_marketplace_connection', 'apply_marketplace_connection_token_refresh', 'sync_marketplace_authorized_shops'];
const org = '11111111-1111-4111-8111-111111111111';
const account = '22222222-2222-4222-8222-222222222222';
const member = '33333333-3333-4333-8333-333333333333';
const other = '44444444-4444-4444-8444-444444444444';
const url = process.env.LAKUVO_MARKETPLACE_TEST_DATABASE_URL;
if (url) {
  const u = new URL(url);
  if (!['postgres:', 'postgresql:'].includes(u.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) ||
      u.pathname !== '/lakuvo_test_marketplace') {
    throw new Error('Tests require a loopback disposable database lakuvo_test_marketplace.');
  }
}
const exec = (db, sql) => db.exec ? db.exec(sql) : db.query(sql);
function definition(source, name) {
  const start = source.indexOf(`CREATE OR REPLACE FUNCTION public.${name} (`);
  assert.ok(start >= 0, name);
  const end = source.indexOf('$function$;', start);
  assert.ok(end > start);
  return source.slice(start, end + '$function$;'.length);
}
const fixture = async (db, provider = 'shopee') => {
  await exec(db, `reset role;
    select set_config('request.jwt.claim.role','service_role',false);
    truncate marketplace_oauth_states, marketplace_authorized_shops, marketplace_sync_logs,
      marketplace_connections, marketplace_accounts, organization_members;
    insert into organization_members(organization_id,user_id) values('${org}','${member}');
    insert into marketplace_accounts(id,organization_id,provider,name) values('${account}','${org}','${provider}','Synthetic shop');
    insert into marketplace_connections(organization_id,marketplace_account_id,provider,open_id,
      access_token_ciphertext,refresh_token_ciphertext,access_token_expires_at,refresh_token_expires_at,user_type)
    values('${org}','${account}','${provider}','123','synthetic-access','synthetic-refresh',
      now()+interval '4 hours',${provider === 'shopee' ? 'null' : "now()+interval '30 days'"},${provider === 'shopee' ? 'null' : '0'});`);
};
const refresh = (db, overrides = {}) => db.query(`select public.apply_marketplace_connection_token_refresh(
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) as result`, [
  org, account, member, 'synthetic-refresh', 'replacement-access', 'replacement-refresh',
  new Date(Date.now() + 3600_000).toISOString(), null, '123', null, [], 'synthetic-request',
].map((v, i) => Object.hasOwn(overrides, i) ? overrides[i] : v));
const upsert = (db, user = member) => db.query(`select public.upsert_marketplace_connection(
  $1,$2,$3,'shopee','123','new-access','new-refresh',now()+interval '4 hours',null,'{}',null,'{}') as id`, [org, account, user]);
const sync = (db, provider = 'shopee', cipher = null) => db.query(`select public.sync_marketplace_authorized_shops($1,$2,$3,$4,$5,$6) as count`,
  [org, account, member, provider, JSON.stringify([{ external_shop_id: '123', name: 'Synthetic shop', shop_cipher_ciphertext: cipher }]), 'synthetic-request']);
const denied = (promise, message) => assert.rejects(promise, e => e.code === '42501' && (!message || e.message.includes(message)));

test('Marketplace server RPC boundary', async t => {
  const db = url ? new pg.Client({ connectionString: url }) : new PGlite();
  if (url) await db.connect();
  try {
    await t.test('reviewed function bodies and signatures are preserved except the added role guard', () => {
      const guard = "  if coalesce(auth.role(), '') <> 'service_role' then\n    raise exception 'service_role_required' using errcode = '42501';\n  end if;\n";
      for (const name of names) {
        const original = definition(baseline, name).replace(/\r\n/g, '\n');
        let changed = definition(migration, name).replace(/\r\n/g, '\n');
        assert.equal(changed.split(guard).length, 2, name);
        changed = changed.replace(guard, '');
        if (original.includes('LANGUAGE sql')) {
          changed = changed.replace('LANGUAGE plpgsql', 'LANGUAGE sql')
            .replace('AS $function$\nbegin\n  return query\n', 'AS $function$\n')
            .replace('end;\n$function$;', '$function$;');
        }
        assert.equal(changed, original, name);
      }
    });
    await exec(db, `create role anon; create role authenticated; create role service_role;
      create schema auth;
      create function auth.role() returns text language sql stable as
        'select current_setting(''request.jwt.claim.role'',true)';
      grant usage on schema auth to anon,authenticated,service_role;`);
    for (const table of ['organization_members', 'marketplace_accounts', 'marketplace_connections',
      'marketplace_oauth_states', 'marketplace_authorized_shops', 'marketplace_sync_logs']) {
      const sql = baseline.match(new RegExp(`CREATE TABLE "public"\\."${table}" \\([\\s\\S]*?\\n\\);`))?.[0];
      assert.ok(sql, table);
      await exec(db, sql);
      await exec(db, `alter table public.${table} enable row level security;`);
    }
    await exec(db, 'create unique index shops_account_external on marketplace_authorized_shops(marketplace_account_id,external_shop_id);');
    // Actual baseline definitions and grants, only in a disposable local database.
    for (const name of names) {
      await exec(db, definition(baseline, name));
      const grant = baseline.match(new RegExp(`GRANT EXECUTE\\s+ON FUNCTION "public"\\."${name}"[\\s\\S]*?;`))?.[0];
      assert.ok(grant, name);
      await exec(db, grant.replace(/"postgres",\s*/g, ''));
    }
    await fixture(db);
    await t.test('baseline reproduction: anon RPC bypasses direct-table RLS with a supplied member ID', async () => {
      await exec(db, `grant select on marketplace_connections to anon; set role anon;
        select set_config('request.jwt.claim.role','anon',false);`);
      assert.equal(Number((await db.query('select count(*) as n from marketplace_connections')).rows[0].n), 0);
      const rows = (await db.query('select * from get_marketplace_connection_refresh_context($1,$2,$3)', [org, account, member])).rows;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].access_token_ciphertext, 'synthetic-access');
      await exec(db, 'reset role;');
    });
    await exec(db, migration);
    const catalog = async () => (await db.query(`select p.proname as name,p.oid,
      pg_get_function_identity_arguments(p.oid) as args,p.prosecdef as definer,
      has_function_privilege('anon',p.oid,'EXECUTE') as anon,
      has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated,
      has_function_privilege('service_role',p.oid,'EXECUTE') as server
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname=any($1) order by p.proname`, [names])).rows;
    const rows = await catalog();
    await t.test('all seven exact RPCs retain definer and server access; browser access is revoked', () => {
      assert.equal(rows.length, 7);
      for (const row of rows) {
        assert.equal(row.definer, true, row.name);
        assert.equal(row.server, true, row.name);
        assert.equal(row.anon, false, row.name);
        assert.equal(row.authenticated, false, row.name);
      }
    });
    for (const role of ['anon', 'authenticated']) {
      await t.test(`${role} cannot invoke any credential/state/mutation RPC`, async () => {
        await exec(db, `set role ${role}; select set_config('request.jwt.claim.role','${role}',false);`);
        for (const row of rows) {
          const count = (await db.query('select pronargs from pg_proc where oid=$1', [row.oid])).rows[0].pronargs;
          await denied(db.query(`select public.${row.name}(${Array(count).fill('null').join(',')})`));
        }
        await exec(db, 'reset role;');
      });
    }
    for (const role of ['anon', 'authenticated']) {
      await t.test(`internal role guard still denies ${role} after accidental execute grants`, async () => {
        for (const row of rows) await exec(db, `grant execute on function public.${row.name}(${row.args}) to ${role};`);
        await exec(db, `set role ${role}; select set_config('request.jwt.claim.role','${role}',false);`);
        for (const row of rows) {
          const count = (await db.query('select pronargs from pg_proc where oid=$1', [row.oid])).rows[0].pronargs;
          await denied(db.query(`select public.${row.name}(${Array(count).fill('null').join(',')})`), 'service_role_required');
        }
        await exec(db, 'reset role;');
        for (const row of rows) await exec(db, `revoke execute on function public.${row.name}(${row.args}) from ${role};`);
      });
    }
    await t.test('missing JWT role fails closed even for a function owner', async () => {
      await exec(db, "select set_config('request.jwt.claim.role','',false)");
      await denied(db.query('select * from get_marketplace_connection_secret($1,$2,$3)', [org, account, member]), 'service_role_required');
    });
    await fixture(db);
    await t.test('service-role reads preserve membership boundaries and credential contracts', async () => {
      await exec(db, `set role service_role; select set_config('request.jwt.claim.role','service_role',false);`);
      for (const name of ['get_marketplace_connection_secret', 'get_marketplace_connection_refresh_context']) {
        assert.equal((await db.query(`select * from ${name}($1,$2,$3)`, [org, account, member])).rows.length, 1);
        assert.equal((await db.query(`select * from ${name}($1,$2,$3)`, [org, account, other])).rows.length, 0);
        assert.equal((await db.query(`select * from ${name}($1,$2,$3)`, [other, account, member])).rows.length, 0);
      }
      await exec(db, 'reset role;');
    });
    await t.test('service-role OAuth state can be created and consumed exactly once', async () => {
      await fixture(db);
      await exec(db, 'set role service_role;');
      const hash = 'a'.repeat(64);
      await db.query("select create_marketplace_oauth_state($1,$2,$3,'shopee',$4,now()+interval '10 minutes')", [org, account, member, hash]);
      assert.equal((await db.query("select * from consume_marketplace_oauth_state($1,'shopee')", [hash])).rows.length, 1);
      assert.equal((await db.query("select * from consume_marketplace_oauth_state($1,'shopee')", [hash])).rows.length, 0);
    });
    await t.test('service-role connection upsert works and nonmembers remain rejected', async () => {
      await fixture(db);
      await exec(db, 'set role service_role;');
      assert.ok((await upsert(db)).rows[0].id);
      await assert.rejects(upsert(db, other), /not an organization member/);
      await exec(db, 'reset role;');
      const row = (await db.query('select provider,access_token_ciphertext from marketplace_connections')).rows[0];
      assert.equal(row.provider, 'shopee');
      assert.equal(row.access_token_ciphertext, 'new-access');
    });
    await t.test('Shopee token rotation remains atomic and preserves optimistic concurrency/identity checks', async () => {
      await fixture(db);
      await exec(db, 'set role service_role;');
      assert.equal((await refresh(db, { 3: 'wrong-expected' })).rows[0].result, false);
      await assert.rejects(refresh(db, { 8: '456' }), /identity does not match/);
      assert.equal((await refresh(db)).rows[0].result, true);
      await exec(db, 'reset role;');
      const row = (await db.query('select access_token_ciphertext,refresh_token_ciphertext from marketplace_connections')).rows[0];
      assert.deepEqual(row, { access_token_ciphertext: 'replacement-access', refresh_token_ciphertext: 'replacement-refresh' });
    });
    await t.test('Shopee shop sync works without a TikTok cipher and rejects provider mismatch', async () => {
      await fixture(db);
      await exec(db, 'set role service_role;');
      assert.equal(Number((await sync(db)).rows[0].count), 1);
      await assert.rejects(sync(db, 'tiktok_shop', 'synthetic-shop-cipher'), /provider does not match/);
    });
    await t.test('shared TikTok Shop token refresh retains seller and expiry invariants', async () => {
      await fixture(db, 'tiktok_shop');
      await exec(db, 'set role service_role;');
      await assert.rejects(refresh(db), /refresh token expiry must be in the future/);
      const future = new Date(Date.now() + 86400_000).toISOString();
      await assert.rejects(refresh(db, { 7: future, 9: 1 }), /not a seller authorization/);
      assert.equal((await refresh(db, { 7: future, 9: 0 })).rows[0].result, true);
    });
    await t.test('shared TikTok Shop sync still requires encrypted shop cipher', async () => {
      await fixture(db, 'tiktok_shop');
      await exec(db, 'set role service_role;');
      await assert.rejects(sync(db, 'tiktok_shop'), /requires encrypted shop cipher/);
      assert.equal(Number((await sync(db, 'tiktok_shop', 'synthetic-shop-cipher')).rows[0].count), 1);
    });
    await t.test('migration can be reapplied without restoring browser access', async () => {
      await exec(db, 'reset role;');
      await exec(db, migration);
      for (const row of await catalog()) {
        assert.equal(row.anon, false); assert.equal(row.authenticated, false); assert.equal(row.server, true);
      }
    });
    await t.test('marketplace sync job persistence is durable, isolated, and RPC-only', async () => {
      await fixture(db, 'tiktok_shop');

      await exec(db, `
        create or replace function auth.uid()
        returns uuid
        language sql
        stable
        as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      `);

      await exec(
        db,
        definition(
          baseline,
          'is_organization_member',
        ),
      );

      await exec(db, `
        revoke all
        on function public.is_organization_member(uuid)
        from public;

        grant execute
        on function public.is_organization_member(uuid)
        to anon, authenticated, service_role;
      `);

      const syncJobMigration = await readFile(
        new URL(
          '../../supabase/migrations/20261027070000_marketplace_sync_job_persistence.sql',
          import.meta.url,
        ),
        'utf8',
      );

      await exec(db, syncJobMigration);

      await exec(db, `
        insert into marketplace_authorized_shops(
          organization_id,
          marketplace_account_id,
          provider,
          external_shop_id,
          name,
          shop_cipher_ciphertext,
          status,
          is_selected
        )
        values(
          '${org}',
          '${account}',
          'tiktok_shop',
          'synthetic-shop',
          'Synthetic TikTok shop',
          'synthetic-shop-cipher',
          'active',
          true
        );
      `);

      const relation = (
        await db.query(`
          select
            c.relrowsecurity as rls
          from pg_class c
          join pg_namespace n
            on n.oid = c.relnamespace
          where n.nspname = 'public'
            and c.relname = 'marketplace_sync_jobs'
        `)
      ).rows[0];

      assert.equal(
        relation.rls,
        true,
      );

      const indexNames = (
        await db.query(`
          select indexname
          from pg_indexes
          where schemaname = 'public'
            and tablename =
              'marketplace_sync_jobs'
        `)
      ).rows.map(
        row => row.indexname,
      );

      assert.ok(
        indexNames.includes(
          'marketplace_sync_jobs_one_active_per_account_entity_uidx',
        ),
      );

      assert.ok(
        indexNames.includes(
          'marketplace_sync_jobs_queue_idx',
        ),
      );

      const tablePrivileges = (
        await db.query(`
          select
            has_table_privilege(
              'anon',
              'public.marketplace_sync_jobs',
              'SELECT'
            ) as anon_select,
            has_table_privilege(
              'authenticated',
              'public.marketplace_sync_jobs',
              'SELECT'
            ) as authenticated_select,
            has_table_privilege(
              'authenticated',
              'public.marketplace_sync_jobs',
              'INSERT'
            ) as authenticated_insert,
            has_table_privilege(
              'service_role',
              'public.marketplace_sync_jobs',
              'SELECT'
            ) as service_select,
            has_table_privilege(
              'service_role',
              'public.marketplace_sync_jobs',
              'INSERT'
            ) as service_insert
        `)
      ).rows[0];

      assert.equal(
        tablePrivileges.anon_select,
        false,
      );

      assert.equal(
        tablePrivileges.authenticated_select,
        true,
      );

      assert.equal(
        tablePrivileges.authenticated_insert,
        false,
      );

      assert.equal(
        tablePrivileges.service_select,
        true,
      );

      assert.equal(
        tablePrivileges.service_insert,
        false,
      );

      const rpc = (
        await db.query(`
          select
            p.oid,
            p.prosecdef as definer,
            has_function_privilege(
              'anon',
              p.oid,
              'EXECUTE'
            ) as anon,
            has_function_privilege(
              'authenticated',
              p.oid,
              'EXECUTE'
            ) as authenticated,
            has_function_privilege(
              'service_role',
              p.oid,
              'EXECUTE'
            ) as server
          from pg_proc p
          join pg_namespace n
            on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.proname =
              'enqueue_marketplace_sync_job'
        `)
      ).rows[0];

      assert.equal(
        rpc.definer,
        true,
      );

      assert.equal(
        rpc.anon,
        false,
      );

      assert.equal(
        rpc.authenticated,
        false,
      );

      assert.equal(
        rpc.server,
        true,
      );

      const enqueue = (
        provider = 'tiktok_shop',
        entity = 'products',
        requestedBy = member,
        cursorKind = null,
        cursorValue = null,
      ) =>
        db.query(
          `
            select
              public.enqueue_marketplace_sync_job(
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                '{}'::jsonb
              ) as id
          `,
          [
            org,
            account,
            requestedBy,
            provider,
            entity,
            cursorKind,
            cursorValue,
          ],
        );

      await exec(db, `
        set role service_role;
        select set_config(
          'request.jwt.claim.role',
          'service_role',
          false
        );
      `);

      const firstJob =
        (await enqueue()).rows[0].id;

      const replayJob =
        (await enqueue()).rows[0].id;

      assert.equal(
        replayJob,
        firstJob,
      );

      const productJobs = (
        await db.query(`
          select
            provider,
            entity,
            status,
            authorized_shop_id,
            processed_count,
            attempt_count,
            max_attempts
          from marketplace_sync_jobs
          where id = $1
        `, [firstJob])
      ).rows;

      assert.equal(
        productJobs.length,
        1,
      );

      assert.equal(
        productJobs[0].provider,
        'tiktok_shop',
      );

      assert.equal(
        productJobs[0].entity,
        'products',
      );

      assert.equal(
        productJobs[0].status,
        'queued',
      );

      assert.ok(
        productJobs[0].authorized_shop_id,
      );

      assert.equal(
        Number(
          productJobs[0].processed_count,
        ),
        0,
      );

      assert.equal(
        Number(
          productJobs[0].attempt_count,
        ),
        0,
      );

      assert.equal(
        Number(
          productJobs[0].max_attempts,
        ),
        5,
      );

      const shopJob =
        (
          await enqueue(
            'tiktok_shop',
            'shops',
          )
        ).rows[0].id;

      const shopTarget = (
        await db.query(`
          select authorized_shop_id
          from marketplace_sync_jobs
          where id = $1
        `, [shopJob])
      ).rows[0];

      assert.equal(
        shopTarget.authorized_shop_id,
        null,
      );

      await assert.rejects(
        enqueue(
          'shopee',
          'products',
        ),
        /unsupported marketplace sync provider\/entity/,
      );

      await assert.rejects(
        enqueue(
          'lazada',
          'shops',
        ),
        /unsupported marketplace sync provider/,
      );

      await assert.rejects(
        enqueue(
          'tiktok_shop',
          'orders',
          other,
        ),
        /not an organization member/,
      );

      await assert.rejects(
        enqueue(
          'tiktok_shop',
          'orders',
          member,
          'page_token',
          null,
        ),
        /cursor kind and value must be provided together/,
      );

      await assert.rejects(
        db.query(`
          insert into marketplace_sync_jobs(
            organization_id,
            marketplace_account_id,
            provider,
            entity
          )
          values(
            $1,
            $2,
            'tiktok_shop',
            'shops'
          )
        `, [org, account]),
      );

      await exec(db, `
        reset role;
        set role authenticated;
        select set_config(
          'request.jwt.claim.role',
          'authenticated',
          false
        );
        select set_config(
          'request.jwt.claim.sub',
          '${member}',
          false
        );
      `);

      assert.equal(
        Number(
          (
            await db.query(`
              select count(*) as n
              from marketplace_sync_jobs
            `)
          ).rows[0].n,
        ),
        2,
      );

      await assert.rejects(
        db.query(`
          insert into marketplace_sync_jobs(
            organization_id,
            marketplace_account_id,
            provider,
            entity
          )
          values(
            $1,
            $2,
            'tiktok_shop',
            'shops'
          )
        `, [org, account]),
      );

      await exec(db, `
        select set_config(
          'request.jwt.claim.sub',
          '${other}',
          false
        );
      `);

      assert.equal(
        Number(
          (
            await db.query(`
              select count(*) as n
              from marketplace_sync_jobs
            `)
          ).rows[0].n,
        ),
        0,
      );

      await exec(db, `
        reset role;
        set role anon;
        select set_config(
          'request.jwt.claim.role',
          'anon',
          false
        );
      `);

      await assert.rejects(
        db.query(`
          select *
          from marketplace_sync_jobs
        `),
      );

      await assert.rejects(
        db.query(`
          select public.enqueue_marketplace_sync_job(
            $1,
            $2,
            $3,
            'tiktok_shop',
            'shops',
            null,
            null,
            '{}'::jsonb
          )
        `, [
          org,
          account,
          member,
        ]),
      );

      await exec(db, 'reset role;');
    });
    const lifecycleMigration = await readFile(
      new URL(
        '../../supabase/migrations/20261027080000_marketplace_sync_job_lifecycle.sql',
        import.meta.url,
      ),
      'utf8',
    );

    await exec(
      db,
      lifecycleMigration,
    );

    const lifecycleNames = [
      'claim_marketplace_sync_job',
      'complete_marketplace_sync_job_page',
      'fail_marketplace_sync_job_attempt',
    ];

    const lifecycleFixture = async () => {
      await exec(db, `
        reset role;
        select set_config(
          'request.jwt.claim.role',
          'service_role',
          false
        );

        truncate
          marketplace_sync_jobs,
          marketplace_authorized_shops,
          marketplace_sync_logs,
          marketplace_oauth_states,
          marketplace_connections,
          marketplace_accounts,
          organization_members;

        insert into organization_members(
          organization_id,
          user_id
        )
        values(
          '${org}',
          '${member}'
        );

        insert into marketplace_accounts(
          id,
          organization_id,
          provider,
          name
        )
        values(
          '${account}',
          '${org}',
          'tiktok_shop',
          'Synthetic TikTok shop'
        );

        insert into marketplace_connections(
          organization_id,
          marketplace_account_id,
          provider,
          open_id,
          access_token_ciphertext,
          refresh_token_ciphertext,
          access_token_expires_at,
          refresh_token_expires_at,
          user_type
        )
        values(
          '${org}',
          '${account}',
          'tiktok_shop',
          '123',
          'synthetic-access',
          'synthetic-refresh',
          now() + interval '4 hours',
          now() + interval '30 days',
          0
        );

        insert into marketplace_authorized_shops(
          organization_id,
          marketplace_account_id,
          provider,
          external_shop_id,
          name,
          shop_cipher_ciphertext,
          status,
          is_selected
        )
        values(
          '${org}',
          '${account}',
          'tiktok_shop',
          'synthetic-shop',
          'Synthetic TikTok shop',
          'synthetic-shop-cipher',
          'active',
          true
        );

        set role service_role;

        select set_config(
          'request.jwt.claim.role',
          'service_role',
          false
        );
      `);
    };

    const enqueueLifecycleJob = async (
      entity = 'products',
    ) => (
      await db.query(
        `
          select
            public.enqueue_marketplace_sync_job(
              $1,
              $2,
              $3,
              'tiktok_shop',
              $4,
              null,
              null,
              '{}'::jsonb
            ) as id
        `,
        [
          org,
          account,
          member,
          entity,
        ],
      )
    ).rows[0].id;

    const claimLifecycleJob = (
      jobId = null,
    ) =>
      db.query(
        `
          select *
          from public.claim_marketplace_sync_job(
            $1
          )
        `,
        [
          jobId,
        ],
      );

    const completeLifecyclePage = (
      jobId,
      leaseToken,
      syncedCount,
      totalCount,
      cursorKind,
      cursorValue,
      requestId,
    ) =>
      db.query(
        `
          select
            public.complete_marketplace_sync_job_page(
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7
            ) as status
        `,
        [
          jobId,
          leaseToken,
          syncedCount,
          totalCount,
          cursorKind,
          cursorValue,
          requestId,
        ],
      );

    const failLifecycleAttempt = (
      jobId,
      leaseToken,
      errorCode,
      errorMessage,
      retryable,
    ) =>
      db.query(
        `
          select
            public.fail_marketplace_sync_job_attempt(
              $1,
              $2,
              $3,
              $4,
              $5
            ) as status
        `,
        [
          jobId,
          leaseToken,
          errorCode,
          errorMessage,
          retryable,
        ],
      );

    const resumeServiceRole = async () => {
      await exec(db, `
        set role service_role;

        select set_config(
          'request.jwt.claim.role',
          'service_role',
          false
        );
      `);
    };

    await t.test(
      'marketplace sync lifecycle RPCs are service-role-only and internally guarded',
      async () => {
        const rows = (
          await db.query(
            `
              select
                p.proname as name,
                p.oid,
                pg_get_function_identity_arguments(
                  p.oid
                ) as args,
                pg_get_functiondef(
                  p.oid
                ) as definition,
                p.prosecdef as definer,
                has_function_privilege(
                  'anon',
                  p.oid,
                  'EXECUTE'
                ) as anon,
                has_function_privilege(
                  'authenticated',
                  p.oid,
                  'EXECUTE'
                ) as authenticated,
                has_function_privilege(
                  'service_role',
                  p.oid,
                  'EXECUTE'
                ) as server
              from pg_proc p
              join pg_namespace n
                on n.oid = p.pronamespace
              where
                n.nspname = 'public'
                and p.proname = any($1)
              order by p.proname
            `,
            [
              lifecycleNames,
            ],
          )
        ).rows;

        assert.equal(
          rows.length,
          3,
        );

        for (const row of rows) {
          assert.equal(
            row.definer,
            true,
            row.name,
          );

          assert.equal(
            row.anon,
            false,
            row.name,
          );

          assert.equal(
            row.authenticated,
            false,
            row.name,
          );

          assert.equal(
            row.server,
            true,
            row.name,
          );

          assert.ok(
            row.definition.includes(
              'service_role_required',
            ),
            row.name,
          );
        }

        const claimDefinition =
          rows.find(
            row =>
              row.name ===
              'claim_marketplace_sync_job',
          ).definition;

        assert.ok(
          claimDefinition
            .toUpperCase()
            .includes(
              'FOR UPDATE SKIP LOCKED',
            ),
        );

        for (
          const role of [
            'anon',
            'authenticated',
          ]
        ) {
          await exec(
            db,
            'reset role;',
          );

          for (const row of rows) {
            await exec(
              db,
              `
                grant execute
                on function public.${row.name}(${row.args})
                to ${role};
              `,
            );
          }

          await exec(db, `
            set role ${role};

            select set_config(
              'request.jwt.claim.role',
              '${role}',
              false
            );
          `);

          for (const row of rows) {
            const count = (
              await db.query(
                `
                  select pronargs
                  from pg_proc
                  where oid = $1
                `,
                [
                  row.oid,
                ],
              )
            ).rows[0].pronargs;

            await denied(
              db.query(
                `
                  select
                    public.${row.name}(
                      ${Array(count)
                        .fill('null')
                        .join(',')}
                    )
                `,
              ),
              'service_role_required',
            );
          }

          await exec(
            db,
            'reset role;',
          );

          for (const row of rows) {
            await exec(
              db,
              `
                revoke execute
                on function public.${row.name}(${row.args})
                from ${role};
              `,
            );
          }
        }
      },
    );

    await t.test(
      'marketplace sync claim and completion preserve lease ownership and cursor continuation',
      async () => {
        await lifecycleFixture();

        const jobId =
          await enqueueLifecycleJob(
            'products',
          );

        const firstClaim =
          (
            await claimLifecycleJob(
              jobId,
            )
          ).rows;

        assert.equal(
          firstClaim.length,
          1,
        );

        assert.equal(
          Number(
            firstClaim[0]
              .attempt_count,
          ),
          1,
        );

        assert.equal(
          firstClaim[0]
            .cursor_kind,
          null,
        );

        assert.ok(
          firstClaim[0]
            .lease_token,
        );

        const firstLease =
          firstClaim[0]
            .lease_token;

        assert.equal(
          (
            await claimLifecycleJob(
              jobId,
            )
          ).rows.length,
          0,
        );

        await assert.rejects(
          completeLifecyclePage(
            jobId,
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            2,
            250,
            'page_token',
            'next-page',
            'wrong-lease',
          ),
          /lease is stale or unavailable/,
        );

        await assert.rejects(
          completeLifecyclePage(
            jobId,
            firstLease,
            3,
            2,
            null,
            null,
            'bad-total',
          ),
          /total count cannot be smaller than synced count/,
        );

        const queued =
          (
            await completeLifecyclePage(
              jobId,
              firstLease,
              2,
              250,
              'page_token',
              'next-page',
              'request-1',
            )
          ).rows[0].status;

        assert.equal(
          queued,
          'queued',
        );

        const queuedRow =
          (
            await db.query(
              `
                select
                  status,
                  cursor_kind,
                  cursor_value,
                  processed_count,
                  total_count,
                  lease_token,
                  lease_expires_at,
                  last_request_id
                from marketplace_sync_jobs
                where id = $1
              `,
              [
                jobId,
              ],
            )
          ).rows[0];

        assert.equal(
          queuedRow.status,
          'queued',
        );

        assert.equal(
          queuedRow.cursor_kind,
          'page_token',
        );

        assert.equal(
          queuedRow.cursor_value,
          'next-page',
        );

        assert.equal(
          Number(
            queuedRow.processed_count,
          ),
          2,
        );

        assert.equal(
          Number(
            queuedRow.total_count,
          ),
          250,
        );

        assert.equal(
          queuedRow.lease_token,
          null,
        );

        assert.equal(
          queuedRow.lease_expires_at,
          null,
        );

        assert.equal(
          queuedRow.last_request_id,
          'request-1',
        );

        const secondClaim =
          (
            await claimLifecycleJob(
              jobId,
            )
          ).rows;

        assert.equal(
          secondClaim.length,
          1,
        );

        assert.equal(
          Number(
            secondClaim[0]
              .attempt_count,
          ),
          2,
        );

        assert.equal(
          secondClaim[0]
            .cursor_kind,
          'page_token',
        );

        assert.equal(
          secondClaim[0]
            .cursor_value,
          'next-page',
        );

        assert.notEqual(
          secondClaim[0]
            .lease_token,
          firstLease,
        );

        const succeeded =
          (
            await completeLifecyclePage(
              jobId,
              secondClaim[0]
                .lease_token,
              1,
              250,
              null,
              null,
              'request-2',
            )
          ).rows[0].status;

        assert.equal(
          succeeded,
          'succeeded',
        );

        const finalRow =
          (
            await db.query(
              `
                select
                  status,
                  processed_count,
                  total_count,
                  cursor_kind,
                  cursor_value,
                  lease_token,
                  lease_expires_at,
                  finished_at,
                  last_request_id
                from marketplace_sync_jobs
                where id = $1
              `,
              [
                jobId,
              ],
            )
          ).rows[0];

        assert.equal(
          finalRow.status,
          'succeeded',
        );

        assert.equal(
          Number(
            finalRow.processed_count,
          ),
          3,
        );

        assert.equal(
          Number(
            finalRow.total_count,
          ),
          250,
        );

        assert.equal(
          finalRow.cursor_kind,
          null,
        );

        assert.equal(
          finalRow.cursor_value,
          null,
        );

        assert.equal(
          finalRow.lease_token,
          null,
        );

        assert.equal(
          finalRow.lease_expires_at,
          null,
        );

        assert.ok(
          finalRow.finished_at,
        );

        assert.equal(
          finalRow.last_request_id,
          'request-2',
        );
      },
    );

    await t.test(
      'marketplace sync retry backoff and maximum attempts are durable',
      async () => {
        await lifecycleFixture();

        const jobId =
          await enqueueLifecycleJob(
            'orders',
          );

        await exec(
          db,
          'reset role;',
        );

        await db.query(
          `
            update marketplace_sync_jobs
            set max_attempts = 2
            where id = $1
          `,
          [
            jobId,
          ],
        );

        await resumeServiceRole();

        const firstClaim =
          (
            await claimLifecycleJob(
              jobId,
            )
          ).rows[0];

        const firstFailure =
          (
            await failLifecycleAttempt(
              jobId,
              firstClaim.lease_token,
              'provider_error',
              'temporary provider failure',
              true,
            )
          ).rows[0].status;

        assert.equal(
          firstFailure,
          'queued',
        );

        const retryRow =
          (
            await db.query(
              `
                select
                  status,
                  attempt_count,
                  available_at,
                  lease_token,
                  lease_expires_at,
                  last_error_code
                from marketplace_sync_jobs
                where id = $1
              `,
              [
                jobId,
              ],
            )
          ).rows[0];

        assert.equal(
          retryRow.status,
          'queued',
        );

        assert.equal(
          Number(
            retryRow.attempt_count,
          ),
          1,
        );

        assert.ok(
          new Date(
            retryRow.available_at,
          ).getTime() >
            Date.now(),
        );

        assert.equal(
          retryRow.lease_token,
          null,
        );

        assert.equal(
          retryRow.lease_expires_at,
          null,
        );

        assert.equal(
          retryRow.last_error_code,
          'provider_error',
        );

        assert.equal(
          (
            await claimLifecycleJob(
              null,
            )
          ).rows.length,
          0,
        );

        await exec(
          db,
          'reset role;',
        );

        await db.query(
          `
            update marketplace_sync_jobs
            set
              available_at =
                now() - interval '1 second'
            where id = $1
          `,
          [
            jobId,
          ],
        );

        await resumeServiceRole();

        const secondClaim =
          (
            await claimLifecycleJob(
              null,
            )
          ).rows[0];

        assert.equal(
          secondClaim.id,
          jobId,
        );

        assert.equal(
          Number(
            secondClaim.attempt_count,
          ),
          2,
        );

        const terminalFailure =
          (
            await failLifecycleAttempt(
              jobId,
              secondClaim.lease_token,
              'provider_error',
              'provider still unavailable',
              true,
            )
          ).rows[0].status;

        assert.equal(
          terminalFailure,
          'failed',
        );

        const failedRow =
          (
            await db.query(
              `
                select
                  status,
                  attempt_count,
                  lease_token,
                  lease_expires_at,
                  finished_at
                from marketplace_sync_jobs
                where id = $1
              `,
              [
                jobId,
              ],
            )
          ).rows[0];

        assert.equal(
          failedRow.status,
          'failed',
        );

        assert.equal(
          Number(
            failedRow.attempt_count,
          ),
          2,
        );

        assert.equal(
          failedRow.lease_token,
          null,
        );

        assert.equal(
          failedRow.lease_expires_at,
          null,
        );

        assert.ok(
          failedRow.finished_at,
        );
      },
    );

    await t.test(
      'marketplace sync expired leases can be reclaimed and exhausted leases fail closed',
      async () => {
        await lifecycleFixture();

        const reclaimJob =
          await enqueueLifecycleJob(
            'products',
          );

        const firstClaim =
          (
            await claimLifecycleJob(
              reclaimJob,
            )
          ).rows[0];

        await exec(
          db,
          'reset role;',
        );

        await db.query(
          `
            update marketplace_sync_jobs
            set
              lease_expires_at =
                now() - interval '1 second'
            where id = $1
          `,
          [
            reclaimJob,
          ],
        );

        await resumeServiceRole();

        const reclaimed =
          (
            await claimLifecycleJob(
              reclaimJob,
            )
          ).rows[0];

        assert.equal(
          Number(
            reclaimed.attempt_count,
          ),
          2,
        );

        assert.notEqual(
          reclaimed.lease_token,
          firstClaim.lease_token,
        );

        assert.equal(
          (
            await failLifecycleAttempt(
              reclaimJob,
              reclaimed.lease_token,
              'persistence_error',
              'synthetic stop',
              false,
            )
          ).rows[0].status,
          'failed',
        );

        const exhaustedJob =
          await enqueueLifecycleJob(
            'shops',
          );

        await exec(
          db,
          'reset role;',
        );

        await db.query(
          `
            update marketplace_sync_jobs
            set max_attempts = 1
            where id = $1
          `,
          [
            exhaustedJob,
          ],
        );

        await resumeServiceRole();

        const exhaustedClaim =
          (
            await claimLifecycleJob(
              exhaustedJob,
            )
          ).rows[0];

        assert.equal(
          Number(
            exhaustedClaim.attempt_count,
          ),
          1,
        );

        await exec(
          db,
          'reset role;',
        );

        await db.query(
          `
            update marketplace_sync_jobs
            set
              lease_expires_at =
                now() - interval '1 second'
            where id = $1
          `,
          [
            exhaustedJob,
          ],
        );

        await resumeServiceRole();

        assert.equal(
          (
            await claimLifecycleJob(
              exhaustedJob,
            )
          ).rows.length,
          0,
        );

        const exhaustedRow =
          (
            await db.query(
              `
                select
                  status,
                  attempt_count,
                  last_error_code,
                  lease_token,
                  lease_expires_at,
                  finished_at
                from marketplace_sync_jobs
                where id = $1
              `,
              [
                exhaustedJob,
              ],
            )
          ).rows[0];

        assert.equal(
          exhaustedRow.status,
          'failed',
        );

        assert.equal(
          Number(
            exhaustedRow.attempt_count,
          ),
          1,
        );

        assert.equal(
          exhaustedRow.last_error_code,
          'persistence_error',
        );

        assert.equal(
          exhaustedRow.lease_token,
          null,
        );

        assert.equal(
          exhaustedRow.lease_expires_at,
          null,
        );

        assert.ok(
          exhaustedRow.finished_at,
        );
      },
    );

    await t.test(
      'marketplace sync terminal errors cannot be mislabeled retryable',
      async () => {
        await lifecycleFixture();

        const jobId =
          await enqueueLifecycleJob(
            'inventory',
          );

        const claim =
          (
            await claimLifecycleJob(
              jobId,
            )
          ).rows[0];

        await assert.rejects(
          failLifecycleAttempt(
            jobId,
            claim.lease_token,
            'scope_missing',
            'scope missing',
            true,
          ),
          /retryable flag is invalid for error code/,
        );

        const running =
          (
            await db.query(
              `
                select
                  status,
                  lease_token
                from marketplace_sync_jobs
                where id = $1
              `,
              [
                jobId,
              ],
            )
          ).rows[0];

        assert.equal(
          running.status,
          'running',
        );

        assert.equal(
          running.lease_token,
          claim.lease_token,
        );

        const failed =
          (
            await failLifecycleAttempt(
              jobId,
              claim.lease_token,
              'scope_missing',
              'scope missing',
              false,
            )
          ).rows[0].status;

        assert.equal(
          failed,
          'failed',
        );
      },
    );
  } finally {
    if (db.close) await db.close(); else await db.end();
  }
});
