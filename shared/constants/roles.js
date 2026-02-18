"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.ROLE_LABELS = exports.ROLES = void 0;
const user_1 = require("../types/user");
exports.ROLES = {
    STUDENT: user_1.UserRole.STUDENT,
    TEACHER: user_1.UserRole.TEACHER,
    ADMIN: user_1.UserRole.ADMIN,
};
exports.ROLE_LABELS = {
    [user_1.UserRole.STUDENT]: 'Student',
    [user_1.UserRole.TEACHER]: 'Teacher',
    [user_1.UserRole.ADMIN]: 'Admin',
};
exports.ROLE_PERMISSIONS = {
    [user_1.UserRole.STUDENT]: [
        'view:courses',
        'view:assignments',
        'submit:assignments',
        'use:ai-chat',
        'view:own-analytics',
        'play:gamification',
    ],
    [user_1.UserRole.TEACHER]: [
        'view:courses',
        'manage:courses',
        'manage:curriculum',
        'manage:assignments',
        'view:student-analytics',
        'view:class-insights',
    ],
    [user_1.UserRole.ADMIN]: [
        'manage:users',
        'manage:institution',
        'manage:governance',
        'manage:accessibility',
        'view:system-analytics',
        'manage:ai-policy',
    ],
};
//# sourceMappingURL=roles.js.map