import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { UserRole } from '@intellicampus/shared';
import {
  getAdminDashboard,
  listUsers,
  getUser,
  deleteUser,
  getAIPolicy,
  updateAIPolicy,
  getStudentAccessibility,
  updateStudentAccessibility,
  getSystemUsage,
  getInstitution,
} from '../controllers/admin.controller';

const router = Router();

// All routes require admin auth
router.use(authenticate, authorize(UserRole.ADMIN));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Institution
router.get('/institution', getInstitution);

// User management
router.get('/users', listUsers);
router.get('/users/:userId', getUser);
router.delete('/users/:userId', deleteUser);

// AI governance
router.get('/ai-policy', getAIPolicy);
router.put('/ai-policy', updateAIPolicy);

// Accessibility
router.get('/users/:studentId/accessibility', getStudentAccessibility);
router.put('/users/:studentId/accessibility', updateStudentAccessibility);

// System usage
router.get('/usage', getSystemUsage);

export default router;
