import { emailProvider } from './_email.js'
import { withMonitoring } from './_monitor.js'
import { smsProvider } from './_sms.js'

// Integration status for the administrator consoles. Booleans and provider
// names only — no keys or configuration values leave the server.
async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  res.status(200).json({
    payments: Boolean(process.env.PAYSTACK_SECRET_KEY),
    email: Boolean(emailProvider()),
    emailProvider: emailProvider(),
    sms: Boolean(smsProvider()),
    smsProvider: smsProvider(),
  })
}

export default withMonitoring(handler)
