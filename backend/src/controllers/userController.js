import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../middlewares/errorHandle.js";
import cache from "../config/cache.js";

const prisma = new PrismaClient();

export async function favorite(req, res, next) {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId) {
      return next(new AppError("BookID é obrigatório", 400));
    }

    const favoriteExists = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        bookId: bookId,
      },
    });
    if (favoriteExists) {
      return next(new AppError("Você já favoritou este livro!", 400));
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: userId,
        bookId: bookId,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    res.status(201).json({
      message: "Favoritado com sucesso",
      favorite,
    });
  } catch (error) {
    console.error("Erro ao favoritar: ", error);
    return next(new AppError("Erro ao favoritar", 500));
  }
}
export async function countFavorites(req, res, next) {
  try {
    const userId = req.user.id;

    const total = await prisma.favorite.count({
      where: {
        userId,
      },
    });
    return res.json({ total });
  } catch (error) {
    console.error("Erro ao contar favoritos: ", error);
    return next(new AppError("Erro ao contar favoritos", 500));
  }
}
export async function viewAllFavorites(req, res, next) {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId: userId },
      select: { bookId: true },
    });

    const bookIds = favorites.map((f) => f.bookId);

    res.json({ bookIds });
  } catch (error) {
    console.error("Erro ao buscar favoritos: ", error);
    return next(new AppError("Erro ao buscar favoritos", 500));
  }
}
export async function desfavorite(req, res, next) {
  try {
    let bookId = undefined;
    const userId = Number(req.user.id);

    bookId = Number(req.query.bookId);

    if (!bookId) {
      bookId = req.body;
    }

    if (!Number.isInteger(userId) || !Number.isInteger(bookId)) {
      return next(new AppError("ID inválido", 400));
    }

    const favoriteExists = await prisma.favorite.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });
    if (!favoriteExists) {
      return next(
        new AppError("Este livro não está marcado como favorito", 404),
      );
    }
    const favoriteRemove = await prisma.favorite.delete({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });
    if (!favoriteRemove) {
      return next(new AppError("Erro ao remover dos favoritos", 500));
    }
    return res.status(200).json({
      message: "Livro removido dos favoritos",
    });
  } catch (error) {
    console.error("Erro ao remover dos favoritos: ", error);
    return next(new AppError("Erro ao remover dos favoritos", 500));
  }
}
export async function update(req, res, next) {
  try {
    const { name, cpf, email, phone, address } = req.body;
    const userId = req.user.id;

    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!userExists) {
      return next(new AppError("Usuário não encontrado", 404));
    }
    const updateUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        name: name,
        cpf: cpf,
        email: email,
        phone: phone,
        address: address,
      },
    });
    return res.status(200).json({
      message: "Usuário atualizado",
      updateUser,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Erro ao atualizar usuário", 500));
  }
}
export async function uploadProfileImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Imagem não enviada",
      });
    }

    const userId = Number(req.user.id);
    const imagePath = `/uploads/${req.file.filename}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: imagePath,
      },
    });

    return res.status(200).json({
      message: "Imagem atualizada com sucesso",
      imageUrl: imagePath,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Erro ao salvar imagem", 500));
  }
}
export async function newPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = Number(req.user.id);

    if (!currentPassword || !newPassword) {
      return next(new AppError("Erro ao comparar senhas", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(new AppError("Usuário não encontrado", 404));
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return next(new AppError("Senha atual incorreta", 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Senha atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return next(new AppError("Erro ao atualizar senha", 500));
  }
}
export async function popularUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
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

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      totalLoans: user._count.loans,
    }));
    return res.json({
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Erro: ", error);
    return next(new AppError("Erro ao retornar usuários populares", 500));
  }
}

export async function getWishList(req, res, next) {
  try {
    const userId = req.user.id;
    const cacheKey = `user:wishlist:${userId}`;

    console.log(`Verificando cache para chave: ${cacheKey}`);
    const cachedWishlist = cache.get(cacheKey);

    if (cachedWishlist) {
      console.log("CACHE HIT - Retornando wishlist do cache");
      return res.json({ ...cachedWishlist, cached: true });  // Retorna o objeto completo com 'cached: true'
    }
    console.log("CACHE MISS - Consultando banco para wishlist");

    // Primeira consulta: Encontrar a wishlist do usuário
    const userWishList = await prisma.wishlist.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!userWishList) {
      return next(new AppError("Lista de desejos não encontrada", 404));  // Não salva no cache para evitar cache de erro
    }

    // Segunda consulta: Buscar itens associados
    const userWishListItems = await prisma.wishlistItem.findMany({
      where: {
        wishlistId: userWishList.id,
      },
    });

    // Estrutura o resultado completo
    const result = {
      message: "Lista de desejos encontrada",
      wishlist: userWishList,
      items: userWishListItems,
    };

    // Salva o resultado completo no cache
    cache.set(cacheKey, result);
    console.log(`Wishlist completa salva no cache para chave: ${cacheKey}`);

    return res.status(200).json(result);  // Status 200 para GET
  } catch (error) {
    console.error("Erro: ", error);
    return next(new AppError("Erro ao retornar lista de desejos", 500));
  }
}
export async function addWishList(req, res, next) {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const wishlist = await prisma.wishlist.findFirst({
      where: { userId: userId, isDefault: true },
    });
    if (!wishlist) {
      return next(new AppError("Lista de desejos não encontrada", 404));
    }

    const alreadyExists = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_bookId: {
          wishlistId: wishlist.id,
          bookId,
        },
      },
    });

    if (alreadyExists) {
      return next(new AppError("Livro já está na lista de desejos", 409));
    }

    const registerItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        bookId,
      },
    });

    return res.status(201).json({
      message: "Livro adicionado na lista de desejos",
      item: registerItem,
    });
  } catch (error) {
    console.error("Erro: ", error);
    return next(new AppError("Erro ao adicionar na lista de desejos", 500));
  }
}
