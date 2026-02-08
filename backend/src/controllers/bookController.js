import { PrismaClient } from "@prisma/client";
import {
  getPopularBooks,
  getPopularCategories,
} from "../services/bookService.js";
import { AppError } from "../middlewares/errorHandle.js";
import { sanitizeText } from "../utils/sanitize.js";
import { maskIsbn } from "../utils/dateHelper.js";

const prisma = new PrismaClient();

export async function create(req, res, next) {
  try {
    const {
      isbn,
      title,
      author,
      category,
      publisher,
      publishYear,
      pages,
      language,
      description,
      quantity,
      location,
    } = req.body;

    // 1. Validar campos obrigatórios
    if (!isbn || !title || !author || !quantity) {
      return next(new AppError("Campos obrigatórios faltando", 400));
    }

    // 2. Validar e formatar ISBN
    const checkIsbn = maskIsbn(isbn);
    if (!checkIsbn) {
      return next(new AppError("ISBN inválido (deve ter 13 dígitos)", 400));
    }

    // 3. Verificar se ISBN já existe
    const existingBook = await prisma.book.findUnique({
      where: { isbn: checkIsbn }
    });

    if (existingBook) {
      return next(new AppError("Livro com este ISBN já existe", 400));
    }

    // 4. Processar imagem
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // 5. Sanitizar descrição
    const cleanDescription = sanitizeText(description);

    // 6. Criar livro
    const book = await prisma.book.create({
      data: {
        isbn: checkIsbn,
        title: title.trim(),
        author: author.trim(),
        category: category?.trim() || 'Outros',
        publisher: publisher?.trim() || null,
        publishYear: publishYear ? parseInt(publishYear) : null,
        pages: pages ? parseInt(pages) : null,
        language: language?.trim() || 'Português',
        description: cleanDescription || null,
        quantity: parseInt(quantity),
        availableQty: parseInt(quantity), // ← Adicionar isso se necessário
        location: location?.trim() || null,
        coverImage: imageUrl,
      },
    });

    return res.status(201).json({ 
      message: 'Livro criado com sucesso',
      book 
    });
    
  } catch (error) {
    console.error("CREATE BOOK ERROR:", error);
    
    // Tratamento de erro específico do Prisma
    
    return next(new AppError("Erro ao criar livro", 500));
  }
}

export async function list(req, res, next) {
  try {
    const {
      search,
      category,
      status,
      page = 1,
      limit = 10,
      sortBy = "title",
      order = "asc",
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          _count: {
            select: { reviews: true },
          },
        },
      }),
      prisma.book.count({ where }),
    ]);
    const booksWithRatings = await Promise.all(
      books.map(async (book) => {
        const reviews = await prisma.review.findMany({
          where: { bookId: book.id },
          select: { rating: true },
        });
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        return {
          ...book,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        };
      }),
    );
    return res.json({
      books: booksWithRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar os livros", error);
    return next(new AppError("Erro ao listar os livros", 500));
  }
}
export async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return next(new AppError("ID inválido", 400));
    }

    const book = await prisma.book.findUnique({
      where: { id: id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { loans: true },
        },
      },
    });
    if (!book) {
      return next(new AppError("Livro não encontrado", 404));
    }

    const avgRating =
      book.reviews.length > 0
        ? book.reviews.reduce((sum, r) => sum + r.rating, 0) /
          book.reviews.length
        : 0;

    res.json({
      ...book,
      averageRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error("Erro ao buscar o livro: ", error);
    return next(new AppError("Erro ao buscar livro", 500));
  }
}
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    if (updateData.publishYear)
      updateData.publishYear = parseInt(updateData.publishYear);
    if (updateData.pages) updateData.pages = parseInt(updateData.pages);
    if (updateData.quantity)
      updateData.quantity = parseInt(updateData.quantity);

    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    return res.json({
      message: "Livro atualizado com sucesso",
      book,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return next(new AppError("Livro não encontrado", 404));
    }
    console.error("Erro ao atualizar o livro: ", error);
    return next(new AppError("Erro ao atualizar o livro", 500));
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const activeLoans = await prisma.loan.count({
      where: {
        bookId: parseInt(id),
        status: { in: ["PENDING", "ACTIVE"] },
      },
    });
    if (activeLoans > 0) {
      return next(
        new AppError(
          "Não é possível deletar. Existem empréstimos ativos deste livro",
          400,
        ),
      );
    }
    await prisma.book.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: "Livro deletado com sucesso" });
  } catch (error) {
    if (error.code === "P2025") {
      return next(new AppError("Livro não encontrado", 404));
    }
    console.error("Não foi possível remover o livro: ", error);
    return next(new AppError("Erro ao deletar o livro", 500));
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await prisma.book.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    res.json({
      categories: categories.map((c) => c.category).sort(),
    });
  } catch (error) {
    console.error("Erro ao buscar categorias: ", error);
    return next(new AppError("Erro ao buscar categorias", 500));
  }
}
export async function popularBooks(req, res, next) {
  try {
    const books = await getPopularBooks();

    return res.json({
      books: books,
    });
  } catch (error) {
    console.error("Erro: ", error);
    return next(new AppError("Erro ao buscar livros populares", 500));
  }
}
export async function popularCategories(req, res, next) {
  try {
    const categories = await getPopularCategories();

    return res.json({
      categories: categories,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Erro ao buscar categorias populares", 500));
  }
}
