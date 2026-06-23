import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const createSequelize = (): Sequelize => {
  const databaseUrl = process.env["DATABASE_URL"];

  if (databaseUrl) {
    return new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: process.env["NODE_ENV"] === "development" ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      define: { timestamps: true },
      pool: { max: 5, min: 0, acquire: 30_000, idle: 10_000 },
    });
  }

  return new Sequelize({
    dialect: "postgres",
    host: process.env["DB_HOST"] ?? "localhost",
    port: Number(process.env["DB_PORT"] ?? 5432),
    database: process.env["DB_NAME"] ?? "book_exchange",
    username: process.env["DB_USER"] ?? "postgres",
    password: process.env["DB_PASSWORD"] ?? "postgres",
    logging: process.env["NODE_ENV"] === "development" ? console.log : false,
    define: { timestamps: true },
  });
};

const sequelize = createSequelize();

export default sequelize;
