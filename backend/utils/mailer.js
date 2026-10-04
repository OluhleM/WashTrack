// Sends email over HTTPS (Brevo API). Render blocks SMTP ports, so Gmail/Nodemailer will not work there.
async function sendOtpEmail(to, name, code) {
    if (!process.env.BREVO_API_KEY) {
        if (process.env.OTP_DEV_MODE === 'true') {
            console.log(`[DEV] OTP for ${to}: ${code}`);
            return;
        }
        throw new Error('BREVO_API_KEY is not set');
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'WashTrack', email: process.env.MAIL_FROM_EMAIL },
            to: [{ email: to, name }],
            subject: `${code} is your WashTrack verification code`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
              <h2 style="color:#1557a6;margin:0 0 8px">WashTrack</h2>
              <p>Hi ${String(name).replace(/[<>&]/g, '')}, use this code to verify your email:</p>
              <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:16px 0">${code}</p>
              <p style="color:#666">It expires in 10 minutes. If you didn't sign up, ignore this email.</p>
            </div>`
        })
    });

    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

module.exports = { sendOtpEmail };