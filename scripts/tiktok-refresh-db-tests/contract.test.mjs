import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const org = "11111111-1111-4111-8111-111111111111";
const otherOrg = "22222222-2222-4222-8222-222222222222";
const connection = "33333333-3333-4333-8333-333333333333";
const credential = "44444444-4444-4444-8444-444444444444";
const url = process.env.LAKUVO_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
      parsed.pathname !== "/lakuvo_test_refresh") {
    throw new Error("Database tests require loopback and disposable database lakuvo_test_refresh.");
  }
}

const setup = `
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create function auth.role() returns text language sql stable as
  'select current_setting(''request.jwt.claim.role'', true)';
create function auth.uid() returns uuid language sql stable as
  'select null::uuid';
create table public.organizations (id uuid primary key);
create table public.organization_members (organization_id uuid, user_id uuid, role text);
select set_config('request.jwt.claim.role', 'service_role', false);
`;
const exec = (db, sql) => db.exec ? db.exec(sql) : db.query(sql);
const claim = (db, version = 1, organization = org) => db.query(
  "select * from public.claim_tiktok_creator_refresh($1, $2, $3)", [organization, connection, version]);
const dispatch = (db, attempt) => db.query(
  "select public.dispatch_tiktok_creator_refresh($1, $2, $3) as result", [org, connection, attempt]);
const finalize = (db, attempt, overrides = {}) => db.query(
  "select public.finalize_tiktok_creator_refresh($1,$2,$3,$4,$5,$6,$7,$8,$9) as version", [
    org, connection, attempt, "replacement-access-ciphertext", "replacement-refresh-ciphertext",
    new Date(Date.now() + 86400_000).toISOString(), new Date(Date.now() + 31536000_000).toISOString(),
    "new-key", ["user.info.basic", "video.publish"],
  ].map((value, index) => Object.hasOwn(overrides, index) ? overrides[index] : value));
const fail = (db, attempt, outcome, organization = org) => db.query(
  "select public.finish_tiktok_creator_refresh_failure($1,$2,$3,$4) as result", [organization, connection, attempt, outcome]);
const metadata = async (db) => (await db.query(`select c.version, c.authorization_status,
  c.credential_expires_at, c.granted_scopes, k.access_token_ciphertext,
  k.refresh_token_ciphertext, k.encryption_key_version, k.access_token_expires_at,
  k.refresh_token_expires_at, a.status from publishing_provider_connections c
  left join publishing_provider_credentials k on k.id=c.credential_reference_id
  left join tiktok_creator_refresh_attempts a on a.connection_id=c.id where c.id=$1`, [connection])).rows[0];
const fixture = async (db) => {
  await exec(db, `truncate public.organizations cascade;
    insert into organizations values ('${org}'), ('${otherOrg}');
    insert into publishing_provider_connections
      (id, organization_id, provider, external_account_id, authorization_status, granted_scopes,
       supported_capabilities, credential_reference_id, credential_expires_at)
    values ('${connection}', '${org}', 'tiktok', 'creator', 'authorized', '{video.publish}',
      '{publish_video}', '${credential}', clock_timestamp() - interval '1 day');
    insert into publishing_provider_credentials (id, connection_id, access_token_ciphertext,
      refresh_token_ciphertext, encryption_key_version, access_token_expires_at, refresh_token_expires_at)
    values ('${credential}', '${connection}', 'old-access', 'old-refresh', 'old-key',
      clock_timestamp() - interval '1 day', clock_timestamp() + interval '30 days');
    select set_config('request.jwt.claim.role','service_role',false);`);
};
const reconnect = (db) => db.query(`select * from public.upsert_publishing_provider_connection(
  $1,'tiktok','creator',null,'{video.publish}','{publish_video}',
  'reconnected-access','reconnected-refresh',clock_timestamp()+interval '1 day',
  clock_timestamp()+interval '30 days','Bearer','reconnected-key')`, [org]);
const rejected = (promise, message) => assert.rejects(promise, (error) => error.message.includes(message));

