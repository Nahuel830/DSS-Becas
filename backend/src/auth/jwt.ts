import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface PayloadJWT {
  id_usuario: number;
  rol: string;
  token_version: number;
}

function secreto(): string {
  const s = process.env.JWT_SECRET ?? "";
  if (!s || s === "cambiar-en-produccion") {
    throw new Error("JWT_SECRET no configurado.");
  }
  return s;
}

export function firmarToken(payload: PayloadJWT): string {
  return jwt.sign(payload, secreto(), { expiresIn: "8h" });
}

export function verificarToken(token: string): PayloadJWT {
  const dec = jwt.verify(token, secreto()) as Partial<PayloadJWT>;
  if (
    typeof dec.id_usuario !== "number" ||
    typeof dec.rol !== "string" ||
    typeof dec.token_version !== "number"
  ) {
    throw new Error("Token inválido.");
  }
  return { id_usuario: dec.id_usuario, rol: dec.rol, token_version: dec.token_version };
}

export function secretoConfigurado(): boolean {
  const s = process.env.JWT_SECRET ?? "";
  return s !== "" && s !== "cambiar-en-produccion";
}

export { env };
