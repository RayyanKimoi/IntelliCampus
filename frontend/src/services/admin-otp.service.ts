import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendAdminOTP } from '@/lib/email';

export const adminOTPService = {
  /**
   * Generate and send OTP to admin email
   */
  async generateAndSendOTP(email: string) {
    // Clean up expired OTPs
    await prisma.adminOTP.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Hash OTP before storing
    const otpHash = await bcrypt.hash(otp, 10);
    
    // Store in database (expires in 5 minutes)
    await prisma.adminOTP.create({
      data: {
        email: email.toLowerCase(),
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Send email
    await sendAdminOTP(email, otp);

    return { success: true };
  },

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string) {
    // Find valid OTP
    const record = await prisma.adminOTP.findFirst({
      where: {
        email: email.toLowerCase(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { success: false, error: 'Invalid or expired OTP' };
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, record.otpHash);

    if (!isValid) {
      return { success: false, error: 'Invalid OTP' };
    }

    // Mark as used
    await prisma.adminOTP.update({
      where: { id: record.id },
      data: { used: true },
    });

    return { success: true };
  },
};

