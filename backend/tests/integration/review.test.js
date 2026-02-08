// tests/integration/books.test.js
import request from "supertest";
import app from "../../app.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Review API", () => {
  let authToken;
  let userId;
  let bookId;

  // Criar usuário e fazer login antes dos testes
  beforeAll(async () => {
    // Limpar banco
    await prisma.loan.deleteMany();
    await prisma.user.deleteMany();
    await prisma.book.deleteMany();

    // Criar usuário bibliotecário
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Bibliotecário",
      email: "bibliotecario@test.com",
      password: "senha123",
      cpf: "34523198719",
    });

    // Atualizar role para LIBRARIAN
    const user = await prisma.user.findUnique({
      where: { email: "bibliotecario@test.com" },
      select: {
        id: true,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "LIBRARIAN" },
    });

    userId = user.id;

    // Fazer login
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "bibliotecario@test.com",
      password: "senha123",
    });

    authToken = loginRes.body.token;

    const bookData = {
      isbn: "9788535902773",
      title: "1984",
      author: "George Orwell",
      category: "Ficção",
      quantity: 5,
    };

    const bookRes = await request(app)
      .post("/api/books/create")
      .set("Authorization", `Bearer ${authToken}`)
      .send(bookData);

    const book = await prisma.book.findFirst({
      where: { title: "1984" },
      select: {
        id: true,
      },
    });

    bookId = book.id;
  });

  afterAll(async () => {
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/reviews/list", () => {
    test("deve listar todos as avaliações registrados no database", async () => {
      const response = await request(app)
        .get("/api/reviews/list")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("reviews");
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });
  });

  describe("POST /api/reviews", () => {
    test("deve criar avaliação com autenticação", async () => {
      const reviewData = {
        userId: userId,
        bookId: bookId,
        rating: 5,
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body).toHaveProperty("review");
      expect(response.body.review.userId).toBe(reviewData.userId);
    });

    test("não deve criar avaliação sem autenticação", async () => {
      const reviewData = {
        userId: userId,
        bookId: bookId,
        rating: 5,
      };

      await request(app).post("/api/reviews").send(reviewData).expect(401);
    });

    test("deve validar campos obrigatórios", async () => {
      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: userId })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.status).toBe("error");
    });
  });
});
