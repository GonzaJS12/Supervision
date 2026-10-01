import { crearClienteApi } from "@supervision/api-client";
import { API_URL } from "./config";
import { leerToken } from "./auth/storage";

export function clienteApi() {
  return crearClienteApi(API_URL, leerToken);
}
