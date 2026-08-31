export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(message: string): HttpError {
  return new HttpError(404, "not_found", message);
}

export function forbidden(message: string): HttpError {
  return new HttpError(403, "forbidden", message);
}

export function conflict(message: string): HttpError {
  return new HttpError(409, "conflict", message);
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, "bad_request", message);
}
