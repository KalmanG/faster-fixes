import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Neon's serverless driver uses HTTP, avoiding TCP cold-start overhead when the
// database is on Neon. Everywhere else (local dev, self-hosted Postgres) use the
// standard pg adapter — Neon's driver can't talk to a plain Postgres over TCP.
const isNeon = /neon\.tech/.test(connectionString);
const adapter = isNeon
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

export { prisma };
