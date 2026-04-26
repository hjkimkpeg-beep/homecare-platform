import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "homecare-dev-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  // Production: serve the built frontend static files directly
  const staticDir = path.join(process.cwd(), "artifacts/homecare/dist/public");
  app.use(express.static(staticDir));
  // SPA fallback: serve index.html for any route not handled above
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  // Development: proxy to the Vite dev server (homecare) and mockup-sandbox
  const homecarePort = process.env.HOMECARE_PORT || "24243";
  const mockupPort = process.env.MOCKUP_PORT || "8081";

  app.use(
    "/__mockup",
    createProxyMiddleware({
      target: `http://localhost:${mockupPort}`,
      changeOrigin: true,
      ws: true,
    }),
  );

  app.use(
    "/",
    createProxyMiddleware({
      target: `http://localhost:${homecarePort}`,
      changeOrigin: true,
      ws: true,
    }),
  );
}

export default app;
