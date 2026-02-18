import { UserRole } from '../types/user';
export declare const ROLES: {
    readonly STUDENT: UserRole.STUDENT;
    readonly TEACHER: UserRole.TEACHER;
    readonly ADMIN: UserRole.ADMIN;
};
export declare const ROLE_LABELS: Record<UserRole, string>;
export declare const ROLE_PERMISSIONS: {
    readonly student: readonly ["view:courses", "view:assignments", "submit:assignments", "use:ai-chat", "view:own-analytics", "play:gamification"];
    readonly teacher: readonly ["view:courses", "manage:courses", "manage:curriculum", "manage:assignments", "view:student-analytics", "view:class-insights"];
    readonly admin: readonly ["manage:users", "manage:institution", "manage:governance", "manage:accessibility", "view:system-analytics", "manage:ai-policy"];
};
//# sourceMappingURL=roles.d.ts.map