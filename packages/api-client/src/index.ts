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

export function crearClienteApi(
  baseUrl: string,
  getToken?: () => string | null | Promise<string | null>,
) {
  const url = baseUrl.replace(/\/$/, "");

  async function request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const token = await getToken?.();

    const response = await fetch(`${url}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    const datos = (await response.json().catch(() => ({}))) as T & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        datos.error ?? `API ${response.status}: ${path}`,
      );
    }

    return datos;
  }

  return {
    health: () =>
      request<{ status: string; db?: string }>("/api/v1/health"),
    login: (datos: LoginPayload) =>
      request<LoginRespuesta>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(datos),
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
    me: () => request<{ usuario: UsuarioSesion }>("/api/v1/auth/me"),
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
  };
}
