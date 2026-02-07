// tests/integration/auth.test.js
import request from 'supertest';
import app from '../../app.js';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
describe('Auth API', () => {
  
  // Limpar banco antes de cada teste
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  // Fechar conexão após todos os testes
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    test('deve registrar um novo usuário', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        cpf: '12432198716'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Verificar se foi salvo no banco
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });

    test('não deve registrar com email duplicado', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        cpf: '21332123498'
      };

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Segundo registro (deve falhar)
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.status).toBe('error');
    });

    test('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'João' }) // Falta email e password
        .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('deve fazer login com credenciais válidas', async () => {
      // Criar usuário primeiro
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        cpf: '34518292340'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Fazer login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
    });

    test('não deve fazer login com senha incorreta', async () => {
      // Criar usuário
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@email.com',
          password: 'senha123'
        });

      // Tentar login com senha errada
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao@email.com',
          password: 'senhaERRADA'
        })
        .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.status).toBe('error');        
    });

    test('não deve fazer login com usuário inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@email.com',
          password: 'senha123'
        })
        .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.status).toBe('error');   
      });
  });
});