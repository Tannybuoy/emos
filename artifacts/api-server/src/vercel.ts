import express from "express";
import cors from "cors";
import router from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes at /api (original request URL) and at / (rewritten URL)
// so the handler works regardless of how Vercel delivers the path.
app.use("/api", router);
app.use("/", router);

export default app;
