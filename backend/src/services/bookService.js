import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getPopularBooks() {
  const books = await prisma.book.findMany({
    include: {
      _count: {
        select: { loans: true },
      },
    },
    orderBy: {
      loans: {
        _count: "desc",
      },
    },
  });

  return books;
}

export async function getPopularCategories() {
  // Agrupa empréstimos por bookId e conta
  const loansByBook = await prisma.loan.groupBy({
    by: ["bookId"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  // Busca as informações dos livros
  const bookIds = loansByBook.map((item) => item.bookId);
  const books = await prisma.book.findMany({
    where: {
      id: { in: bookIds },
    },
    select: {
      id: true,
      category: true,
      title: true,
    },
  });

  // Agrupa por categoria
  const categoryStats = {};
  loansByBook.forEach((loan) => {
    const book = books.find((b) => b.id === loan.bookId);
    if (book) {
      if (!categoryStats[book.category]) {
        categoryStats[book.category] = {
          category: book.category,
          totalLoans: 0,
          books: [],
        };
      }
      categoryStats[book.category].totalLoans += loan._count.id;
      categoryStats[book.category].books.push({
        title: book.title,
        loans: loan._count.id,
      });
    }
  });

  // Converte para array e ordena
  const result = Object.values(categoryStats).sort(
    (a, b) => b.totalLoans - a.totalLoans,
  );

  return result;
}
