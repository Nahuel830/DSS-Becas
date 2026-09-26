// Punto de entrada del seed de Prisma (delega en src/seed.ts).
import { seedDatabase } from "../src/seed";

seedDatabase()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Seed completado.");
  })
  .catch((e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
