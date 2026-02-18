import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export class AccessibilityService {
  /**
   * Get accessibility settings for a user
   */
  async getSettings(userId: string) {
    const settings = await prisma.accessibilitySettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return prisma.accessibilitySettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Update accessibility settings
   */
  async updateSettings(
    userId: string,
    data: {
      adhdMode?: boolean;
      dyslexiaFont?: boolean;
      highContrast?: boolean;
      speechEnabled?: boolean;
      focusMode?: boolean;
      fontScale?: number;
    }
  ) {
    const settings = await prisma.accessibilitySettings.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });

    logger.info('AccessibilityService', `Settings updated for user ${userId}`);
    return settings;
  }

  /**
   * Admin: Set accessibility for a specific student
   */
  async adminSetStudentAccessibility(
    studentId: string,
    data: {
      adhdMode?: boolean;
      dyslexiaFont?: boolean;
      highContrast?: boolean;
      speechEnabled?: boolean;
      focusMode?: boolean;
      fontScale?: number;
    }
  ) {
    return this.updateSettings(studentId, data);
  }

  /**
   * Admin: Bulk enable accessibility for all students in institution
   */
  async bulkEnableFeature(
    institutionId: string,
    feature: string,
    value: boolean
  ) {
    const students = await prisma.user.findMany({
      where: {
        institutionId,
        role: 'student',
      },
      select: { id: true },
    });

    const updateData: Record<string, boolean> = {};
    updateData[feature as string] = value;

    const updates = students.map((student) =>
      prisma.accessibilitySettings.upsert({
        where: { userId: student.id },
        create: {
          userId: student.id,
          ...updateData,
        },
        update: updateData,
      })
    );

    await prisma.$transaction(updates);

    logger.info(
      'AccessibilityService',
      `Bulk ${feature} set to ${value} for ${students.length} students`
    );

    return { updated: students.length };
  }
}

export const accessibilityService = new AccessibilityService();
