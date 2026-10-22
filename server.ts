// ==========================================================
// NEXORA TRADER AI V11 — ROOT ENTRY POINT
// ==========================================================

import { startServer, app } from "./server/index.js";

startServer().catch((err) => {
  console.error("[NEXORA V11 FATAL] Failed to start server:", err);
  process.exit(1);
});

export { app };
