import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../utils/jwt.js";
import { AppError } from "../middlewares/errorHandle.js";
import cache from "../config/cache.js";

const prisma = new PrismaClient();

export async function register(req, res, next) {
  try {
    const { name, email, cpf, phone, address, password } = req.body;

    if (!email || !password || !cpf) {
      return next(new AppError("Campos obrigatórios vazios", 400));
    }
    const userExists = await prisma.user.findUnique({
      where: { email },
    });
    if (userExists) {
      return next(new AppError("Email já cadastrado", 400));
    }

    const cpfExists = await prisma.user.findUnique({
      where: { cpf },
    });
    if (cpfExists) {
      return next(new AppError("CPF já registrado", 401));
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf: cpf,
        phone,
        address,
      },
    });

    const wishList = await prisma.wishlist.create({
      data: {
        userId: user.id,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    delete user.password;

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user,
      token,
    });
  } catch (error) {
    console.error("Erro ao registrar: ", error);
    return next(new AppError("Erro ao registrar", 500));
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError("Email ou senha inválidos", 401));
    }
    if (!user.isActive) {
      return next(new AppError("Usuário desativado", 403));
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return next(new AppError("Email ou senha inválidos", 401));
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 dia
    });
    delete user.password;

    res.json({
      message: "Login realizado com sucesso",
      user,
      token,
    });
  } catch (error) {
    console.error("Erro ao fazer login: ", error);
    return next(new AppError("Erro ao fazer login", 500));
  }
}
export async function me(req, res, next) {
  try {
    const userId = req.user.id;
    const cacheKey = `user:me:${userId}`;

    console.log(`Verificando cache para chave: ${cacheKey}`);
    const cachedUser = cache.get(cacheKey);

    if (cachedUser) {
      console.log("CACHE HIT - Retornando dados do usuário do cache");
      return res.json({ user: cachedUser, cached: true });
    }
    console.log("CACHE MISS - Consultando banco para dados do usuário");

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    cache.set(cacheKey, user);
    console.log(`Dados salvos no cache para chave: ${cacheKey}`);
    res.json({ user });
  } catch (error) {
    return next(new AppError("Erro ao buscar dados do usuário", 500));
  }
}
