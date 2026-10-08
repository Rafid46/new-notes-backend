import pkg from "@prisma/client";
import pgPkg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = pkg;
const { Pool } = pgPkg;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("DB connected via prisma");
  } catch (error) {
    console.log(`Data base connection error : ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};
export { prisma, connectDB, disconnectDB };
