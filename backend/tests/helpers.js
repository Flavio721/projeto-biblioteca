// tests/integration/books.test.js
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../src/config/database.js";

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
      cpf: "345.231.987-19",
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
    test("deve listar livros sem autenticação", async () => {
      const response = await request(app).get("/api/books").expect(200);

      expect(response.body).toHaveProperty("books");
      expect(Array.isArray(response.body.books)).toBe(true);
    });
  });

  describe("POST /api/books", () => {
    test("deve criar livro com autenticação", async () => {
      const bookData = {
        isbn: "9788535902773",
        title: "1984",
        author: "George Orwell",
        category: "Ficção",
        description: "Distopia clássica",
        quantity: 5,
      };

      const response = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body).toHaveProperty("book");
      expect(response.body.book.title).toBe(bookData.title);
      expect(response.body.book.isbn).toBe(bookData.isbn);
    });

    test("não deve criar livro sem autenticação", async () => {
      const bookData = {
        isbn: "9788535902773",
        title: "1984",
        author: "George Orwell",
        category: "Ficção",
        quantity: 5,
      };

      await request(app).post("/api/books").send(bookData).expect(401);
    });

    test("deve validar campos obrigatórios", async () => {
      const response = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Apenas título" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
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
