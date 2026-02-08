import express from "express";
import {
  list,
  getCategories,
  getById,
  create,
  update,
  remove,
  popularBooks,
  popularCategories,
} from "../controllers/bookController.js";
import { bookValidation } from "../middlewares/validator.js";
import { authMiddleware } from "../middlewares/auth.js";
import { checkRole, isLibrarian } from "../middlewares/roles.js";
import { upload } from "../config/multer.js";
import { PrismaClient } from "@prisma/client";
import { desfavorite } from "../controllers/userController.js";
import { searchLimiter, apiLimiter } from "../config/rateLimit.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", searchLimiter, list);
router.get("/length", async (req, res) => {
  const count = await prisma.book.count();
  res.json({ length: count });
});
router.get("/books-read", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    const booksRead = await prisma.loan.count({
      where: {
        userId: userId,
        status: "RETURNED",
      },
    });
    return res.json({ books: booksRead });
  } catch (error) {
    console.error("Erro na busca: ", error);
    res.status(500).json({ error: "Erro na busca" });
  }
});
router.get("/available", async (req, res) => {
  const booksAvaliable = await prisma.book.count({
    where: { status: "AVAILABLE" },
  });
  return res.json({ length: booksAvaliable });
});
router.get("/books-isfavorite", authMiddleware, async (req, res) => {
  const userId = Number(req.user.id);
  const bookId = Number(req.query.bookId);

  if (!Number.isInteger(userId) || !Number.isInteger(bookId)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  try {
    const isFavorite = await prisma.favorite.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });
    return res.json({ favorite: !!isFavorite });
  } catch (error) {
    console.log("Erro na busca: ", error);
    res.status(500).json({ error: "Erro na busca" });
  }
});
router.delete("/desfavorite", authMiddleware, desfavorite);
router.get("/categories", getCategories);

router.post(
  "/create",
  authMiddleware,
  checkRole("ADMIN", "LIBRARIAN"),
  upload.single("coverImage"),
  create,
  bookValidation.create,
);
router.post("/book-filter", searchLimiter, authMiddleware, async (req, res) => {
  try {
    const { category } = req.body;

    const booksSearch = await prisma.book.findMany({
      where: { category: category },
    });

    return res.json({ books: booksSearch });
  } catch (error) {
    console.error("Erro: ", error);
    res.status(500).json({ error: "Erro na busca" });
  }
});

router.get(
  "/popular-books",
  authMiddleware,
  checkRole("ADMIN", "LIBRARIAN"),
  popularBooks,
);

router.get(
  "/popular-categorie",
  authMiddleware,
  checkRole("ADMIN", "LIBRARIAN"),
  popularCategories,
);
router.put(
  "/:id",
  authMiddleware,
  isLibrarian,
  upload.single("coverImage"),
  update,
  bookValidation.update,
);
router.get("/:id", apiLimiter, getById);

router.delete("/:id", authMiddleware, isLibrarian, remove);
export default router;
