export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  user_message?: string;
  timestamp?: string;
  path?: string;
}
