import { PrismaClient } from "@prisma/client";
import {
  addDays,
  calculateFine,
  calculateDueDate,
} from "../utils/dateHelper.js";
import { AppError } from "../middlewares/errorHandle.js";
import { sendLoanConfirmationEmail } from "../services/emailService.js";
import cache from "../config/cache.js";

const prisma = new PrismaClient();

export async function create(req, res, next) {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId || !userId) {
      return next(new AppError("Campos obrigatórios faltando", 400));
    }

    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId) },
    });

    if (!book) {
      return next(new AppError("Livro não encontrado", 404));
    }
    if (book.availableQty < 1) {
      return next(new AppError("Livro indisponível no momento", 400));
    }

    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
        status: { in: ["PENDING", "ACTIVE"] },
      },
    });

    if (existingLoan) {
      return next(
        new AppError("Você já possui um empréstimo ativo deste livro", 400),
      );
    }

    const overdueLoans = await prisma.loan.count({
      where: {
        userId,
        status: "OVERDUE",
      },
    });

    if (overdueLoans > 0) {
      return next(
        new AppError(
          "Você já possui empréstimos em atraso. Regularize sua situação primeiro",
          403,
        ),
      );
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: "DEFAULT_LOAN_DAYS" },
    });
    const loanDays = config ? parseInt(config.value) : 14;

    const loan = await prisma.loan.create({
      data: {
        userId,
        bookId: parseInt(bookId),
        dueDate: addDays(new Date(), loanDays),
        status: "PENDING",
      },
      include: {
        book: {
          select: { title: true, author: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: {
        availableQty: { decrement: 1 },
        status: book.availableQty - 1 === 0 ? "BORROWED" : book.status,
      },
    });
    sendLoanConfirmationEmail(loan.user, loan.book, loan).catch((err) =>
      console.error("Erro ao enviar email:", err),
    );
    return res.status(201).json({
      message: "Solicitação de empréstimo criada com sucesso",
      loan,
    });
  } catch (error) {
    console.error("Erro ao criar empréstimo: ", error);
    return next(new AppError("Erro ao criar empréstimo", 500));
  }
}
export async function list(req, res) {
  const loans = await prisma.loan.findMany();

  return res.status(200).json({
    loans: loans,
  });
}
export async function createReserve(req, res, next) {
  try {
    const userId = parseInt(req.user.id);
    const { bookId } = req.body;

    // 1️⃣ Verifica se o livro existe
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return next(new AppError("Livro não encontrado", 404));
    }

    // 2️⃣ Descobre a última posição DAQUELE livro
    const lastPosition = await prisma.reservation.findFirst({
      where: {
        bookId,
        status: "ACTIVE",
      },
      orderBy: {
        position: "desc",
      },
    });

    const nextPosition = lastPosition ? lastPosition.position + 1 : 1;

    // 3️⃣ Cria a reserva
    const newReserve = await prisma.reservation.create({
      data: {
        userId,
        bookId,
        position: nextPosition,
        status: "ACTIVE",
      },
    });

    return res.status(201).json({ reserve: newReserve });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    return next(new AppError("Erro ao criar reserva", 500));
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const loanId = parseInt(id);
    const today = new Date();

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) {
      return next(new AppError("Empréstimo não encontrado", 404));
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;

    // ⚠️ Só executa a lógica pesada se estiver devolvendo
    if (status === "RETURNED") {
      updateData.returnDate = new Date();

      // --- cálculo de multa ---
      const config = await prisma.systemConfig.findUnique({
        where: { key: "FINE_PER_DAY" },
      });

      const finePerDay = config ? parseFloat(config.value) : 2.5;

      updateData.fineAmount = calculateFine(
        loan.dueDate,
        new Date(),
        finePerDay,
      );

      // Tudo abaixo PRECISA ser atômico
      await prisma.$transaction(async (tx) => {
        // 1️- Atualiza o empréstimo atual
        await tx.loan.update({
          where: { id: loanId },
          data: updateData,
        });

        // 2️- Busca a PRIMEIRA reserva válida da fila
        const reservation = await tx.reservation.findFirst({
          where: {
            bookId: loan.bookId,
            status: "ACTIVE",
          },
          orderBy: {
            position: "asc",
          },
        });

        // 3️- Se NÃO houver reserva → livro volta pro estoque
        if (!reservation) {
          await tx.book.update({
            where: { id: loan.bookId },
            data: {
              availableQty: { increment: 1 },
              status: "AVAILABLE",
            },
          });
          return;
        }

        // 4️- Se houver reserva → cria novo empréstimo
        const newLoan = await tx.loan.create({
          data: {
            userId: reservation.userId,
            bookId: loan.bookId,
            status: "ACTIVE",
            loanDate: new Date(),
            dueDate: calculateDueDate(today), // ← você define essa função
          },
        });

        // 5️- Finaliza a reserva (NUNCA esqueça isso)
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "FULFILLED",
            fulfilledAt: new Date(),
            loanId: newLoan.id,
          },
        });
      });
    } else {
      // Atualização simples de status (sem devolução)
      await prisma.loan.update({
        where: { id: loanId },
        data: updateData,
      });
    }

    // Retorna o estado atualizado
    const updatedLoan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        book: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json({ loan: updatedLoan });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return next(new AppError("Erro ao atualizar status", 500));
  }
}

