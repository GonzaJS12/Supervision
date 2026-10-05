export function parsearFecha(valor: Date | string) {
  if (valor instanceof Date) {
    return valor;
  }

  const isoSoloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (isoSoloDia) {
    return new Date(
      Number(isoSoloDia[1]),
      Number(isoSoloDia[2]) - 1,
      Number(isoSoloDia[3]),
    );
  }

  const isoConHora = /^(\d{4})-(\d{2})-(\d{2})T/.exec(valor);
  if (isoConHora) {
    return new Date(
      Number(isoConHora[1]),
      Number(isoConHora[2]) - 1,
      Number(isoConHora[3]),
    );
  }

  const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim());
  if (local) {
    return new Date(
      Number(local[3]),
      Number(local[2]) - 1,
      Number(local[1]),
    );
  }

  return new Date(valor);
}

export function formatearFecha(valor: Date | string | null | undefined) {
  if (valor == null || valor === "") {
    return "—";
  }

  const fecha = parsearFecha(valor);
  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

export function formatearFechaHora(valor: Date | string | null | undefined) {
  if (valor == null || valor === "") {
    return "—";
  }

  const fecha = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  const hora = String(fecha.getHours()).padStart(2, "0");
  const minuto = String(fecha.getMinutes()).padStart(2, "0");
  return `${formatearFecha(fecha)} ${hora}:${minuto}`;
}

export function hoyEnDdMmAaaa() {
  return formatearFecha(new Date());
}

export function enmascararFecha(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) {
    return digitos;
  }
  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function isoDesdeDdMmAaaa(texto: string) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) {
    return null;
  }

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const anio = Number(partes[3]);
  const fecha = new Date(anio, mes - 1, dia);

  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }

  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}
