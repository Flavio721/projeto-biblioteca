import { PrismaClient } from "@prisma/client";
import { sanitizeText } from "../utils/sanitize.js";
import { AppError } from "../middlewares/errorHandle.js";

const prisma = new PrismaClient();

export async function createActivity(req, res, next) {
  try {
    const userId = req.user.id;

    const { action, note, entityType, entityId, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action é obrigatória" });
    }

    const cleanNote = sanitizeText(note ?? "");

    const activity = await prisma.userActivity.create({
      data: {
        userId,
        action,
        note: cleanNote,
        entityType,
        entityId,
        metadata,
      },
    });

    return res.status(201).json(activity);
  } catch (error) {
    console.error("Erro ao criar activity:", error);
    return next(new AppError("Erro ao criar activity", 500));
  }
}