export async function renew(req, res, next) {
  try {
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!loan) {
      return next(new AppError("Empréstimo não encontrado", 404));
    }

    if (loan.userId !== req.user.id) {
      return next(new AppError("Acesso negado", 400));
    }
    if (new Date() > new Date(loan.dueDate)) {
      return next(
        new AppError("Não é possível renovar um empréstimo atrasado", 400),
      );
    }

    const maxRenewals = await prisma.systemConfig.findUnique({
      where: { key: "MAX_RENEALS" },
    });
    const maxRenewalsCount = maxRenewals ? parseInt(maxRenewals.value) : 2;

    if (loan.renewalCount >= maxRenewalsCount) {
      return next(
        new AppError(
          `Limite de renovações atingido (${maxRenewalsCount})`,
          400,
        ),
      );
    }

    const loanDays = 14;
    const updatedLoan = await prisma.loan.update({
      where: { id: parseInt(id) },
      data: {
        dueDate: addDays(new Date(loan.dueDate), loanDays),
        renewalCount: { increment: 1 },
      },
    });
    return res.json({ loan: updatedLoan });
  } catch (error) {
    console.error("Erro ao renovar empréstimo: ", error);
    return next(new AppError("Erro ao renovar empréstimo", 500));
  }
}

export async function getMyLoans(req, res, next) {
  try {
    const id = parseInt(req.user.id);
    const cacheKey = `user:loans:${id}`;

    console.log(`Verificando cache para chave: ${cacheKey}`);
    const cachedLoans = cache.get(cacheKey);  // Renomeado para clareza

    if (cachedLoans) {
      console.log("CACHE HIT - Retornando empréstimos do cache");
      return res.json({ loans: cachedLoans, cached: true });  // Consistente: sempre { loans: ... }
    }
    console.log("CACHE MISS - Consultando banco para empréstimos");

    const loans = await prisma.loan.findMany({
      where: { userId: id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImage: true,
            isbn: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Query retornou ${loans.length} empréstimos`);  // Debug: confirma dados

    // Salva no cache (mesmo se vazio, para evitar reconsultas)
    cache.set(cacheKey, loans);
    console.log(`Empréstimos salvos no cache para chave: ${cacheKey}`);

    return res.json({ loans });  // Consistente com o hit
  } catch (error) {
    console.error("Erro ao buscar meus empréstimos: ", error);
    return next(new AppError("Erro ao buscar meus empréstimos", 500));
  }
}

export async function getLoansByDate(req, res, next) {
  const startDate = req.query.startDate || req.query.start;
  const endDate = req.query.endDate || req.query.end;

  if (!startDate || !endDate) {
    return next(new AppError("Informe a data inicial e final", 400));
  }

    // início do dia
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    // início do dia seguinte
    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);

  const cacheKey = `loans:byDate:${safeStart}:${safeEnd}:page${page}:limit${limit}`;

  console.log(`Verificando cache para chave: ${cacheKey}`);
  const cachedLoans = cache.get(cacheKey);

  if (cachedLoans) {
    console.log("CACHE HIT - Retornando empréstimos por data do cache");
    return res.json({ ...cachedLoans, cached: true });
  }
  console.log("CACHE MISS - Consultando banco para empréstimos por data");


  const loans = await prisma.loan.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    include: {
      user: {
        select: { name: true },
      },
      book: {
        select: { title: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  cache.set(cacheKey, loans);
  console.log(`Empréstimos por data salvos no cache para chave: ${cacheKey}`);
  return res.json({ loans: loans });
}
export async function getAllFine(req, res, next) {
  try {
    const cacheKey = `fines:all`;

    console.log(`Verificando cache para chave: ${cacheKey}`);
    const cachedFines = cache.get(cacheKey);

    if (cachedUser) {
      console.log("CACHE HIT - Retornando dados do usuário do cache");
      return res.json({ ...cachedFines, cached: true });
    }
    console.log("CACHE MISS - Consultando banco para dados do usuário");
    const allFines = await prisma.loan.findMany({
      where: {
        fineAmount: {
          gt: 0,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });
    cache.set(cacheKey, allFines);
    console.log(`Dados salvos no cache para chave: ${cacheKey}`);
    return res.status(200).json({
      allFines: allFines,
    });
  } catch (error) {
    console.error("Erro: ", error);
    return next(new AppError("Erro ao buscar multas", 500));
  }
}
