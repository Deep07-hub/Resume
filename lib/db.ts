import { PrismaClient } from "@prisma/client"

// Create a singleton PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const db = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

// In development, create new instances to avoid hot reload issues
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db 