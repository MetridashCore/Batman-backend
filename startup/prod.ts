import type { Express } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import * as Sentry from "@sentry/node";

export default function (app: Express) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  app.use(cors());
  app.use(helmet());
  app.use(compression());
}
