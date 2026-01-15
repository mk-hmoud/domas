export class AuditLogEntry {
  event_id!: string;
  user_id!: string;
  username?: string;
  ip_address?: string;
  user_agent?: string;
  event_type!: string;
  action?: string;
  schema_name!: string;
  table_name!: string;
  record_id?: string;
  event_timestamp!: Date;
  old_values?: any;
  new_values?: any;
  changed_fields?: string[];
  operation_context?: string;
  query_text?: string;
  session_id?: string;
  request_id?: string;
  is_system_operation?: boolean;

  constructor(partial: Partial<AuditLogEntry>) {
    Object.assign(this, partial);
  }
}
