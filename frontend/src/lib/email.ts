import { env } from './env';

/**
 * Email Service using Resend
 * 
 * For development without Resend API key, logs OTP to console
 */

interface SendOTPEmailParams {
  to: string;
  otp: string;
  purpose?: string;
}

export async function sendAdminOTP(email: string, otp: string): Promise<void> {
  const apiKey = env.RESEND_API_KEY;

  // Development fallback: log to console
  if (!apiKey || env.isDev) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 ADMIN OTP EMAIL (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Expires: 5 minutes`);
    console.log('='.repeat(60) + '\n');
    return;
  }

  try {
    // Use Resend API in production
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'IntelliCampus <onboarding@resend.dev>', // Change to your verified domain
        to: email,
        subject: 'Your Admin Login Verification Code',
        html: generateOTPEmailHTML(otp),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log(`✅ Admin OTP email sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    // Fallback to console in case of error
    console.log('\n⚠️  Email sending failed. OTP Code:', otp, '\n');
  }
}

function generateOTPEmailHTML(otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background-color: #f6f9fc;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; border: 1px solid #e5e7eb; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                      🎓 IntelliCampus
                    </h1>
                    <p style="margin: 8px 0 0; color: #e5e7eb; font-size: 16px; text-align: center;">
                      Admin Login Verification
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                      Hello Admin,
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                      You've requested to log in to your IntelliCampus admin account. Please use the verification code below to complete your login:
                    </p>
                    
                    <!-- OTP Code Box -->
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td align="center" style="padding: 30px 20px; background-color: #f9fafb; border-radius: 8px; border: 2px dashed #d1d5db;">
                          <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace;">
                            ${otp}
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                      ⏱️ This code will expire in <strong>5 minutes</strong>.
                    </p>
                    
                    <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                      🔒 For security reasons, do not share this code with anyone.
                    </p>
                    
                    <!-- Warning Box -->
                    <table role="presentation" style="width: 100%; margin: 20px 0;">
                      <tr>
                        <td style="padding: 16px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                            ⚠️ If you didn't request this code, please ignore this email and ensure your account is secure.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                      IntelliCampus Admin Portal
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
