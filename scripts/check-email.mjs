// Prove an email provider can deliver, without touching the app.
//
//   node scripts/check-email.mjs you@example.com
//
// Resend wins when RESEND_API_KEY is present, otherwise Mailgun. Values come
// from .secrets/resend.env or .secrets/mailgun.env; process.env overrides both.
// A Resend key without a verified domain only delivers to the account owner's
// address, and Mailgun sandbox domains only deliver to authorized recipients.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const env = {
  ...readEnv(join(root, ".secrets", "mailgun.env")),
  ...readEnv(join(root, ".secrets", "resend.env")),
  ...process.env,
};

const to = process.argv[2] ?? env.EMAIL_TEST_TO;
const subject = "NeuroBloom test — email is connected";
const text = "If you can read this, NeuroBloom LearningSphere can deliver sign-up and sign-in codes.";

if (!to) {
  console.error("Usage: node scripts/check-email.mjs <recipient@example.com>");
  process.exit(1);
}

const provider = env.RESEND_API_KEY ? "resend" : env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN ? "mailgun" : null;

if (!provider) {
  console.error(
    "No provider configured. Set RESEND_API_KEY in .secrets/resend.env, " +
      "or MAILGUN_API_KEY + MAILGUN_DOMAIN in .secrets/mailgun.env.",
  );
  process.exit(1);
}

if (provider === "resend") {
  const from = env.EMAIL_FROM || "NeuroBloom <onboarding@resend.dev>";
  const replyTo = env.EMAIL_REPLY_TO;
  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  const body = await send.json().catch(() => ({}));
  console.log(`resend -> HTTP ${send.status} ${JSON.stringify(body).slice(0, 300)}`);
  if (!send.ok) {
    if (send.status === 401) console.log("→ API key rejected. Re-copy it from Resend → API Keys.");
    if (/domain|not verified|testing/i.test(JSON.stringify(body))) {
      console.log("→ Without a verified domain, Resend only delivers to the address that owns the account.");
    }
    process.exitCode = 1;
  }
} else {
  const domain = env.MAILGUN_DOMAIN;
  const auth = { Authorization: `Basic ${Buffer.from(`api:${env.MAILGUN_API_KEY}`).toString("base64")}` };
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
  form.set("from", env.MAILGUN_FROM || `NeuroBloom <noreply@${domain}>`);
  form.set("to", to);
  form.set("subject", subject);
  form.set("text", text);
  if (env.MAILGUN_REPLY_TO) form.set("h:Reply-To", env.MAILGUN_REPLY_TO);

  const send = await fetch(`${host}/v3/${encodeURIComponent(domain)}/messages`, {
    method: "POST",
    headers: auth,
    body: form,
  });
  const body = await send.json().catch(() => ({}));
  console.log(`mailgun -> HTTP ${send.status} ${JSON.stringify(body).slice(0, 300)}`);
  if (!send.ok) {
    if (send.status === 401) console.log("→ API key rejected. Re-copy it from Mailgun → Account → API keys.");
    if (send.status === 403 || /not authorized|recipient/i.test(JSON.stringify(body))) {
      console.log(
        "→ Sandbox domains only deliver to authorized recipients. Add this address under Sandbox → Authorized recipients.",
      );
    }
    process.exitCode = 1;
  }
}
