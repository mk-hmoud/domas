export interface AuditUserContext {
  userId: string; // UUID
  username: string;
  isRecoveryAdmin?: boolean;
  permissions?: string[];
  ipAddress: string;
  userAgent?: string;
}
