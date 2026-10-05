import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, requerirSesion } from "@/lib/requerir";
import { jsonError, jsonSiHayExtras, jsonValidacion, ErrorNegocio } from "@/lib/errores";
import {
  crearSupervision,
  listarSupervisiones,
} from "@/lib/server/supervisiones";
import type { DecisionGestion } from "@supervision/domain";

export async function GET(request: NextRequest) {
  const sesion = await requerirAdmin();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const params = request.nextUrl.searchParams;

  try {
    const resultado = await listarSupervisiones(sesion, {
      page: Number(params.get("page") ?? 1),
      limit: params.get("limit")
        ? Number(params.get("limit"))
        : undefined,
      fechaDesde: params.get("fechaDesde") ?? undefined,
      fechaHasta: params.get("fechaHasta") ?? undefined,
      clasificacion: params.get("clasificacion") ?? undefined,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  if (sesion.rol !== "ADMIN" && sesion.rol !== "SUPERVISOR") {
    return jsonError(
      new ErrorNegocio(
        "No tiene permiso para realizar esta operacion",
        403,
      ),
    );
  }

  let cuerpo: {
    agenteSanitarioId?: number;
    areaOperativaId?: number;
    sectorId?: number | null;
    rondaId?: number;
    fecha?: string;
    familiaNumero?: number | null;
    decisionGestion?: DecisionGestion;
    fortalezas?: string;
    oportunidadesMejora?: string;
    situacionesCriticas?: string;
    recomendaciones?: string;
    evaluaciones?: Array<{ criterioId: number; puntuacion: number }>;
  };

  try {
    cuerpo = (await request.json()) as typeof cuerpo;
  } catch {
    return jsonValidacion("agenteSanitarioId must be an integer number");
  }

  const extras = jsonSiHayExtras(cuerpo, [
    "agenteSanitarioId",
    "areaOperativaId",
    "sectorId",
    "rondaId",
    "fecha",
    "familiaNumero",
    "decisionGestion",
    "fortalezas",
    "oportunidadesMejora",
    "situacionesCriticas",
    "recomendaciones",
    "evaluaciones",
  ]);
  if (extras) {
    return extras;
  }

  if (!Number.isInteger(cuerpo.agenteSanitarioId)) {
    return jsonValidacion("agenteSanitarioId must be an integer number");
  }

  if ((cuerpo.agenteSanitarioId ?? 0) < 1) {
    return jsonValidacion("agenteSanitarioId must not be less than 1");
  }

  if (!Number.isInteger(cuerpo.areaOperativaId)) {
    return jsonValidacion("areaOperativaId must be an integer number");
  }

  if ((cuerpo.areaOperativaId ?? 0) < 1) {
    return jsonValidacion("areaOperativaId must not be less than 1");
  }

  if (!Number.isInteger(cuerpo.rondaId)) {
    return jsonValidacion("rondaId must be an integer number");
  }

  if ((cuerpo.rondaId ?? 0) < 1) {
    return jsonValidacion("rondaId must not be less than 1");
  }

  if (!cuerpo.fecha || Number.isNaN(Date.parse(cuerpo.fecha))) {
    return jsonValidacion("fecha must be a valid ISO 8601 date string");
  }

  if (
    cuerpo.decisionGestion !== "NO_REQUIERE" &&
    cuerpo.decisionGestion !== "SEGUIMIENTO" &&
    cuerpo.decisionGestion !== "CAPACITACION" &&
    cuerpo.decisionGestion !== "SUPERVISION_INTENSIVA"
  ) {
    return jsonValidacion(
      "decisionGestion must be one of the following values: NO_REQUIERE, SEGUIMIENTO, CAPACITACION, SUPERVISION_INTENSIVA",
    );
  }

  if (!Array.isArray(cuerpo.evaluaciones) || cuerpo.evaluaciones.length === 0) {
    return jsonValidacion("evaluaciones should not be empty");
  }

  if (cuerpo.sectorId != null) {
    if (!Number.isInteger(cuerpo.sectorId)) {
      return jsonValidacion("sectorId must be an integer number");
    }

    if (cuerpo.sectorId < 1) {
      return jsonValidacion("sectorId must not be less than 1");
    }
  }

  if (cuerpo.familiaNumero != null) {
    if (!Number.isInteger(cuerpo.familiaNumero)) {
      return jsonValidacion("familiaNumero must be an integer number");
    }

    if (cuerpo.familiaNumero < 1) {
      return jsonValidacion("familiaNumero must not be less than 1");
    }
  }

  for (const evaluacion of cuerpo.evaluaciones) {
    if (!Number.isInteger(evaluacion.criterioId)) {
      return jsonValidacion("criterioId must be an integer number");
    }

    if ((evaluacion.criterioId ?? 0) < 1) {
      return jsonValidacion("criterioId must not be less than 1");
    }

    if (!Number.isInteger(evaluacion.puntuacion)) {
      return jsonValidacion("puntuacion must be an integer number");
    }

    if (evaluacion.puntuacion < 1) {
      return jsonValidacion("puntuacion must not be less than 1");
    }

    if (evaluacion.puntuacion > 5) {
      return jsonValidacion("puntuacion must not be greater than 5");
    }
  }

  const camposTexto = [
    ["fortalezas", cuerpo.fortalezas],
    ["oportunidadesMejora", cuerpo.oportunidadesMejora],
    ["situacionesCriticas", cuerpo.situacionesCriticas],
    ["recomendaciones", cuerpo.recomendaciones],
  ] as const;

  for (const [campo, valor] of camposTexto) {
    if (valor !== undefined && typeof valor !== "string") {
      return jsonValidacion(`${campo} must be a string`);
    }
  }

  try {
    const supervision = await crearSupervision(sesion, {
      agenteSanitarioId: Number(cuerpo.agenteSanitarioId),
      areaOperativaId: Number(cuerpo.areaOperativaId),
      sectorId: cuerpo.sectorId ?? null,
      rondaId: Number(cuerpo.rondaId),
      fecha: cuerpo.fecha,
      familiaNumero: cuerpo.familiaNumero ?? null,
      decisionGestion: cuerpo.decisionGestion,
      fortalezas: cuerpo.fortalezas,
      oportunidadesMejora: cuerpo.oportunidadesMejora,
      situacionesCriticas: cuerpo.situacionesCriticas,
      recomendaciones: cuerpo.recomendaciones,
      evaluaciones: cuerpo.evaluaciones ?? [],
    });

    return NextResponse.json(supervision, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