test("TikTok refresh SQL transaction contract", async (t) => {
  const db = url ? new pg.Client({ connectionString: url }) : new PGlite();
  if (url) await db.connect();
  try {
    await exec(db, setup);
    for (const name of [
      "phase-19-publishing-provider-connection-persistence.sql",
      "phase-19.1-youtube-token-refresh-readiness.sql",
      "phase-19.2-tiktok-creator-refresh-atomic-contract.sql",
    ]) await exec(db, await readFile(new URL(`../../database/${name}`, import.meta.url), "utf8"));

    const run = (name, fn) => t.test(name, async () => { await fixture(db); await fn(); });
    await run("claims once and dispatches once", async () => {
      const a = (await claim(db)).rows[0];
      assert.equal(a.refresh_token_ciphertext, "old-refresh");
      await rejected(claim(db), "refresh_attempt_blocked");
      assert.equal((await dispatch(db, a.attempt_id)).rows[0].result, true);
      assert.equal((await dispatch(db, a.attempt_id)).rows[0].result, false);
    });
    await run("updates both tokens, expiry, scopes and key atomically", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      assert.equal(Number((await finalize(db, a.attempt_id)).rows[0].version), 2);
      const row = await metadata(db);
      assert.equal(row.access_token_ciphertext, "replacement-access-ciphertext");
      assert.equal(row.refresh_token_ciphertext, "replacement-refresh-ciphertext");
      assert.equal(row.encryption_key_version, "new-key");
      assert.equal(String(row.credential_expires_at), String(row.access_token_expires_at));
      assert.ok(new Date(row.refresh_token_expires_at).getTime() > Date.now());
      assert.deepEqual(row.granted_scopes, ["user.info.basic", "video.publish"]);
      assert.equal(row.status, "succeeded");
      await rejected(finalize(db, a.attempt_id), "refresh_attempt_conflict");
    });
    await run("does not finalize before dispatch", async () => {
      const a = (await claim(db)).rows[0];
      await rejected(finalize(db, a.attempt_id), "refresh_attempt_conflict");
      assert.equal((await metadata(db)).refresh_token_ciphertext, "old-refresh");
    });
    await run("dispatch rechecks refresh credential expiry", async () => {
      const a = (await claim(db)).rows[0];
      await exec(db, "update publishing_provider_credentials set refresh_token_expires_at=clock_timestamp()-interval '1 day'");
      assert.equal((await dispatch(db, a.attempt_id)).rows[0].result, false);
      assert.equal((await metadata(db)).status, "prepared");
    });
    await run("prepared cancellation permits a new claim, dispatched cancellation does not", async () => {
      const a = (await claim(db)).rows[0];
      assert.equal((await fail(db, a.attempt_id, "cancelled")).rows[0].result, true);
      const b = (await claim(db)).rows[0];
      assert.notEqual(a.attempt_id, b.attempt_id);
      await dispatch(db, b.attempt_id);
      assert.equal((await fail(db, b.attempt_id, "cancelled")).rows[0].result, false);
      await rejected(claim(db), "refresh_attempt_blocked");
    });
    await run("uncertain and old dispatched attempts cannot be reclaimed by time", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await exec(db, "update tiktok_creator_refresh_attempts set created_at=clock_timestamp()-interval '7 days'");
      await rejected(claim(db), "refresh_attempt_blocked");
      assert.equal((await fail(db, a.attempt_id, "uncertain")).rows[0].result, true);
      await rejected(claim(db), "refresh_attempt_blocked");
      assert.equal((await metadata(db)).authorization_status, "authorized");
    });
    await run("terminal rejection marks reauthorization and preserves credentials", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await fail(db, a.attempt_id, "reauthorization_required");
      const row = await metadata(db);
      assert.equal(row.authorization_status, "reauthorization_required");
      assert.equal(row.refresh_token_ciphertext, "old-refresh");
      await rejected(claim(db, 2), "refresh_connection_conflict");
    });
    await run("reconnection fences old dispatch/finalize/failure and permits a new attempt", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await reconnect(db);
      await rejected(finalize(db, a.attempt_id), "refresh_attempt_conflict");
      assert.equal((await fail(db, a.attempt_id, "reauthorization_required")).rows[0].result, false);
      const b = (await claim(db, 2)).rows[0];
      assert.notEqual(b.attempt_id, a.attempt_id);
      assert.equal((await dispatch(db, a.attempt_id)).rows[0].result, false);
      assert.equal((await metadata(db)).refresh_token_ciphertext, "reconnected-refresh");
    });
    await run("revocation denies old results and removes credentials", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await db.query("select public.revoke_publishing_provider_connection($1,$2)", [org, connection]);
      await rejected(finalize(db, a.attempt_id), "refresh_connection_conflict");
      assert.equal((await fail(db, a.attempt_id, "reauthorization_required")).rows[0].result, false);
      assert.equal((await metadata(db)).refresh_token_ciphertext, null);
    });
    await run("organization, provider and expected version are fenced", async () => {
      await rejected(claim(db, 1, otherOrg), "refresh_connection_conflict");
      await rejected(claim(db, 9), "refresh_connection_conflict");
      await exec(db, "update publishing_provider_connections set provider='youtube'");
      await rejected(claim(db), "refresh_connection_conflict");
    });
    await run("missing or expired refresh credential denies claim", async () => {
      await exec(db, "update publishing_provider_credentials set refresh_token_expires_at=clock_timestamp()-interval '1 day'");
      await rejected(claim(db), "refresh_credential_unavailable");
      await exec(db, "delete from publishing_provider_credentials");
      await rejected(claim(db), "refresh_credential_unavailable");
    });
    await run("rejects blank token, missing scope and nonfinite or expired dates", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      for (const overrides of [{ 4: " " }, { 8: [] }, { 5: "infinity" }, { 6: "2000-01-01" }, { 8: ["video.publish", null] }]) {
        await rejected(finalize(db, a.attempt_id, overrides), "refresh_rotation_invalid");
      }
      assert.equal((await metadata(db)).refresh_token_ciphertext, "old-refresh");
    });
    await run("credential update failure rolls back connection and attempt", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await exec(db, `create function fail_rotation() returns trigger language plpgsql as $$
        begin raise exception 'injected_failure'; end; $$;
        create trigger fail_rotation before update on publishing_provider_credentials
        for each row execute function fail_rotation();`);
      try {
        await rejected(finalize(db, a.attempt_id), "injected_failure");
        const row = await metadata(db);
        assert.equal(Number(row.version), 1);
        assert.equal(row.status, "dispatched");
        assert.equal(row.access_token_ciphertext, "old-access");
      } finally { await exec(db, "drop trigger fail_rotation on publishing_provider_credentials; drop function fail_rotation()"); }
    });
    await run("missing credentials after dispatch cannot partially update metadata", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await exec(db, "delete from publishing_provider_credentials");
      await rejected(finalize(db, a.attempt_id), "refresh_credential_conflict");
      assert.equal(Number((await metadata(db)).version), 1);
    });
    await run("metadata update failure rolls back already-written token pair", async () => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await exec(db, `create function fail_metadata_rotation() returns trigger language plpgsql as $$
        begin raise exception 'injected_metadata_failure'; end; $$;
        create trigger fail_metadata_rotation before update on publishing_provider_connections
        for each row execute function fail_metadata_rotation();`);
      try {
        await rejected(finalize(db, a.attempt_id), "injected_metadata_failure");
        const row = await metadata(db);
        assert.equal(row.access_token_ciphertext, "old-access");
        assert.equal(row.refresh_token_ciphertext, "old-refresh");
        assert.equal(row.encryption_key_version, "old-key");
        assert.equal(Number(row.version), 1);
        assert.equal(row.status, "dispatched");
      } finally { await exec(db, "drop trigger fail_metadata_rotation on publishing_provider_connections; drop function fail_metadata_rotation()"); }
    });
    await run("RPC grants exclude browser roles and direct table access", async () => {
      for (const role of ["anon", "authenticated", "service_role"]) {
        const result = await db.query("select has_table_privilege($1,'public.tiktok_creator_refresh_attempts','SELECT') as allowed", [role]);
        assert.equal(result.rows[0].allowed, false);
        for (const signature of [
          "claim_tiktok_creator_refresh(uuid,uuid,bigint)",
          "dispatch_tiktok_creator_refresh(uuid,uuid,uuid)",
          "finalize_tiktok_creator_refresh(uuid,uuid,uuid,text,text,timestamptz,timestamptz,text,text[])",
          "finish_tiktok_creator_refresh_failure(uuid,uuid,uuid,text)",
        ]) {
          const r = await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, `public.${signature}`]);
          assert.equal(r.rows[0].allowed, role === "service_role");
        }
      }
      await exec(db, "select set_config('request.jwt.claim.role','authenticated',false)");
      await rejected(claim(db), "service_role_required");
      await exec(db, "set role anon");
      try { await rejected(claim(db), "permission denied"); }
      finally { await exec(db, "reset role"); }
      await exec(db, "select set_config('request.jwt.claim.role','service_role',false); set role service_role");
      try {
        await rejected(db.query("select * from public.tiktok_creator_refresh_attempts"), "permission denied");
        assert.equal((await claim(db)).rows.length, 1);
      } finally { await exec(db, "reset role"); }
    });
    await run("attempt table has RLS and no secret columns", async () => {
      assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.tiktok_creator_refresh_attempts'::regclass")).rows[0].relrowsecurity, true);
      const columns = (await db.query("select column_name from information_schema.columns where table_name='tiktok_creator_refresh_attempts'")).rows.map((r) => r.column_name);
      assert.ok(columns.every((column) => !column.includes("token") && !column.includes("ciphertext")));
    });

    await t.test("parallel independent PostgreSQL connections: exactly one claim wins", { skip: !url }, async () => {
      await fixture(db);
      const clients = [new pg.Client({ connectionString: url }), new pg.Client({ connectionString: url })];
      try {
        await Promise.all(clients.map(async (client) => {
          await client.connect();
          await client.query("select set_config('request.jwt.claim.role','service_role',false)");
        }));
        const results = await Promise.allSettled(clients.map((client) => claim(client)));
        assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
        const loser = results.find((r) => r.status === "rejected");
        assert.ok(loser.reason.message.includes("refresh_attempt_blocked"));
      } finally { await Promise.all(clients.map((client) => client.end())); }
    });
    const parallel = (name, fn) => t.test(name, { skip: !url }, async () => {
      await fixture(db);
      const clients = [new pg.Client({ connectionString: url }), new pg.Client({ connectionString: url })];
      try {
        await Promise.all(clients.map(async (client) => {
          await client.connect();
          await client.query("select set_config('request.jwt.claim.role','service_role',false)");
        }));
        await fn(clients);
      } finally { await Promise.all(clients.map((client) => client.end())); }
    });
    await parallel("parallel dispatch has one winner; parallel finalize has one winner", async (clients) => {
      const a = (await claim(db)).rows[0];
      const dispatched = await Promise.all(clients.map((client) => dispatch(client, a.attempt_id)));
      assert.deepEqual(dispatched.map((r) => r.rows[0].result).sort(), [false, true]);
      const finalized = await Promise.allSettled(clients.map((client) => finalize(client, a.attempt_id)));
      assert.equal(finalized.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(Number((await metadata(db)).version), 2);
    });
    for (const action of ["reconnect", "revoke"]) {
      await parallel(`finalize waits for ${action} transaction and rejects stale result`, async ([first, second]) => {
        const a = (await claim(db)).rows[0];
        await dispatch(db, a.attempt_id);
        await first.query("begin");
        try {
          if (action === "reconnect") await reconnect(first);
          else await first.query("select public.revoke_publishing_provider_connection($1,$2)", [org, connection]);
          const finishing = finalize(second, a.attempt_id).then(() => "unexpected-success", (error) => error.message);
          await first.query("commit");
          assert.ok((await finishing).includes(action === "reconnect" ? "refresh_attempt_conflict" : "refresh_connection_conflict"));
          const row = await metadata(db);
          assert.equal(row.refresh_token_ciphertext, action === "reconnect" ? "reconnected-refresh" : null);
        } catch (error) { await first.query("rollback"); throw error; }
      });
    }
    await parallel("finalize rejects expiry that passes while waiting for a row lock", async ([first, second]) => {
      const a = (await claim(db)).rows[0];
      await dispatch(db, a.attempt_id);
      await first.query("begin");
      try {
        await first.query("select id from publishing_provider_connections where id=$1 for update", [connection]);
        const finishing = finalize(second, a.attempt_id, { 5: new Date(Date.now() + 150).toISOString() })
          .then(() => "unexpected-success", (error) => error.message);
        await new Promise((resolve) => setTimeout(resolve, 250));
        await first.query("commit");
        assert.ok((await finishing).includes("refresh_rotation_invalid"));
        assert.equal((await metadata(db)).access_token_ciphertext, "old-access");
      } catch (error) { await first.query("rollback"); throw error; }
    });
  } finally { if (url) await db.end(); else await db.close(); }
});
