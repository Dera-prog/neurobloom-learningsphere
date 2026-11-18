// Prove Termii can deliver an SMS, without touching the app.
//
//   node scripts/check-sms.mjs 08030000000
//
// Reads .secrets/termii.env (TERMII_API_KEY, optional TERMII_SENDER_ID,
// TERMII_CHANNEL, TERMII_BASE_URL); process.env overrides. Nigerian numbers in
// local form are converted to the 234 international format Termii expects.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, ".secrets", "termii.env");

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

function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

const env = { ...readEnv(file), ...process.env };
const apiKey = env.TERMII_API_KEY;
const to = normalizePhone(process.argv[2] ?? env.SMS_TEST_TO);
const base = (env.TERMII_BASE_URL || "https://api.ng.termii.com").replace(/\/+$/, "");

if (!apiKey) {
  console.error(`Missing TERMII_API_KEY in ${file}`);
  process.exit(1);
}
if (!to) {
  console.error("Usage: node scripts/check-sms.mjs <phone number>");
  process.exit(1);
}

const balance = await fetch(`${base}/api/get-balance?api_key=${encodeURIComponent(apiKey)}`);
const balanceBody = await balance.json().catch(() => ({}));
console.log(
  balance.ok
    ? `account balance: ${balanceBody?.balance ?? "?"} ${balanceBody?.currency ?? ""}`.trim()
    : `balance lookup failed: HTTP ${balance.status} ${JSON.stringify(balanceBody).slice(0, 200)}`,
);

const send = await fetch(`${base}/api/sms/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: apiKey,
    to,
    from: env.TERMII_SENDER_ID || "NeuroBloom",
    sms: "NeuroBloom test: your SMS delivery is connected.",
    type: "plain",
    channel: env.TERMII_CHANNEL || "generic",
  }),
});
const body = await send.json().catch(() => ({}));
const delivered = send.ok && (body?.code === "ok" || body?.message_id);
console.log(`send -> HTTP ${send.status} ${JSON.stringify(body).slice(0, 300)}`);
if (!delivered) {
  if (send.status === 401 || /invalid api key/i.test(JSON.stringify(body))) {
    console.log("→ API key rejected. Re-copy it from Termii → Settings → API Keys.");
  }
  if (/sender|from/i.test(JSON.stringify(body))) {
    console.log("→ The sender ID must be approved for Nigeria; check Termii → Sender IDs.");
  }
  process.exitCode = 1;
} else {
  console.log(`→ queued as ${body.message_id} to ${to}`);
}
