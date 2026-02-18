import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@intellicampus/shared';

/**
 * Middleware factory that restricts access to specific roles.
 * Must be used AFTER authenticate middleware.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
