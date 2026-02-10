# 📖 Sistema de Biblioteca Digital - Guia de Execução

## 🚀 Como Executar o Projeto

### Passo 1: Clonar e Instalar
```bash
# 1. Criar projeto
mkdir biblioteca-digital
cd biblioteca-digital/backend

# 2. Instalar dependências
npm install express @prisma/client bcrypt jsonwebtoken cors dotenv express-validator multer
npm install -D prisma nodemon jest supertest

# 3. Criar estrutura de pastas
mkdir -p src/{config,controllers,middlewares,routes,services,utils,prisma}
mkdir -p uploads tests
```

### Passo 2: Configurar .env
```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**.env (EXEMPLO - NÃO COMMITAR):**
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=<gerar_usando_comando_acima>
JWT_EXPIRES_IN=7d
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/biblioteca_db"
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
DEFAULT_LOAN_DAYS=14
MAX_RENEWALS=2
FINE_PER_DAY=2.50
```

### Passo 3: Configurar Banco de Dados
```bash
# 1. Criar banco de dados PostgreSQL
createdb biblioteca_db

# Ou pelo psql:
psql -U postgres
CREATE DATABASE biblioteca_db;
\q

# 2. Executar migrations
npx prisma generate
npx prisma migrate dev --name init

# 3. Executar seed (dados iniciais)
npm run prisma:seed
```

### Passo 4: Iniciar Servidor
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Modo produção
npm start
```

**Saída esperada:**
```
=================================
📚 Biblioteca Digital API
=================================
🚀 Servidor rodando na porta 3000
📍 http://localhost:3000
🏥 Health check: http://localhost:3000/api/health
📊 Prisma Studio: npx prisma studio
=================================
```

### Passo 5: Executar Testes
```bash
# Rodar todos os testes
npm test

# Rodar testes uma vez
npm run test:once

# Gerar relatório de cobertura
npm run test:coverage
```

---

## 🧪 Testando a API com cURL

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Registrar Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Teste",
    "email": "usuario@example.com",
    "password": "SenhaSegura123!",
    "cpf": "00000000000",
    "phone": "00000000000"
  }'
```

### 3. Fazer Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123!"
  }'
```

**Copie o token retornado!**

### 4. Listar Livros
```bash
curl http://localhost:3000/api/books
```

### 5. Criar Livro (como bibliotecário)
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "isbn": "9788535902773",
    "title": "1984",
    "author": "George Orwell",
    "category": "Ficção",
    "description": "Distopia clássica",
    "quantity": 5
  }'
```

<!-- Resto do documento continua igual -->
```

### 6. Solicitar Empréstimo
```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "bookId": 1
  }'
```

### 7. Ver Dashboard (bibliotecário)
```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📊 Endpoints da API

### Autenticação (`/api/auth`)
| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/register` | Registrar novo usuário | Não |
| POST | `/login` | Fazer login | Não |
| GET | `/me` | Dados do usuário logado | Sim |

### Livros (`/api/books`)
| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/` | Listar livros | Não | - |
| GET | `/:id` | Detalhes do livro | Não | - |
| GET | `/categories` | Listar categorias | Não | - |
| POST | `/` | Criar livro | Sim | Bibliotecário |
| PUT | `/:id` | Atualizar livro | Sim | Bibliotecário |
| DELETE | `/:id` | Deletar livro | Sim | Bibliotecário |

### Empréstimos (`/api/loans`)
| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| POST | `/` | Solicitar empréstimo | Sim | Usuário |
| GET | `/my-loans` | Meus empréstimos | Sim | Usuário |
| POST | `/:id/renew` | Renovar empréstimo | Sim | Usuário |
| GET | `/` | Listar todos | Sim | Bibliotecário |
| PATCH | `/:id/status` | Alterar status | Sim | Bibliotecário |

### Avaliações (`/api/reviews`)
| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/` | Criar avaliação | Sim |
| PUT | `/:id` | Atualizar avaliação | Sim |
| DELETE | `/:id` | Deletar avaliação | Sim |

### Usuários (`/api/users`)
| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/` | Listar usuários | Sim | Admin |
| PATCH | `/:id/role` | Alterar role | Sim | Admin |
| PATCH | `/:id/status` | Ativar/desativar | Sim | Admin |

