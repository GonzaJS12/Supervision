import * as SecureStore from "expo-secure-store";
import type { UsuarioSesion } from "@supervision/api-client";

const TOKEN = "supervision_token";
const USUARIO = "supervision_usuario";

export async function guardarSesion(
  token: string,
  usuario: UsuarioSesion,
) {
  await SecureStore.setItemAsync(TOKEN, token);
  await SecureStore.setItemAsync(USUARIO, JSON.stringify(usuario));
}

export async function leerToken() {
  return SecureStore.getItemAsync(TOKEN);
}

export async function leerUsuario(): Promise<UsuarioSesion | null> {
  const raw = await SecureStore.getItemAsync(USUARIO);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as UsuarioSesion;
}

export async function borrarSesion() {
  await SecureStore.deleteItemAsync(TOKEN);
  await SecureStore.deleteItemAsync(USUARIO);
}
