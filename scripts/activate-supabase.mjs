// One-shot activation: Supabase project + schema + auth config + Vercel envs + deploy + verify.
//
// Prereq: a Supabase personal access token in .secrets/supabase-pat.txt
//         (or SUPABASE_ACCESS_TOKEN in the environment).
// Optional: .secrets/mailgun.env with MAILGUN_API_KEY / MAILGUN_DOMAIN / MAILGUN_FROM,
//           pass --mailgun to push those to Vercel too.
//
// Usage:
//   node scripts/activate-supabase.mjs                 # create/finish activation and deploy
//   node scripts/activate-supabase.mjs --skip-deploy   # env only
//   node scripts/activate-supabase.mjs --mailgun       # also push Mailgun env vars
//
// Safe to re-run: project, schema, keys and env vars are all idempotent.

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const secretsDir = join(root, ".secrets");
const stateFile = join(secretsDir, "supabase.env");
const mailgunFile = join(secretsDir, "mailgun.env");
const paystackFile = join(secretsDir, "paystack.env");
const PAYSTACK_KEYS = [
  "PAYSTACK_SECRET_KEY",
  "VITE_PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_PLAN_GENERAL",
  "PAYSTACK_PLAN_PREMIUM",
  "PAYSTACK_PLAN_PREMIUM_PLUS",
  "PAYSTACK_PLAN_SPECIAL",
];
const MIGRATION_DIR = join(root, "supabase", "migrations");
const MOBILE_ENV = join(root, "..", "neurobloom-mobile", ".env");

const args = new Set(process.argv.slice(2));
const flag = (name) => args.has(name);
const option = (name, fallback) => {
  const hit = [...args].find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};

const SITE_URL = option("--site", "https://neurobloom-learningsphere.vercel.app");
const PROJECT_NAME = option("--name", "neurobloom");
const REGION = option("--region", "eu-central-1");
const VERCEL_SCOPE = option("--scope", "dera19");
const VERCEL = ["vercel@62.4.0"];

const API = "https://api.supabase.com/v1";
let PAT = process.env.SUPABASE_ACCESS_TOKEN ?? "";

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = value;
  }
  return out;
}

function writeEnvFile(file, values) {
  mkdirSync(dirname(file), { recursive: true });
  const merged = { ...readEnvFile(file), ...values };
  const body = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  writeFileSync(file, `${body}\n`, { mode: 0o600 });
}

function mask(value) {
  if (!value) return "(missing)";
  return `${value.slice(0, 6)}…${value.slice(-4)} (${value.length} chars)`;
}

function step(text) {
  console.log(`\n== ${text}`);
}

