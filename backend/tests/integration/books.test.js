// tests/integration/books.test.js
import request from "supertest";
import app from "../../app.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Books API", () => {
  let authToken;
  let userId;

  // Criar usuário e fazer login antes dos testes
  beforeAll(async () => {
    // Limpar banco
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();

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
  });

  afterAll(async () => {
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/books", () => {
    test("deve listar livros todos os livros no database", async () => {
      const response = await request(app).get("/api/books").expect(200);

      expect(response.body).toHaveProperty("books");
      expect(Array.isArray(response.body.books)).toBe(true);
    });
  });

  describe("POST /api/books/create", () => {
    test("deve criar livro com autenticação", async () => {
      const bookData = {
        isbn: "9788535902773",
        title: "1984",
        author: "George Orwell",
        category: "Ficção",
        quantity: 5,
      };

      const response = await request(app)
        .post("/api/books/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body).toHaveProperty("book");
      expect(response.body.book.title).toBe(bookData.title);
    });

    test("não deve criar livro sem autenticação", async () => {
      const bookData = {
        isbn: "9788535902773",
        title: "1984",
        author: "George Orwell",
        category: "Ficção",
        quantity: 5,
      };

      await request(app).post("/api/books/create").send(bookData).expect(401);
    });

    test("deve validar campos obrigatórios", async () => {
      const response = await request(app)
        .post("/api/books/create")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Apenas título" })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /api/books/:id", () => {
    test("deve retornar detalhes de um livro", async () => {
      // Criar livro primeiro
      const book = await prisma.book.create({
        data: {
          isbn: "9788535902773",
          title: "1984",
          author: "George Orwell",
          category: "Ficção",
          quantity: 5,
        },
      });

      const response = await request(app)
        .get(`/api/books/${book.id}`)
        .expect(200);

      expect(response.body.title).toBe(book.title);
      expect(response.body.author).toBe(book.author);
    });

    test("deve retornar 404 para livro inexistente", async () => {
      await request(app).get("/api/books/99999").expect(404);
    });
  });
});
