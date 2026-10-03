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
  } finally {
    if (db.close) await db.close(); else await db.end();
  }
});
