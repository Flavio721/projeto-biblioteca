import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";
import { isLibrarian } from "../middlewares/roles.js";
import { createActivity } from "../controllers/dashboardController.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authMiddleware, isLibrarian, async (req, res) => {
  try {
    const [
      totalBooks,
      totalUsers,
      activeLoans,
      overdueLoans,
      totalLoans,
      avaliableBooks,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({
        where: {
          status: "ACTIVE",
          dueDate: { lt: new Date() },
        },
      }),
      prisma.loan.count(),
      prisma.book.aggregate({
        _sum: { availableQty: true },
      }),
    ]);

    const mostBorrewedBooks = await prisma.loan.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    });

    const bookDetails = await Promise.all(
      mostBorrewedBooks.map(async (item) => {
        const book = await prisma.book.findUnique({
          where: { id: item.bookId },
          select: { id: true, title: true, author: true },
        });
        return {
          ...book,
          loanCount: item._count.bookId,
        };
      }),
    );
    const recentLoans = await prisma.loan.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        book: { select: { id: true, title: true, author: true } },
      },
    });
    const activeUsers = await prisma.loan.groupBy({
      by: ["userId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });
    const userDetails = await Promise.all(
      activeUsers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { id: true, name: true, email: true },
        });
        return {
          ...user,
          loanCount: item._count.userId,
        };
      }),
    );
    res.json({
      stats: {
        totalBooks,
        totalUsers,
        activeLoans,
        overdueLoans,
        totalLoans,
        availableBooks: avaliableBooks._sum.availableQty || 0,
      },
      mostBorrewedBooks: bookDetails,
      recentLoans,
      activeUsers: userDetails,
    });
  } catch (error) {
    console.error("Erro ao buscar no dashboard: ", error);
    res.status(500).json({ error: "Erro ao buscar no dashboard" });
  }
});
router.post("/recent-activity", authMiddleware, createActivity);

router.get("/my-recent", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const recentActivity = await prisma.userActivity.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return res.json({
      recent: recentActivity,
    });
  } catch (error) {
    console.error("Erro: ", error);
    return res.status(500).json({ error: "Erro na busca " });
  }
});

export default router;
