import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import {
  crearSupervision,
  listarSupervisiones,
} from "@/lib/server/supervisiones";
import type { DecisionGestion } from "@supervision/domain";

export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const params = request.nextUrl.searchParams;

  try {
    const resultado = await listarSupervisiones(sesion, {
      page: Number(params.get("page") ?? 1),
      fechaDesde: params.get("fechaDesde") ?? undefined,
      fechaHasta: params.get("fechaHasta") ?? undefined,
      clasificacion: params.get("clasificacion") ?? undefined,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}

export async function POST(request: Request) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const cuerpo = (await request.json()) as {
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

  if (
    !cuerpo.agenteSanitarioId ||
    !cuerpo.areaOperativaId ||
    !cuerpo.rondaId ||
    !cuerpo.fecha ||
    !cuerpo.decisionGestion
  ) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios" },
      { status: 400 },
    );
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
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
