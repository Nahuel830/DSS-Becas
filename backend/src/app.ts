import cors from "cors";
import express from "express";
import { env, origenPermitido } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { router } from "./routes";

export const app = express();

app.use(
  cors({
    origin: (origen, cb) => {
      if (origenPermitido(origen)) cb(null, true);
      else cb(new Error("Origen no permitido por CORS."));
    },
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/api", router);
app.use(notFound);
app.use(errorHandler);
