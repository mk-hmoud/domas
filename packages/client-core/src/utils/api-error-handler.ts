import { notifications } from "@mantine/notifications";
import { AxiosError } from "axios";

export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  user_message?: string;
  timestamp?: string;
  path?: string;
}

export function handleApiError(
  error: unknown,
  fallbackMessage: string = "An error occurred",
) {
  let title = "Error";
  let message = fallbackMessage;

  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiErrorResponse;

    // Prefer user_message from backend if available
    if (data.user_message) {
      message = data.user_message;
    } else if (data.message) {
      // Fallback to technical message if no user_message, but maybe sanitize it?
      // Backend filter says: message = exception.message (which can be "Internal Server Error" or validation string)
      message = data.message;
    }

    // Map status/code to title if relevant
    if (data.status === 403) title = "Access Denied";
    if (data.status === 404) title = "Not Found";
    if (data.status === 409) title = "Conflict";
    if (data.code === "VALIDATION_ERROR") title = "Validation Error";
  } else if (error instanceof Error) {
    message = error.message;
  }

  notifications.show({
    title,
    message,
    color: "red",
  });
}

function isAxiosError(payload: any): payload is AxiosError {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "isAxiosError" in payload &&
    payload.isAxiosError === true
  );
}