async function api(path, { method = "GET", body, token = PAT, base = API } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = typeof data === "object" ? data?.message ?? JSON.stringify(data) : data;
    const err = new Error(`${method} ${path} -> ${res.status}: ${String(message).slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForProject(ref, timeoutMs = 20 * 60 * 1000) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    const project = await api(`/projects/${ref}`);
    last = project.status;
    if (project.status === "ACTIVE_HEALTHY") return project;
    if (["INIT_FAILED", "REMOVED", "PAUSED"].includes(project.status)) {
      throw new Error(`Project ${ref} entered status ${project.status}`);
    }
    process.stdout.write(`  status ${project.status}…\r`);
    await sleep(8000);
  }
  throw new Error(`Project ${ref} not healthy after ${timeoutMs / 60000} min (last: ${last})`);
}

async function runSql(ref, query) {
  const paths = [`/projects/${ref}/database/query`, `/projects/${ref}/pg/query`];
  let lastError;
  for (const path of paths) {
    try {
      return await api(path, { method: "POST", body: { query } });
    } catch (err) {
      lastError = err;
      if (err.status !== 404) throw err;
    }
  }
  throw lastError;
}

async function readKeys(ref) {
  const candidates = [
    `/projects/${ref}/api-keys?reveal=true`,
    `/projects/${ref}/apikeys?reveal=true`,
    `/projects/${ref}/api-keys`,
  ];
  let payload;
  let lastError;
  for (const path of candidates) {
    try {
      payload = await api(path);
      break;
    } catch (err) {
      lastError = err;
      if (err.status !== 404) break;
    }
  }
  if (!payload) throw lastError;

  if (!Array.isArray(payload)) {
    const anon = payload.anon_key ?? payload.anon;
    const service = payload.service_role_key ?? payload.service_role;
    if (anon && service) return { anon, service };
    throw new Error("Unrecognised API key payload shape.");
  }
  const byName = (name) => payload.find((k) => (k.name ?? k.type) === name);
  const anon = byName("anon")?.api_key ?? byName("anon")?.apiKey;
  const service =
    byName("service_role")?.api_key ?? byName("service_role")?.apiKey;
  if (!anon || !service) throw new Error("API key list did not include anon + service_role.");
  return { anon, service };
}

const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

function vercel(argsArr, input) {
  return execFileSync(NPX, [...VERCEL, ...argsArr, "--scope", VERCEL_SCOPE], {
    cwd: root,
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: input === undefined ? ["ignore", "pipe", "pipe"] : ["pipe", "pipe", "pipe"],
    env: { ...process.env, NO_COLOR: "1" },
  });
}

function setVercelEnv(name, value, target = "production") {
  // --no-sensitive keeps VITE_* values readable so a Vite build can inline them;
  // without it the CLI drops into an interactive prompt and silently adds nothing.
  vercel(["env", "add", name, target, "--force", "--no-sensitive", "--yes"], value);
  console.log(`  set ${name} (${target}) ${mask(value)}`);
}

async function verify({ url, anon, service }) {
  const results = [];
  const record = (label, ok, detail = "") => {
    results.push({ label, ok });
    console.log(`  ${ok ? "PASS" : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  };

  const email = `nb-verify-${Date.now()}@example.com`;
  const password = `Nb-${randomBytes(12).toString("base64url")}`;
  const headers = { apikey: anon, "Content-Type": "application/json" };

  step("Verify auth + RLS against the live project");
  const signupRes = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      data: { full_name: "Verify Bot", role: "parent" },
    }),
  });
  const signup = await signupRes.json();
  let token = signup?.access_token;
  const userId = signup?.user?.id;
  if (!token) {
    const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });
    const login = await loginRes.json();
    token = login?.access_token;
  }
  record("sign up a test account", Boolean(token), signup?.error_description ?? "");
  if (!token) return results;

  const authed = { ...headers, Authorization: `Bearer ${token}` };

  const profileRes = await fetch(
    `${url}/rest/v1/profiles?select=id,role,full_name&id=eq.${userId}`,
    { headers: authed },
  );
  const profiles = await profileRes.json();
  record(
    "signup trigger created a profiles row",
    Array.isArray(profiles) && profiles[0]?.role === "parent",
    JSON.stringify(profiles).slice(0, 160),
  );

  const stateRes = await fetch(`${url}/rest/v1/user_state`, {
    method: "POST",
    headers: { ...authed, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ user_id: userId, state: { verify: true, at: new Date().toISOString() } }),
  });
  const stateBody = await stateRes.json();
  record(
    "per-user state upsert",
    stateRes.ok && Array.isArray(stateBody) && stateBody[0]?.state?.verify === true,
    stateRes.ok ? "" : JSON.stringify(stateBody).slice(0, 160),
  );

  const readBack = await fetch(
    `${url}/rest/v1/user_state?select=state&user_id=eq.${userId}`,
    { headers: authed },
  );
  const readBody = await readBack.json();
  record("per-user state read-back", readBody?.[0]?.state?.verify === true);

  const anonRead = await fetch(`${url}/rest/v1/user_state?select=user_id`, {
    headers: { apikey: anon },
  });
  const anonBody = await anonRead.json().catch(() => []);
  record(
    "RLS blocks anonymous reads",
    Array.isArray(anonBody) ? anonBody.length === 0 : true,
    Array.isArray(anonBody) ? `${anonBody.length} rows visible` : "",
  );

  if (service) {
    const del = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
    record("delete test account", del.ok, del.ok ? "" : `HTTP ${del.status}`);
  }

  step("Verify the deployed site");
  const site = await fetch(`${SITE_URL}/`);
  record("site responds 200", site.ok, `HTTP ${site.status}`);
  const html = await site.text();
  const asset = html.match(/\/assets\/[^"']+\.js/)?.[0];
  if (asset) {
    const bundle = await (await fetch(`${SITE_URL}${asset}`)).text();
    const host = new URL(url).host;
    record("Supabase URL baked into the client bundle", bundle.includes(host), asset);
  } else {
    record("client bundle found", false);
  }

  const emailProbe = await fetch(`${SITE_URL}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      kind: "support",
      recipient: email,
      data: { subject: "Activation probe", detail: "automated verification" },
    }),
  });
  const probe = await emailProbe.json().catch(() => ({}));
  record(
    "email endpoint reachable with a real session",
    [200, 401].includes(emailProbe.status) || Boolean(probe?.skipped),
    `HTTP ${emailProbe.status} ${JSON.stringify(probe).slice(0, 160)}`,
  );

  // Unauthenticated on purpose: a valid session would create a real Paystack
  // transaction (and an abandoned one) on every activation run.
  const payProbe = await fetch(`${SITE_URL}/api/paystack/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ child_id: "tunde", plan_id: "premium" }),
  });
  const payBody = await payProbe.json().catch(() => ({}));
  record(
    "payments endpoint reachable",
    [401, 503].includes(payProbe.status),
    `HTTP ${payProbe.status} ${JSON.stringify(payBody).slice(0, 160)}`,
  );

  const hookProbe = await fetch(`${SITE_URL}/api/paystack/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-paystack-signature": "invalid" },
    body: JSON.stringify({ event: "charge.success", data: {} }),
  });
  record(
    "webhook rejects unsigned events",
    hookProbe.status === 401,
    `HTTP ${hookProbe.status}`,
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  return results;
}

async function main() {
  const patFile = join(secretsDir, "supabase-pat.txt");
  if (!PAT && existsSync(patFile)) {
    PAT = readFileSync(patFile, "utf8").split(/\r?\n/)[0].trim();
  }
  if (!PAT) {
    console.error(
      "Missing Supabase personal access token.\n" +
        "Create one at https://supabase.com/dashboard/account/tokens and save it to\n" +
        `  ${join(secretsDir, "supabase-pat.txt")}\n` +
        "or export SUPABASE_ACCESS_TOKEN.",
    );
    process.exit(1);
  }
  if (!existsSync(MIGRATION_DIR)) throw new Error(`Missing migrations: ${MIGRATION_DIR}`);

  const saved = readEnvFile(stateFile);
  const mailgun = readEnvFile(mailgunFile);
  const paystack = readEnvFile(paystackFile);

  step("Authenticate to Supabase");
  let orgs = await api("/organizations");
  if (!orgs.length) {
    console.log("  no organizations on this account - creating one");
    await api("/organizations", { method: "POST", body: { name: "NeuroBloom" } });
    orgs = await api("/organizations");
  }
  const orgId = saved.SUPABASE_ORG_ID || option("--org", orgs[0]?.id);
  const org = orgs.find((o) => o.id === orgId);
  if (!org) throw new Error(`No Supabase organization matches ${orgId}`);
  console.log(`  org: ${org.name} (${org.id})`);

  let ref = saved.SUPABASE_PROJECT_REF;
  if (!ref) {
    step(`Create project "${PROJECT_NAME}" in ${REGION}`);
    const dbPass = `Nb${randomBytes(24).toString("base64url")}`;
    try {
      const created = await api("/projects", {
        method: "POST",
        body: {
          organization_id: org.id,
          name: PROJECT_NAME,
          region: REGION,
          db_pass: dbPass,
          plan: "free",
        },
      });
      ref = created.id;
    } catch (err) {
      if (!/already exists|duplicate/i.test(err.message)) throw err;
      const projects = await api("/projects");
      const match = projects.find((p) => p.name === PROJECT_NAME);
      if (!match) throw err;
      ref = match.id;
      console.log("  reusing existing project");
    }
    writeEnvFile(stateFile, {
      SUPABASE_ORG_ID: org.id,
      SUPABASE_PROJECT_REF: ref,
      SUPABASE_DB_PASSWORD: dbPass,
      SUPABASE_REGION: REGION,
    });
    console.log(`  project ref: ${ref}`);
    await waitForProject(ref);
  } else {
    console.log(`  project ref: ${ref} (from .secrets/supabase.env)`);
    await waitForProject(ref);
  }

  const project = await api(`/projects/${ref}`);
  const url = `https://${ref}.supabase.co`;
  console.log(`  url: ${url}  status: ${project.status}`);

  step("Apply schema");
  const migrationFiles = readdirSync(MIGRATION_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of migrationFiles) {
    await runSql(ref, readFileSync(join(MIGRATION_DIR, file), "utf8"));
    console.log(`  applied ${file}`);
  }
  const check = await runSql(
    ref,
    "select table_name from information_schema.tables where table_schema = 'public' and table_name in ('profiles','user_state','email_log','payments') order by table_name;",
  );
  const tables = (Array.isArray(check) ? check : check?.result ?? []).map(
    (r) => r.table_name ?? r.table,
  );
  console.log(`  tables: ${tables.join(", ") || "(none found — check response shape)"}`);

  step("Fetch API keys");
  const keys = await readKeys(ref);
  console.log(`  anon ${mask(keys.anon)}\n  service_role ${mask(keys.service)}`);

  step("Configure auth URLs");
  await api(`/projects/${ref}/config/auth`, {
    method: "PATCH",
    body: {
      site_url: SITE_URL,
      uri_allow_list: [
        `${SITE_URL}/auth/callback`,
        `${SITE_URL}/**`,
        "http://localhost:5173/auth/callback",
        "http://localhost:5173/**",
      ].join(","),
      mailer_autoconfirm: true,
      disable_signup: false,
      external_email_enabled: true,
    },
  });
  console.log(`  site_url ${SITE_URL}\n  redirects ${SITE_URL}/auth/callback, localhost:5173`);

  const env = {
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: keys.anon,
    SUPABASE_SERVICE_ROLE_KEY: keys.service,
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: keys.anon,
    SITE_URL,
  };

  if (paystack.PAYSTACK_SECRET_KEY) {
    for (const key of PAYSTACK_KEYS) {
      if (paystack[key]) env[key] = paystack[key];
    }
    console.log("  paystack: pushing keys + plan codes from .secrets/paystack.env");
  }
  if (flag("--mailgun")) {
    if (mailgun.MAILGUN_API_KEY && mailgun.MAILGUN_DOMAIN) {
      for (const key of ["MAILGUN_API_KEY", "MAILGUN_DOMAIN", "MAILGUN_FROM", "MAILGUN_REPLY_TO", "MAILGUN_BASE_URL"]) {
        if (mailgun[key]) env[key] = mailgun[key];
      }
    } else {
      console.warn("  --mailgun given but .secrets/mailgun.env has no key/domain; skipping");
    }
  }

  writeEnvFile(stateFile, env);
  writeEnvFile(join(root, ".env.local"), env);
  console.log(`  wrote ${stateFile}\n  wrote ${join(root, ".env.local")}`);
  if (existsSync(dirname(MOBILE_ENV))) {
    writeEnvFile(MOBILE_ENV, {
      EXPO_PUBLIC_SUPABASE_URL: url,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: keys.anon,
    });
    console.log(`  wrote ${MOBILE_ENV}`);
  }

  step("Push env vars to Vercel (Production)");
  for (const [name, value] of Object.entries(env)) {
    setVercelEnv(name, value);
  }
  const listed = vercel(["env", "ls", "production"]);
  const missing = Object.keys(env).filter((name) => !listed.includes(name));
  if (missing.length) throw new Error(`Vercel did not store: ${missing.join(", ")}`);

  if (flag("--skip-deploy")) {
    console.log("\nSkipped deploy (--skip-deploy). Run: npx vercel@62.4.0 deploy --prod --yes --scope " + VERCEL_SCOPE);
    return;
  }

  step("Deploy to Vercel");
  const out = vercel(["deploy", "--prod", "--yes"]);
  const deploymentUrl = out.match(/https:\/\/[^\s]+\.vercel\.app/)?.[0];
  console.log(out.split("\n").filter(Boolean).slice(-6).join("\n"));
  if (deploymentUrl) console.log(`  deployment: ${deploymentUrl}`);

  step("Verify");
  const results = await verify({ url, anon: keys.anon, service: keys.service });
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

await main();
