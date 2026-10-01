import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirPrisma = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(dirPrisma, '../../..');

config({ path: path.join(raiz, '.env') });

function urlDeImportacion(): string {
  const directa =
    process.env.DIRECT_URL?.trim();

  const pooled =
    process.env.DATABASE_URL?.trim();

  const base = directa || pooled;

  if (!base) {
    throw new Error(
      'Falta DATABASE_URL o DIRECT_URL para importar',
    );
  }

  return base;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: urlDeImportacion(),
    },
  },
});

async function esperar(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function esErrorDeConexion(
  error: unknown,
): boolean {
  const codigo =
    (error as { code?: string }).code;

  return (
    codigo === 'P1001' ||
    codigo === 'P1017' ||
    codigo === 'P2024'
  );
}

async function conReintento<T>(
  operacion: () => Promise<T>,
  intentos = 6,
): Promise<T> {
  let ultimoError: unknown;

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await operacion();
    } catch (error) {
      ultimoError = error;

      if (!esErrorDeConexion(error) || intento === intentos) {
        throw error;
      }

      const espera = Math.min(2000 * intento, 12000);

      console.warn(
        `Neon no responde. Reintento ${intento}/${intentos} en ${espera}ms...`,
      );

      await esperar(espera);

      try {
        await prisma.$connect();
      } catch {
        /*
         * El siguiente intento vuelve a conectar.
         */
      }
    }
  }

  throw ultimoError;
}

const archivoDatos = path.join(
  dirPrisma,
  'datos-territoriales.sql',
);
const archivoUsuarios = path.join(
  dirPrisma,
  'datos-users.sql',
);

/*
 * Convierte un valor proveniente del
 * INSERT de MySQL.
 */
function convertirValor(valor: string): string | null {
  const limpio = valor.trim();

  if (limpio.toUpperCase() === 'NULL') {
    return null;
  }

  if (
    limpio.startsWith("'") &&
    limpio.endsWith("'")
  ) {
    return limpio
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/''/g, "'");
  }

  return limpio;
}

/*
 * Divide una fila SQL respetando
 * valores que contienen comas dentro
 * de textos entre comillas.
 */
function dividirColumnas(fila: string): string[] {
  const columnas: string[] = [];

  let actual = '';
  let dentroComillas = false;

  for (let i = 0; i < fila.length; i++) {
    const caracter = fila[i];

    if (caracter === "'") {
      /*
       * Detectamos comillas escapadas
       * mediante dos comillas simples.
       */
      if (
        dentroComillas &&
        fila[i + 1] === "'"
      ) {
        actual += "''";
        i++;
        continue;
      }

      dentroComillas = !dentroComillas;
      actual += caracter;
      continue;
    }

    if (
      caracter === ',' &&
      !dentroComillas
    ) {
      columnas.push(actual.trim());
      actual = '';
      continue;
    }

    actual += caracter;
  }

  if (actual.trim().length > 0) {
    columnas.push(actual.trim());
  }

  return columnas;
}

/*
 * Busca un INSERT INTO concreto dentro
 * del archivo y devuelve cada tupla.
 */
