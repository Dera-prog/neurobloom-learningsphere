#!/usr/bin/env node
// Creates (or reuses) the three monthly NGN plans in Paystack and saves their
// plan codes to .secrets/paystack.env so `npm run activate` can push them.
//
//   node scripts/paystack-setup.mjs
//
// Needs PAYSTACK_SECRET_KEY in .secrets/paystack.env (sk_live_… or sk_test_…).
// Test-mode keys create test plans — put SkTest in the codes so you can tell.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const secretsDir = join(root, ".secrets");
const envFile = join(secretsDir, "paystack.env");

const PLANS = [
  { key: "PAYSTACK_PLAN_GENERAL", name: "NeuroBloom General Plan", amount: 8500 },
  { key: "PAYSTACK_PLAN_PREMIUM", name: "NeuroBloom Premium Plan", amount: 15000 },
  { key: "PAYSTACK_PLAN_PREMIUM_PLUS", name: "NeuroBloom Premium Plus", amount: 25000 },
  { key: "PAYSTACK_PLAN_SPECIAL", name: "NeuroBloom Special Needs Premium", amount: 22000 },
];

function readEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

function writeEnv(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const body = Object.entries(data)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  writeFileSync(file, `${body}\n`);
}

const saved = readEnv(envFile);
const key = (process.env.PAYSTACK_SECRET_KEY || saved.PAYSTACK_SECRET_KEY || "").trim();
if (!key) {
  console.error(
    "Missing PAYSTACK_SECRET_KEY.\n" +
      "Get it from https://dashboard.paystack.com/#/settings/developers and save it to\n" +
      `  ${envFile}\n` +
      "as PAYSTACK_SECRET_KEY=sk_...",
  );
  process.exit(1);
}

const mode = key.startsWith("sk_test") ? "TEST" : "LIVE";
console.log(`Paystack key: ${key.slice(0, 8)}… (${mode} mode)`);

async function api(path, init = {}) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === false) {
    const detail = payload.message || `HTTP ${response.status}`;
    throw new Error(`${path}: ${detail}`);
  }
  return payload;
}

const existing = await api("/plan?perPage=100").catch((err) => {
  console.warn(`  could not list plans (${err.message}); creating fresh ones`);
  return { data: [] };
});
const plans = Array.isArray(existing.data) ? existing.data : [];

const result = { ...saved, PAYSTACK_SECRET_KEY: key };
for (const plan of PLANS) {
  const match = plans.find(
    (p) => p.name === plan.name && Number(p.amount) === plan.amount * 100 && p.currency === "NGN",
  );
  if (match) {
    result[plan.key] = match.plan_code;
    console.log(`  reuse ${plan.name} (${plan.amount} NGN/mo) → ${match.plan_code}`);
    continue;
  }
  const created = await api("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: plan.name,
      interval: "monthly",
      amount: plan.amount * 100,
      currency: "NGN",
      description: `${plan.name} — monthly subscription`,
      send_invoices: true,
      send_sms: false,
    }),
  });
  result[plan.key] = created.data.plan_code;
  console.log(`  create ${plan.name} (${plan.amount} NGN/mo) → ${created.data.plan_code}`);
}

if (!result.VITE_PAYSTACK_PUBLIC_KEY) {
  result.VITE_PAYSTACK_PUBLIC_KEY =
    (process.env.PAYSTACK_PUBLIC_KEY || saved.PAYSTACK_PUBLIC_KEY || "").trim();
}

writeEnv(envFile, result);
console.log(`\nSaved plan codes to ${envFile}`);
console.log(
  "Note: LIVE plan codes start with PLN_, TEST codes with PLN_ too but only work with test keys —\n" +
    "keep the key and codes from the same mode, or checkout will fail.",
);
if (!result.VITE_PAYSTACK_PUBLIC_KEY) {
  console.log(
    "\nAdd your public key so the site knows payments are on:\n" +
      "  PAYSTACK_PUBLIC_KEY=pk_test_…  (or pk_live_…)\n" +
      `in ${envFile}, then re-run this script.`,
  );
}
console.log("\nNext: npm run activate  (pushes PAYSTACK_* + SITE_URL to Vercel and redeploys)");
console.log('Webhook: set https://neurobloom-learningsphere.vercel.app/api/paystack/webhook in the Paystack dashboard.');
