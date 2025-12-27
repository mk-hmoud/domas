export interface AuditUserContext {
  userId: string; // UUID
  username: string;
  ipAddress: string;
  userAgent?: string;
}
