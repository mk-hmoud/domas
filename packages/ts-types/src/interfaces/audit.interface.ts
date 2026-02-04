export interface AuditLogEntry {
  event_id: string; // BigInt serialized as string usually
  user_id: string;
  username?: string;
  ip_address?: string;
  user_agent?: string;
  event_type: string;
  action?: string; // 'I', 'U', 'D', 'T'
  schema_name: string;
  table_name: string;
  record_id?: string;
  event_timestamp: string; // ISO Date
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
  operation_context?: string;
  query_text?: string;
  session_id?: string;
  request_id?: string;
  is_system_operation?: boolean;
}

export interface RecentChange {
  event_timestamp: string;
  username: string;
  table_name: string;
  action: string;
  record_id: string;
  changed_fields: string[];
  ip_address: string;
}

export interface SuspiciousActivity {
  user_id: string;
  username: string;
  failure_count: number;
  ip_addresses: string[];
  last_attempt: string;
}

export interface BulkOperation {
  op_id: string;
  event_timestamp: string;
  username: string;
  operation_type: string;
  affected_count: number;
  resource_type: string;
}

export interface UndoLog {
  id: string;
  eventTimestamp: string;
  userId: string;
  performedByEmail?: string;
  performedByName?: string;
  sessionId?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  undoData: any;
  redoData?: any;
  description?: string;
  undoneAt?: string;
  undoneBy?: string;
  expiresAt: string;
  deletedAt?: string;
}