function obtenerFilas(
  contenido: string,
  tabla: string,
): string[][] {
  const inicioTexto = `INSERT INTO \`${tabla}\``;

  const inicio = contenido.indexOf(inicioTexto);

  if (inicio === -1) {
    throw new Error(
      `No se encontró INSERT INTO ${tabla}`,
    );
  }

  const fin = contenido.indexOf(';', inicio);

  if (fin === -1) {
    throw new Error(
      `No se encontró el final del INSERT de ${tabla}`,
    );
  }

  const bloque = contenido.slice(
    inicio,
    fin + 1,
  );

  const indiceValues =
    bloque.indexOf('VALUES');

  if (indiceValues === -1) {
    throw new Error(
      `No se encontró VALUES en ${tabla}`,
    );
  }

  const valores = bloque.slice(
    indiceValues + 'VALUES'.length,
  );

  const filas: string[][] = [];

  let dentroComillas = false;
  let nivelParentesis = 0;
  let filaActual = '';

  for (
    let i = 0;
    i < valores.length;
    i++
  ) {
    const caracter = valores[i];

    if (caracter === "'") {
      /*
       * Si encontramos '' dentro de un
       * texto no cerramos las comillas.
       */
      if (
        dentroComillas &&
        valores[i + 1] === "'"
      ) {
        filaActual += "''";
        i++;
        continue;
      }

      dentroComillas = !dentroComillas;

      if (nivelParentesis > 0) {
        filaActual += caracter;
      }

      continue;
    }

    if (!dentroComillas) {
      if (caracter === '(') {
        if (nivelParentesis === 0) {
          filaActual = '';
        } else {
          filaActual += caracter;
        }

        nivelParentesis++;
        continue;
      }

      if (caracter === ')') {
        nivelParentesis--;

        if (nivelParentesis === 0) {
          filas.push(
            dividirColumnas(filaActual),
          );

          filaActual = '';
          continue;
        }
      }
    }

    if (nivelParentesis > 0) {
      if (caracter === "'") {
        filaActual += caracter;
      } else {
        filaActual += caracter;
      }
    }
  }

  return filas;
}

async function importarZonas(
  contenido: string,
) {
  console.log('');
  console.log('Importando zonas...');

  const filas = obtenerFilas(
    contenido,
    'zonas',
  );

  let procesadas = 0;

  for (const fila of filas) {
    /*
     * zonas:
     *
     * 0 id
     * 1 idZona
     * 2 nombre
     * 3 codigo
     * 4 created_at
     * 5 updated_at
     */

    const externalZonaId = Number(
      convertirValor(fila[1]),
    );

    const nombre =
      convertirValor(fila[2]);

    const codigo =
      convertirValor(fila[3]);

    if (
      !Number.isInteger(externalZonaId) ||
      !nombre
    ) {
      console.warn(
        'Zona ignorada por datos inválidos:',
        fila,
      );

      continue;
    }

    await conReintento(() =>
      prisma.zona.upsert({
        where: {
          externalZonaId,
        },

        update: {
          nombre,
          codigo,
          activo: true,
        },

        create: {
          externalZonaId,
          nombre,
          codigo,
          activo: true,
        },
      }),
    );

    procesadas++;
  }

  console.log(
    `Zonas procesadas: ${procesadas}`,
  );
}

async function importarAreas(
  contenido: string,
) {
  console.log('');
  console.log('Importando áreas...');

  const filas = obtenerFilas(
    contenido,
    'areas',
  );

  let procesadas = 0;
  let ignoradas = 0;

  for (const fila of filas) {
    /*
     * areas:
     *
     * 0 id
     * 1 idarea
     * 2 idzona
     * 3 nombre
     * 4 estabbase
     * 5 gerentegeneral
     * 6 gerenteatencionpersonas
     * 7 gerenteadministrativo
     * 8 gerentesanitario
     */

    const externalAreaId = Number(
      convertirValor(fila[1]),
    );

    const externalZonaId = Number(
      convertirValor(fila[2]),
    );

    const nombre =
      convertirValor(fila[3]);

    const estabBase =
      convertirValor(fila[4]);

    if (
      !Number.isInteger(externalAreaId) ||
      !Number.isInteger(externalZonaId) ||
      !nombre
    ) {
      console.warn(
        'Área ignorada por datos inválidos:',
        fila,
      );

      ignoradas++;
      continue;
    }

    /*
     * Buscamos nuestra zona local a partir
     * del identificador de la aplicación
     * externa.
     */
    const zona =
      await conReintento(() =>
        prisma.zona.findUnique({
          where: {
            externalZonaId,
          },
        }),
      );

    if (!zona) {
      console.warn(
        `Área ${externalAreaId} ignorada: no existe la zona externa ${externalZonaId}`,
      );

      ignoradas++;
      continue;
    }

    await conReintento(() =>
      prisma.areaOperativa.upsert({
        where: {
          externalAreaId,
        },

        update: {
          zonaId: zona.id,
          nombre: nombre.trim(),
          estabBase:
            estabBase?.trim() || null,
          activo: true,
        },

        create: {
          externalAreaId,
          zonaId: zona.id,
          nombre: nombre.trim(),
          estabBase:
            estabBase?.trim() || null,
          activo: true,
        },
      }),
    );

    procesadas++;
  }

  console.log(
    `Áreas procesadas: ${procesadas}`,
  );

  console.log(
    `Áreas ignoradas: ${ignoradas}`,
  );
}

