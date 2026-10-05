export type LoginPayload = {
  email: string;
  password: string;
};

export type UsuarioSesion = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR";
  areaOperativaId: number | null;
};

export type LoginRespuesta = {
  token: string;
  accessToken?: string;
  usuario: UsuarioSesion;
};

export type PaqueteSync = {
  usuario: UsuarioSesion;
  areas: Array<{ id: number; nombre: string }>;
  rondas: Array<{ id: number; nombre: string }>;
  bloques: Array<{
    id: number;
    nombre: string;
    descripcion: string | null;
    orden: number;
    criterios: Array<{
      id: number;
      nombre: string;
      descripcion: string | null;
      orden: number;
    }>;
  }>;
  sectores: Array<{
    id: number;
    numero: number;
    nombre: string | null;
  }>;
  agentes: Array<{
    id: number;
    nombre: string;
    apellido: string;
    sectorId: number | null;
    cobertura: string | null;
    areaOperativaId: number;
  }>;
  supervisiones: Array<{
    id: number;
    fecha: Date | string;
    promedio: number | null;
    clasificacion: string | null;
    decisionGestion: string;
    agenteSanitario: {
      id: number;
      nombre: string;
      apellido: string;
    };
  }>;
  pulledAt: string;
};

export type PendienteSync = {
  localId: string;
  agenteSanitarioId: number;
  areaOperativaId: number;
  sectorId?: number | null;
  rondaId: number;
  fecha: string;
  familiaNumero?: number | null;
  decisionGestion: string;
  fortalezas?: string | null;
  oportunidadesMejora?: string | null;
  situacionesCriticas?: string | null;
  recomendaciones?: string | null;
  evaluaciones: Array<{ criterioId: number; puntuacion: number }>;
};

export class ErrorApi extends Error {
  constructor(
    message: string,
    public status: number,
    public path: string,
  ) {
    super(message);
    this.name = "ErrorApi";
  }
}

export function crearClienteApi(
  baseUrl: string,
  getToken?: () => string | null | Promise<string | null>,
) {
  const url = baseUrl.replace(/\/$/, "");

  async function request<T>(
    path: string,
    init?: RequestInit,
    opciones?: { conToken?: boolean },
  ): Promise<T> {
    const token =
      opciones?.conToken === false ? null : await getToken?.();

    const response = await fetch(`${url}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    const texto = await response.text();
    let datos = {} as T & {
      error?: string;
      message?: string | string[];
    };

    if (texto) {
      try {
        datos = JSON.parse(texto) as typeof datos;
      } catch {
        throw new ErrorApi(
          `Respuesta no JSON: ${texto.slice(0, 180)}`,
          response.status,
          path,
        );
      }
    }

    if (!response.ok) {
      const mensaje =
        Array.isArray(datos.message) && datos.message.length > 0
          ? datos.message.filter((item) => typeof item === "string").join(", ")
          : typeof datos.message === "string" && datos.message.length > 0
            ? datos.message
            : typeof datos.error === "string" &&
                datos.error.length > 0 &&
                ![
                  "Bad Request",
                  "Unauthorized",
                  "Forbidden",
                  "Not Found",
                  "Conflict",
                  "Internal Server Error",
                  "Too Many Requests",
                ].includes(datos.error)
              ? datos.error
              : `API ${response.status}: ${path}`;

      throw new ErrorApi(mensaje, response.status, path);
    }

    return datos;
  }

  return {
    health: () =>
      request<{ status: string; db?: string }>("/api/v1/health"),
    login: (datos: LoginPayload) =>
      request<LoginRespuesta>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: datos.email.trim().toLowerCase(),
            password: datos.password,
          }),
        },
        { conToken: false },
      ).then((respuesta) => {
        const token = respuesta.token || respuesta.accessToken || "";
        if (!token || !respuesta.usuario) {
          throw new ErrorApi(
            "La API no devolvió token o usuario",
            200,
            "/api/v1/auth/login",
          );
        }
        return {
          ...respuesta,
          token,
        };
      }),
    pull: () => request<PaqueteSync>("/api/v1/sync/pull"),
    push: (pendientes: PendienteSync[]) =>
      request<{
        resultados: Array<{
          localId: string;
          ok: boolean;
          remoteId?: number;
          error?: string;
        }>;
      }>("/api/v1/sync/push", {
        method: "POST",
        body: JSON.stringify({ pendientes }),
      }),
    me: () => request<UsuarioSesion>("/api/v1/auth/me"),
    rondas: () => request("/api/v1/rondas"),
    zonas: () => request("/api/v1/zonas"),
    areas: () => request("/api/v1/areas"),
    sectoresPorArea: (areaOperativaId: number) =>
      request(`/api/v1/sectores/area/${areaOperativaId}`),
    agentesPorArea: (areaOperativaId: number) =>
      request(`/api/v1/agentes/area/${areaOperativaId}`),
    bloquesActivos: () => request("/api/v1/bloques/activos"),
    bloques: () => request("/api/v1/bloques"),
    bloque: (id: number) => request(`/api/v1/bloques/${id}`),
    criterios: () => request("/api/v1/criterios"),
    criteriosPorBloque: (bloqueId: number) =>
      request(`/api/v1/criterios/bloque/${bloqueId}`),
    agente: (id: number) => request(`/api/v1/agentes/${id}`),
    supervisionesPorAgente: (agenteId: number) =>
      request(`/api/v1/supervisiones/agente/${agenteId}`),
    misSupervisiones: (query = "") =>
      request(`/api/v1/supervisiones/mis-supervisiones${query}`),
    supervision: (id: number) => request(`/api/v1/supervisiones/${id}`),
    exportacion: () => request("/api/v1/supervisiones/exportacion"),
    misMetricas: () => request("/api/v1/supervisiones/mis-metricas"),
    metricas: () => request("/api/v1/supervisiones/metricas"),
  };
}
