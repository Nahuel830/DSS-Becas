import { prisma } from "./src/config/db";

async function main(): Promise<void> {
  const usuarios = await prisma.usuario.findMany({
    select: { id_usuario: true, nombre: true, correo: true, rol: true },
  });
  console.log(JSON.stringify(usuarios, null, 2));
  await prisma.$disconnect();
}

void main();
