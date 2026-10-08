import { isAxiosError } from "axios";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponseMeta {
  total?: number;
  limit?: number;
  offset?: number;
}

/**
 * Formato común de las respuestas del backend.
 * El interceptor de `restaurantApi` ya deja `response.data` con el payload,
 * así que este tipo solo se usa para leer errores o el body crudo.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T | null;
  error: ApiError | null;
  meta?: ApiResponseMeta;
  timestamp: string;
  path: string;
}

export const GenericErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export const isApiResponse = (body: unknown): body is ApiResponse =>
  typeof body === "object" &&
  body !== null &&
  "success" in body &&
  "statusCode" in body;

/** Error normalizado, venga de axios, de la red o de cualquier otro lado. */
export interface AppApiError extends ApiError {
  status?: number;
  /** true cuando el código vino del backend (no es un fallback de la app). */
  fromServer: boolean;
}

export const getApiError = (error: unknown): AppApiError => {
  if (isAxiosError(error)) {
    if (!error.response) {
      return {
        code: GenericErrorCodes.NETWORK_ERROR,
        message: error.message,
        fromServer: false,
      };
    }

    const body = error.response.data as
      | { error?: Partial<ApiError> | null; message?: unknown }
      | undefined;

    if (body?.error?.code) {
      return {
        code: body.error.code,
        message: body.error.message ?? error.message,
        details: body.error.details,
        status: error.response.status,
        fromServer: true,
      };
    }

    return {
      code: GenericErrorCodes.UNKNOWN_ERROR,
      message: typeof body?.message === "string" ? body.message : error.message,
      status: error.response.status,
      fromServer: false,
    };
  }

  return {
    code: GenericErrorCodes.UNKNOWN_ERROR,
    message: error instanceof Error ? error.message : String(error),
    fromServer: false,
  };
};
