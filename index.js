import { onRequest } from "firebase-functions/v2/https";
import app from "./src/server.js";

export const web = onRequest(app);