import { PrismaClient } from '@prisma/client'

// Extend the PrismaClient type to include Json type alias
declare module '@prisma/client' {
  export interface InputJsonValue {
    [key: string]: JsonValue
  }

  export interface JsonValue {
    type: 'JsonValue'
  }
}

export const prisma = new PrismaClient()