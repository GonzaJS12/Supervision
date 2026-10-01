export class ErrorNegocio extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function respuestaError(error: unknown) {
  if (error instanceof ErrorNegocio) {
    return {
      status: error.status,
      error: error.message,
    };
  }

  return {
    status: 500,
    error:
      error instanceof Error
        ? error.message
        : "Error interno",
  };
}
