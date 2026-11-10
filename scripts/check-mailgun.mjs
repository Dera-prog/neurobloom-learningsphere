// Prove a Mailgun domain + API key can deliver, without touching the app.
//
//   node scripts/check-mailgun.mjs you@example.com
//
// Reads .secrets/mailgun.env (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM,
// optional MAILGUN_BASE_URL). Sandbox domains only deliver to addresses listed
// under Sandbox → Authorized recipients.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, ".secrets", "mailgun.env");

function readEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
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

const env = { ...readEnv(file), ...process.env };
const apiKey = env.MAILGUN_API_KEY;
const domain = env.MAILGUN_DOMAIN;
const to = process.argv[2] ?? env.MAILGUN_TEST_TO;
const auth = { Authorization: `Basic ${Buffer.from(`api:${apiKey ?? ""}`).toString("base64")}` };

if (!apiKey || !domain) {
  console.error(`Missing MAILGUN_API_KEY or MAILGUN_DOMAIN in ${file}`);
  process.exit(1);
}
if (!to) {
  console.error("Usage: node scripts/check-mailgun.mjs <recipient@example.com>");
  process.exit(1);
}

const host = env.MAILGUN_BASE_URL?.includes("eu.mailgun.net")
  ? "https://api.eu.mailgun.net"
  : "https://api.mailgun.net";

const domainInfo = await fetch(`${host}/v3/domains/${encodeURIComponent(domain)}`, { headers: auth });
const domainBody = await domainInfo.json().catch(() => ({}));
console.log(
  domainInfo.ok
    ? `domain ${domain}: state=${domainBody?.domain?.state ?? "?"} dns=${domainBody?.domain?.type ?? "sandbox"}`
    : `domain lookup failed: HTTP ${domainInfo.status} ${JSON.stringify(domainBody).slice(0, 200)}`,
);

const form = new FormData();
form.set("from", env.MAILGUN_FROM || `NeuroBloom <postmaster@${domain}>`);
form.set("to", to);
form.set("subject", "NeuroBloom test — Mailgun is connected");
form.set("text", `If you can read this, ${domain} is delivering mail for NeuroBloom LearningSphere.`);

const send = await fetch(`${host}/v3/${encodeURIComponent(domain)}/messages`, {
  method: "POST",
  headers: auth,
  body: form,
});
const body = await send.json().catch(() => ({}));
console.log(`send -> HTTP ${send.status} ${JSON.stringify(body).slice(0, 300)}`);
if (!send.ok) {
  if (send.status === 401) console.log("→ API key rejected. Re-copy it from Mailgun → Account → API keys.");
  if (send.status === 403 || /not authorized|recipient/i.test(JSON.stringify(body))) {
    console.log("→ Sandbox domains only deliver to authorized recipients. Add this address under Sandbox → Authorized recipients.");
  }
  process.exitCode = 1;
}
