// Integration status for the administrator consoles. Booleans only — no keys
// or configuration values leave the server.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  res.status(200).json({
    payments: Boolean(process.env.PAYSTACK_SECRET_KEY),
    email: Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
  })
}
