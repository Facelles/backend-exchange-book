import dotenv from "dotenv";
dotenv.config();

import sequelize from "./config/database";
import app from "./app";

const PORT = Number(process.env["PORT"] ?? 3000);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    if (process.env["NODE_ENV"] !== "production") {
      await sequelize.sync({ alter: true });
      console.log("✅ Database synced.");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();
