require("dotenv").config();
const server = require("./src/app");

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log("🚀 Film Database API Server Started!");
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("📊 Available endpoints:");
  console.log("   - GET /api/services/health (Health check)");
  console.log("   - GET /api/movies (Movies list)");
});