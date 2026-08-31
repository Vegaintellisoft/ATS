import { prisma } from "../config/prisma.js";

export async function logActivity(data: {
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  performedById: string;
  organizationId: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details || {},
        performedById: data.performedById,
        organizationId: data.organizationId,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Non-blocking: we don't throw here to avoid failing the main transaction if logging fails
  }
}
