import { NextResponse } from "next/server";

const NOMBRE_HTTP: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

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
    error: "Internal server error",
  };
}

export function cuerpoErrorHttp(error: unknown) {
  const { status, error: mensaje } = respuestaError(error);
  return {
    status,
    body: {
      statusCode: status,
      message: mensaje,
      error: NOMBRE_HTTP[status] ?? "Error",
    },
  };
}

export function cuerpoValidacion(mensaje: string | string[], status = 400) {
  const message = Array.isArray(mensaje) ? mensaje : [mensaje];
  return {
    status,
    body: {
      statusCode: status,
      message,
      error: "Bad Request",
    },
  };
}

export function jsonError(error: unknown) {
  const { status, body } = cuerpoErrorHttp(error);
  return NextResponse.json(body, { status });
}

export function jsonValidacion(mensaje: string | string[], status = 400) {
  const { status: codigo, body } = cuerpoValidacion(mensaje, status);
  return NextResponse.json(body, { status: codigo });
}

export function jsonSiHayExtras(
  cuerpo: object,
  permitidas: readonly string[],
) {
  const extras = Object.keys(cuerpo).filter(
    (clave) => !permitidas.includes(clave),
  );

  if (extras.length === 0) {
    return null;
  }

  return jsonValidacion(
    extras.map((propiedad) => `property ${propiedad} should not exist`),
  );
}

export function enteroDesdeDto(valor: unknown) {
  if (typeof valor === "string" && valor.trim() !== "") {
    return Number(valor);
  }

  return valor;
}

export function parseIdParam(valor: string) {
  if (!/^\d+$/.test(valor)) {
    throw new ErrorNegocio(
      "Validation failed (numeric string is expected)",
      400,
    );
  }

  return Number(valor);
}

export function parseIdPagina(valor: string) {
  if (!/^\d+$/.test(valor)) {
    return null;
  }

  return Number(valor);
}