### Dashboard (`/api/dashboard`)
| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/` | Estatísticas | Sim | Bibliotecário |

---

## 📝 Exemplos de Uso

### Fluxo Completo de Usuário

**1. Usuário se registra**
```javascript
POST /api/auth/register
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "password": "senha123"
}
```

**2. Faz login**
```javascript
POST /api/auth/login
{
  "email": "maria@email.com",
  "password": "senha123"
}
// Retorna token
```

**3. Busca livros**
```javascript
GET /api/books?search=clean code
```

**4. Solicita empréstimo**
```javascript
POST /api/loans
Authorization: Bearer {token}
{
  "bookId": 3
}
```

**5. Bibliotecário aprova**
```javascript
PATCH /api/loans/1/status
Authorization: Bearer {librarian_token}
{
  "status": "ACTIVE"
}
```

**6. Usuário renova**
```javascript
POST /api/loans/1/renew
Authorization: Bearer {token}
```

**7. Usuário avalia**
```javascript
POST /api/reviews
Authorization: Bearer {token}
{
  "bookId": 3,
  "rating": 5,
  "comment": "Excelente livro!"
}
```

### Fluxo do Bibliotecário

**1. Login como bibliotecário**
```javascript
POST /api/auth/login
{
  "email": "bibliotecario@biblioteca.com",
  "password": "bibliotecario123"
}
```

**2. Adicionar novo livro**
```javascript
POST /api/books
Authorization: Bearer {token}
{
  "isbn": "9788595084742",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "category": "Tecnologia",
  "description": "Guia de boas práticas",
  "quantity": 5
}
```

**3. Ver empréstimos pendentes**
```javascript
GET /api/loans?status=PENDING
Authorization: Bearer {token}
```

**4. Ver empréstimos atrasados**
```javascript
GET /api/loans?overdue=true
Authorization: Bearer {token}
```

**5. Registrar devolução**
```javascript
PATCH /api/loans/1/status
Authorization: Bearer {token}
{
  "status": "RETURNED",
  "notes": "Livro devolvido em bom estado"
}
```

**6. Ver dashboard**
```javascript
GET /api/dashboard
Authorization: Bearer {token}
```

---

## 🐛 Troubleshooting

### Erro: "Port 3000 already in use"
```bash
# Matar processo na porta 3000
# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou mudar porta no .env
PORT=3001
```

### Erro: "Prisma Client not found"
```bash
npx prisma generate
```

### Erro: "Database connection"
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql status

# Verificar DATABASE_URL no .env
# Formato: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Erro: "JWT_SECRET is not defined"
```bash
# Gerar nova chave
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Adicionar ao .env
```

### Testes falhando
```bash
# Limpar banco de testes
npx prisma migrate reset

# Rodar testes novamente
npm test
```

### Upload de imagens não funciona
```bash
# Criar pasta uploads se não existir
mkdir uploads

# Verificar permissões
chmod 755 uploads
```

---

## 📈 Próximas Melhorias

### Features Adicionais
1. **Sistema de Notificações**
   - Email quando empréstimo é aprovado
   - Lembrete de devolução próxima
   - Aviso de atraso

2. **Reservas**
   - Permitir reservar livro emprestado
   - Fila de espera

3. **Multas e Pagamentos**
   - Calcular multas automaticamente
   - Integração com gateway de pagamento
   - Histórico de pagamentos

4. **Relatórios**
   - Exportar relatórios em PDF
   - Gráficos de uso da biblioteca
   - Relatório de livros mais populares ✓

5. **Sistema de Tags**
   - Tags personalizadas para livros
   - Busca por tags
   - Recomendações baseadas em tags

6. **Sistema de Favoritos**
   - Marcar livros favoritos ✓
   - Lista de desejos ✓
   - Compartilhar listas

### Melhorias Técnicas
1. **Cache com Redis**
   - Cache de livros mais acessados
   - Cache de dashboard

2. **Background Jobs**
   - Verificar empréstimos atrasados diariamente
   - Enviar emails em background

3. **Logs Estruturados**
   - Winston para logs
   - Log rotation
   - Logs de auditoria

4. **Rate Limiting**
   - Limitar requisições por IP
   - Proteção contra DDoS

5. **Documentação com Swagger**
   - API docs interativa
   - Testar endpoints no navegador

6. **Containerização**
   - Dockerfile
   - Docker Compose
   - Deploy facilitado

---

## 🎓 Conceitos Aprendidos

Ao completar este projeto, você terá praticado:

✅ **Node.js & Express**
- Criação de API RESTful
- Middlewares
- Rotas organizadas
- Error handling

✅ **Prisma ORM**
- Schema design
- Migrations
- Queries complexas
- Relacionamentos

✅ **Autenticação & Autorização**
- JWT tokens
- Hash de senhas com bcrypt
- Controle de roles (RBAC)
- Rotas protegidas

✅ **Validação de Dados**
- Express Validator
- Validação de schemas
- Sanitização de inputs

✅ **Upload de Arquivos**
- Multer configuration
- Validação de tipos
- Armazenamento local

✅ **Testes Automatizados**
- Jest
- Supertest
- Test coverage
- TDD/BDD

✅ **Boas Práticas**
- Clean Code
- SOLID principles
- Error handling
- Security best practices

---

## 📚 Recursos Úteis

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [JWT.io](https://jwt.io/)
- [Jest Documentation](https://jestjs.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)


## 👨‍💻 Autor

**Flávio Inocêncio Ramos Coelho**  
Desenvolvedor Full Stack  

- 🐙 GitHub: https://github.com/Flavio721
- ✉️ Email: flavio2010sjcc@gmail.com 

Este projeto foi desenvolvido com o objetivo de praticar e demonstrar conhecimentos em Node.js, Express, Prisma e arquitetura de APIs REST.

## ⚠️ Segurança

- Nunca commite o arquivo `.env`
- Use `.env.example` como referência
- Gere suas próprias chaves JWT
- Altere todas as senhas padrão em produção

---

**🎉 Parabéns por completar o projeto! Agora você tem um sistema de biblioteca completo e funcional!**
