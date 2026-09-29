// Rellena `usuario` y contraseña inicial SOLO donde falten (idempotente).
// admin → Admin2026!, evaluador → Evaluador2026!, consulta → Consulta2026!,
// cualquier otro sin contraseña → Becas2026! con debe_cambiar_password=true.
import bcryptjs from "bcryptjs";
import { prisma } from "../src/config/db";

const CLAVES_INICIALES: Array<[string, string]> = [
  ["admin", "Admin2026!"],
  ["evaluador", "Evaluador2026!"],
  ["consulta", "Consulta2026!"],
];

function normalizarUsuario(nombre: string, id: number): string {
  const base = nombre
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30);
  return base.length >= 3 ? base : `usuario${id}`;
}

async function main(): Promise<void> {
  const usuarios = await prisma.usuario.findMany();
  for (const u of usuarios) {
    const cambios: { usuario?: string; password_hash?: string; debe_cambiar_password?: boolean } = {};
    let clave = u.usuario;
    if (!clave) {
      clave = normalizarUsuario(u.nombre, u.id_usuario);
      cambios.usuario = clave;
    }
    if (!u.password_hash) {
      const conocida = CLAVES_INICIALES.find(([login]) => login === clave);
      const password = conocida ? conocida[1] : "Becas2026!";
      cambios.password_hash = bcryptjs.hashSync(password, 10);
      if (!conocida) cambios.debe_cambiar_password = true;
    }
    if (Object.keys(cambios).length > 0) {
      await prisma.usuario.update({ where: { id_usuario: u.id_usuario }, data: cambios });
      console.log(`Actualizado id=${u.id_usuario} usuario=${clave}`);
    } else {
      console.log(`Sin cambios id=${u.id_usuario} usuario=${clave}`);
    }
  }
  await prisma.$disconnect();
}

void main();
