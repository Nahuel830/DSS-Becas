import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DSS-Becas API en http://localhost:${env.PORT}/api`);
});