async function importarRondas(
  contenido: string,
) {
  console.log('');
  console.log('Importando rondas...');

  const filas = obtenerFilas(
    contenido,
    'rondas',
  );

  let procesadas = 0;

  for (const fila of filas) {
    /*
     * rondas:
     *
     * 0 id
     * 1 idronda
     * 2 nombre
     * 3 active
     */

    const externalRondaId = Number(
      convertirValor(fila[1]),
    );

    const nombre =
      convertirValor(fila[2]);

    const active =
      convertirValor(fila[3]);

    if (
      !Number.isInteger(externalRondaId) ||
      !nombre
    ) {
      console.warn(
        'Ronda ignorada por datos inválidos:',
        fila,
      );

      continue;
    }

    const activo =
      active === '1' ||
      active?.toLowerCase() === 'true';

    await conReintento(() =>
      prisma.ronda.upsert({
        where: {
          externalRondaId,
        },

        update: {
          nombre: nombre.trim(),
          activo,
        },

        create: {
          externalRondaId,
          nombre: nombre.trim(),
          activo,
        },
      }),
    );

    procesadas++;
  }

  console.log(
    `Rondas procesadas: ${procesadas}`,
  );
}

async function importarSectores(
  contenido: string,
) {
  console.log('');
  console.log('Importando sectores...');

  const filas = obtenerFilas(
    contenido,
    'sectores',
  );

  /*
   * Primero contamos cuántas veces aparece
   * cada combinación externa:
   *
   * idarea + idsector
   */
  const frecuencia = new Map<string, number>();

  for (const fila of filas) {
    const externalAreaId = Number(
      convertirValor(fila[1]),
    );

    const externalSectorId = Number(
      convertirValor(fila[2]),
    );

    if (
      !Number.isInteger(externalAreaId) ||
      !Number.isInteger(externalSectorId)
    ) {
      continue;
    }

    const clave =
      `${externalAreaId}-${externalSectorId}`;

    frecuencia.set(
      clave,
      (frecuencia.get(clave) ?? 0) + 1,
    );
  }

  let procesados = 0;
  let ignorados = 0;

  const conflictos = new Set<string>();

  for (const fila of filas) {
    /*
     * sectores:
     *
     * 0 id
     * 1 idarea
     * 2 idsector
     * 3 nombre
     * 4 cobertura
     * 5 active
     * 6 idCSalud
     * 7 idCSaludUUID
     * 8 idSectorUUID
     */

    const externalAreaId = Number(
      convertirValor(fila[1]),
    );

    const externalSectorId = Number(
      convertirValor(fila[2]),
    );

    const nombre =
      convertirValor(fila[3]);

    const cobertura =
      convertirValor(fila[4]);

    const active =
      convertirValor(fila[5]);

    const centroSaludRaw =
      convertirValor(fila[6]);

    const centroSaludUuid =
      convertirValor(fila[7]);

    const externalUuid =
      convertirValor(fila[8]);

    if (
      !Number.isInteger(externalAreaId) ||
      !Number.isInteger(externalSectorId) ||
      !nombre
    ) {
      console.warn(
        'Sector ignorado por datos inválidos:',
        fila,
      );

      ignorados++;
      continue;
    }

    const clave =
      `${externalAreaId}-${externalSectorId}`;

    /*
     * Si esa combinación aparece más
     * de una vez en el origen, no decidimos
     * automáticamente cuál es correcta.
     */
    if ((frecuencia.get(clave) ?? 0) > 1) {
      conflictos.add(clave);
      continue;
    }

    const area =
      await conReintento(() =>
        prisma.areaOperativa.findUnique({
          where: {
            externalAreaId,
          },
        }),
      );

    if (!area) {
      console.warn(
        `Sector ignorado: no existe el área externa ${externalAreaId}`,
      );

      ignorados++;
      continue;
    }

    const normalizado =
      String(active ?? '')
        .trim()
        .toLowerCase();

    const activo =
      normalizado === 'true' ||
      normalizado === '1';

    let centroSaludId: number | null =
      null;

    if (centroSaludRaw !== null) {
      const numero =
        Number(centroSaludRaw);

      if (Number.isInteger(numero)) {
        centroSaludId = numero;
      }
    }

    await conReintento(() =>
      prisma.sector.upsert({
        where: {
          areaOperativaId_numero: {
            areaOperativaId: area.id,
            numero: externalSectorId,
          },
        },

        update: {
          externalSectorId,
          externalUuid:
            externalUuid?.trim() || null,

          nombre:
            nombre.trim() || null,

          cobertura:
            cobertura?.trim() || null,

          activo,

          centroSaludId,

          centroSaludUuid:
            centroSaludUuid?.trim() || null,
        },

        create: {
          areaOperativaId: area.id,

          externalSectorId,

          externalUuid:
            externalUuid?.trim() || null,

          numero: externalSectorId,

          nombre:
            nombre.trim() || null,

          cobertura:
            cobertura?.trim() || null,

          activo,

          centroSaludId,

          centroSaludUuid:
            centroSaludUuid?.trim() || null,
        },
      }),
    );

    procesados++;
  }

  console.log(
    `Sectores procesados: ${procesados}`,
  );

  console.log(
    `Sectores ignorados: ${ignorados}`,
  );

  console.log(
    `Combinaciones conflictivas: ${conflictos.size}`,
  );

  if (conflictos.size > 0) {
    console.log('');
    console.log(
      'Sectores con combinación externa duplicada:',
    );

    for (const clave of conflictos) {
      const [area, sector] =
        clave.split('-');

      console.log(
        `- idarea=${area}, idsector=${sector}`,
      );
    }
  }
}

