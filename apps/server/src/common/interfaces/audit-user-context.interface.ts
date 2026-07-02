import { LocationScope } from './location-scope.interface';

export interface AuditUserContext {
  userId: string; // UUID
  username: string;
  isRecoveryAdmin?: boolean;
  permissions?: string[];
  roles?: { name: string }[];
  locationScope?: LocationScope;
  ipAddress: string;
  userAgent?: string;
  operationContext?: string;
}
