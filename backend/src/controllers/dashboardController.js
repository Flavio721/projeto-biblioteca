import { PrismaClient } from "@prisma/client";
import { AppError } from '../middlewares/errorHandle.js';


const prisma = new PrismaClient();

export async function createActivity(req, res) {
  try {
    const userId = req.user.id;

    const {
      action,
      note,
      entityType,
      entityId,
      metadata
    } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action é obrigatória" });
    }

    const activity = await prisma.userActivity.create({
      data: {
        userId,
        action,
        note,
        entityType,
        entityId,
        metadata
      }
    });

    return res.status(201).json(activity);
  } catch (error) {
    console.error("Erro ao criar activity:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
