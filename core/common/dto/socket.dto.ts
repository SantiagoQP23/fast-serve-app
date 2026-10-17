/**
 * Response for websocket requests
 * @version v1.0 22-12-2023
 */
export interface SocketResponse {
  ok: boolean;
  msg: string;
  /** Stable error code the app can translate (e.g. ORDER_CLOSED). */
  code?: string;
  /** Values for the translated error message (e.g. productName, available). */
  details?: Record<string, unknown>;
}

/**
 * Response for websocket requests with data
 * @version v1.0 22-12-2023
 */
export interface SocketResponseData<T> extends SocketResponse {
  data?: T;
}

export interface SocketEvent<T> {
  msg: string;
  data: T;
}
