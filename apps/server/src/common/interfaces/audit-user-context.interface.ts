export interface AuditUserContext {
  userId: string; // UUID
  username: string;
  isRecoveryAdmin?: boolean;
  permissions?: string[];
  roles?: { name: string }[];
  ipAddress: string;
  userAgent?: string;
}