async function main() {
  console.log(
    '=====================================',
  );

  console.log(
    'IMPORTACIÓN DE DATOS TERRITORIALES',
  );

  console.log(
    '=====================================',
  );

  if (!fs.existsSync(archivoDatos)) {
    throw new Error(
      `No existe el archivo: ${archivoDatos}`,
    );
  }

  console.log(
    `Archivo: ${archivoDatos}`,
  );

  /*
   * Importamos manteniendo el orden
   * de dependencias.
   */
  const contenido = fs.readFileSync(
    archivoDatos,
    'utf8',
  );
  const contenidoUsuarios = fs.readFileSync(
  archivoUsuarios,
  'utf8',
  );

  await importarZonas(contenido);

  await importarAreas(contenido);

  await importarRondas(contenido);

  await importarSectores(contenido);

  await importarAgentes(contenidoUsuarios);

  console.log('');
  console.log(
    'Importación finalizada correctamente.',
  );
}

async function importarAgentes(
  contenido: string,
) {
  console.log('');
  console.log('Importando agentes sanitarios...');

  const filas = obtenerFilas(
    contenido,
    'users',
  );

  let procesados = 0;
  let ignorados = 0;
  let sinSector = 0;
  let sectorNoEncontrado = 0;

  const sectoresNoEncontrados =
    new Map<string, number>();

  for (const fila of filas) {
    /*
     * users:
     *
     * 0  id
     * 1  username
     * 2  password
     * 3  apellido
     * 4  nombre
     * 5  email
     * 6  avatar
     * 7  id_area
     * 8  documento
     * 9  role
     * 10 uuid
     * 11 id_sector
     * 12 cobertura
     */

    const externalUserId = Number(
      convertirValor(fila[0]),
    );

    const apellido =
      convertirValor(fila[3]);

    const nombre =
      convertirValor(fila[4]);

    const externalAreaId = Number(
      convertirValor(fila[7]),
    );

    const documento =
      convertirValor(fila[8]);

    const role =
      convertirValor(fila[9]);

    const externalUuid =
      convertirValor(fila[10]);

    const externalSectorId = Number(
      convertirValor(fila[11]),
    );

    const cobertura =
      convertirValor(fila[12]);

    /*
     * Solo importamos personas cuyo rol
     * externo sea agente.
     */
    if (
      role?.trim().toLowerCase() !==
      'agente'
    ) {
      continue;
    }

    if (
      !Number.isInteger(externalUserId) ||
      !Number.isInteger(externalAreaId) ||
      !apellido ||
      !nombre
    ) {
      console.warn(
        `Agente externo ${externalUserId} ignorado por datos inválidos`,
      );

      ignorados++;
      continue;
    }

    /*
     * El área externa es obligatoria para
     * nuestro AgenteSanitario.
     */
    const area =
      await conReintento(() =>
        prisma.areaOperativa.findUnique({
          where: {
            externalAreaId,
          },
        }),
      );

    if (!area) {
      console.warn(
        `Agente externo ${externalUserId} ignorado: no existe el área externa ${externalAreaId}`,
      );

      ignorados++;
      continue;
    }

    let sectorId: number | null = null;

    /*
     * id_sector = 0 significa que el agente
     * todavía no tiene un sector asignado.
     */
    if (
      Number.isInteger(externalSectorId) &&
      externalSectorId > 0
    ) {
      const sector =
        await conReintento(() =>
          prisma.sector.findUnique({
            where: {
              areaOperativaId_numero: {
                areaOperativaId: area.id,
                numero: externalSectorId,
              },
            },
          }),
        );

      if (sector) {
        sectorId = sector.id;
      } else {
        /*
         * Puede ocurrir porque:
         *
         * - el sector no existe en el dump;
         * - o pertenece a una combinación
         *   conflictiva que decidimos no
         *   importar automáticamente.
         *
         * No descartamos al agente.
         */
        sectorNoEncontrado++;

        const clave =
          `${externalAreaId}-${externalSectorId}`;

        sectoresNoEncontrados.set(
          clave,
          (sectoresNoEncontrados.get(clave) ?? 0) +
            1,
        );
      }
    } else {
      sinSector++;
    }

    const uuidLimpio =
      externalUuid?.trim() || null;

    const documentoLimpio =
      documento?.trim() || null;

    const coberturaLimpia =
      cobertura?.trim() || null;

    await conReintento(() =>
      prisma.agenteSanitario.upsert({
      where: {
        externalUserId,
      },

      update: {
        areaOperativaId: area.id,
        sectorId,

        externalUuid: uuidLimpio,

        nombre: nombre.trim(),
        apellido: apellido.trim(),

        documento: documentoLimpio,

        cobertura: coberturaLimpia,

        /*
         * Al existir en el catálogo externo
         * actual lo consideramos activo.
         */
        activo: true,
      },

      create: {
        externalUserId,

        externalUuid: uuidLimpio,

        areaOperativaId: area.id,
        sectorId,

        nombre: nombre.trim(),
        apellido: apellido.trim(),

        documento: documentoLimpio,

        cobertura: coberturaLimpia,

        activo: true,
      },
      }),
    );

    procesados++;
  }

  console.log(
    `Agentes procesados: ${procesados}`,
  );

  console.log(
    `Agentes ignorados: ${ignorados}`,
  );

  console.log(
    `Agentes sin sector asignado: ${sinSector}`,
  );

  console.log(
    `Agentes con sector no relacionado: ${sectorNoEncontrado}`,
  );

  if (sectoresNoEncontrados.size > 0) {
    console.log('');
    console.log(
      'Sectores referenciados por agentes pero no disponibles:',
    );

    for (
      const [
        clave,
        cantidad,
      ] of sectoresNoEncontrados
    ) {
      const [area, sector] =
        clave.split('-');

      console.log(
        `- idarea=${area}, idsector=${sector} -> ${cantidad} agente(s)`,
      );
    }
  }
}

main()
  .catch((error) => {
    console.error('');
    console.error(
      'Error durante la importación:',
      error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });