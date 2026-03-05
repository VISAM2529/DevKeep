import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export async function sendVerificationEmail(
    to: string,
    name: string,
    token: string
): Promise<void> {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your DevKeep email</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111118;border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9 0%,#4f46e5 100%);padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;display:inline-block;line-height:40px;text-align:center;">
                  <span style="color:white;font-size:20px;font-weight:900;">&lt;/&gt;</span>
                </div>
                <span style="color:white;font-size:24px;font-weight:800;letter-spacing:-0.5px;">DevKeep</span>
              </div>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Email Verification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 12px;letter-spacing:-0.5px;">Verify your email address</h1>
              <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 8px;">Hi <strong style="color:rgba(255,255,255,0.9);">${name}</strong>,</p>
              <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 32px;">
                Welcome to DevKeep! To complete your account setup and access your workspace, please verify your email address by clicking the button below.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6d28d9 0%,#4f46e5 100%);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 24px rgba(109,40,217,0.4);">
                       ✓ &nbsp; Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="color:rgba(255,255,255,0.35);font-size:12px;text-align:center;margin:20px 0 0;">
                Or copy this link into your browser:<br/>
                <a href="${verifyUrl}" style="color:#7c3aed;word-break:break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px 36px;">
              <p style="color:rgba(255,255,255,0.3);font-size:13px;line-height:1.6;margin:0 0 8px;">
                ⏱ &nbsp;<strong>This link expires in 15 minutes.</strong>
              </p>
              <p style="color:rgba(255,255,255,0.25);font-size:13px;line-height:1.6;margin:0;">
                If you didn't create a DevKeep account, you can safely ignore this email. No action is required.
              </p>
              <p style="color:rgba(255,255,255,0.15);font-size:12px;margin:24px 0 0;text-align:center;">
                © ${new Date().getFullYear()} DevKeep · Secure Developer Workspace
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
        from: `"DevKeep" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Verify your DevKeep email address",
        html,
    });
}
