import os from "os";
import { app } from "./app";
import { env } from "./config/env";
import { dbLista } from "./config/db";

function ipsLocales(): string[] {
  const ips: string[] = [];
  for (const lista of Object.values(os.networkInterfaces())) {
    for (const nic of lista ?? []) {
      if (nic.family === "IPv4" && !nic.internal) ips.push(nic.address);
    }
  }
  return ips;
}

async function main(): Promise<void> {
  await dbLista;
  app.listen(env.PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`DSS-Becas API en http://localhost:${env.PORT}/api`);
    for (const ip of ipsLocales()) {
      // eslint-disable-next-line no-console
      console.log(`DSS-Becas API en red local: http://${ip}:${env.PORT}/api (CORS_LAN=${env.CORS_LAN})`);
    }
  });
}

void main();
