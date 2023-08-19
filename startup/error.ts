import type { Express } from "express";
import * as Sentry from "@sentry/node";

export default function error(app: Express) {
  app.use(Sentry.Handlers.errorHandler());
}
