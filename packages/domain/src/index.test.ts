import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcularClasificacion,
  calcularPromedio,
  hayCriteriosDuplicados,
  repararTexto,
} from "./index.ts";

test("promedio: mismos pesos y dos decimales", () => {
  assert.equal(calcularPromedio([1, 2, 3, 4, 5]), 3);
  assert.equal(calcularPromedio([5, 5, 4]), 4.67);
});

test("promedio rechaza valores fuera de 1-5", () => {
  assert.throws(() => calcularPromedio([]));
  assert.throws(() => calcularPromedio([0, 5]));
  assert.throws(() => calcularPromedio([1.5]));
});

test("clasificación por umbrales", () => {
  assert.equal(calcularClasificacion(2.5), "CRITICO");
  assert.equal(calcularClasificacion(2.51), "REGULAR");
  assert.equal(calcularClasificacion(3.5), "REGULAR");
  assert.equal(calcularClasificacion(3.51), "BUENO");
  assert.equal(calcularClasificacion(4.5), "BUENO");
  assert.equal(calcularClasificacion(4.51), "EXCELENTE");
});

test("criterios duplicados", () => {
  assert.equal(hayCriteriosDuplicados([1, 2, 3]), false);
  assert.equal(hayCriteriosDuplicados([1, 2, 1]), true);
});

test("repara nombres latin1/utf-8 (Acuña)", () => {
  assert.equal(repararTexto("AcuÃ±a"), "Acuña");
  assert.equal(repararTexto("MarÃ­a"), "María");
  assert.equal(repararTexto("Acuña"), "Acuña");
  assert.equal(repararTexto(null), null);
});
