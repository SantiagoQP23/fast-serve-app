import i18n from "@/core/i18n/i18n.config";
import { AppApiError, getApiError } from "./api-response";

const STATUS_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  500: "INTERNAL_SERVER_ERROR",
};

interface GetErrorMessageOptions {
  /**
   * Usa el mensaje del servidor cuando el código no tiene traducción
   * específica. Útil mientras un módulo del backend aún no envía códigos.
   */
  fallbackToServerMessage?: boolean;
}

const translateCode = (code: string | undefined) =>
  code && i18n.exists(`errors:codes.${code}`)
    ? i18n.t(`errors:codes.${code}`)
    : undefined;

/**
 * Mensaje para mostrar al usuario en su idioma a partir de cualquier error.
 * Orden: traducción del código > (opcional) mensaje del servidor >
 * traducción genérica por status > "Algo salió mal".
 */
export const getErrorMessage = (
  error: unknown,
  { fallbackToServerMessage = false }: GetErrorMessageOptions = {},
): string => {
  const apiError: AppApiError = getApiError(error);
  const isGenericCode = apiError.status
    ? STATUS_CODES[apiError.status] === apiError.code
    : false;

  if (!isGenericCode) {
    const specific = translateCode(apiError.code);
    if (specific) return specific;
  }

  if (fallbackToServerMessage && apiError.status && apiError.message) {
    return apiError.message;
  }

  return (
    translateCode(
      apiError.status ? STATUS_CODES[apiError.status] : undefined,
    ) ??
    translateCode(apiError.code) ??
    i18n.t("errors:general.somethingWrong")
  );
};
