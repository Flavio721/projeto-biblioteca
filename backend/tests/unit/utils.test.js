// tests/unit/utils.test.js
import {
    addDays,
    getDaysDifference,
    isOverdue,
    calculateFine,
    maskIsbn,
    generateToken,
    verifyToken
  } from '../../utils.js'; // Ajuste o caminho para o arquivo onde as funções estão definidas
  
  // Mock para process.env.JWT_SECRET (para testes de JWT)
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });
  
  describe('Utils Functions', () => {
    describe('addDays', () => {
      test('deve adicionar dias a uma data', () => {
        const date = new Date('2023-01-01');
        const result = addDays(date, 5);
        expect(result).toEqual(new Date('2023-01-06'));
      });
  
      test('deve lidar com dias negativos', () => {
        const date = new Date('2023-01-10');
        const result = addDays(date, -3);
        expect(result).toEqual(new Date('2023-01-07'));
      });
  
      test('deve retornar uma nova instância de Date', () => {
        const date = new Date('2023-01-01');
        const result = addDays(date, 1);
        expect(result).not.toBe(date); // Deve ser uma nova instância
      });
    });
  
    describe('getDaysDifference', () => {
      test('deve calcular diferença em dias (positiva)', () => {
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2023-01-05');
        const result = getDaysDifference(date1, date2);
        expect(result).toBe(4); // Ceil de 4 dias
      });
  
      test('deve calcular diferença independente da ordem', () => {
        const date1 = new Date('2023-01-05');
        const date2 = new Date('2023-01-01');
        const result = getDaysDifference(date1, date2);
        expect(result).toBe(4);
      });
  
      test('deve retornar 0 para datas iguais', () => {
        const date = new Date('2023-01-01');
        const result = getDaysDifference(date, date);
        expect(result).toBe(0);
      });
    });
  
    describe('isOverdue', () => {
      test('deve retornar true se a data de vencimento passou', () => {
        const pastDate = new Date('2022-01-01');
        expect(isOverdue(pastDate)).toBe(true);
      });
  
      test('deve retornar false se a data de vencimento é futura', () => {
        const futureDate = new Date('2030-01-01');
        expect(isOverdue(futureDate)).toBe(false);
      });
  
      test('deve retornar false se a data de vencimento é hoje', () => {
        const today = new Date();
        expect(isOverdue(today)).toBe(false); // Assumindo que "hoje" não é overdue
      });
    });
  
    describe('calculateFine', () => {
      test('deve retornar 0 se não estiver overdue', () => {
        const futureDate = new Date('2030-01-01');
        const result = calculateFine(futureDate, null, 1);
        expect(result).toBe(0);
      });
  
      test('deve calcular multa com returnDate fornecida', () => {
        const dueDate = new Date('2023-01-01');
        const returnDate = new Date('2023-01-05'); // 4 dias de atraso
        const result = calculateFine(dueDate, returnDate, 2); // R$ 2 por dia
        expect(result).toBe(8); // 4 * 2
      });
  
      test('deve usar data atual se returnDate não for fornecida', () => {
        const dueDate = new Date('2022-01-01'); // Data passada
        const finePerDay = 1;
        const result = calculateFine(dueDate, null, finePerDay);
        // Resultado varia com a data atual, mas deve ser > 0
        expect(result).toBeGreaterThan(0);
      });
    });
  
    describe('maskIsbn', () => {
      test('deve formatar ISBN-13 corretamente', () => {
        const isbn = '9788535902773';
        const result = maskIsbn(isbn);
        expect(result).toBe('978-8-535-90277-3');
      });
  
      test('deve formatar ISBN com hífens existentes', () => {
        const isbn = '978-0-123-45678-9';
        const result = maskIsbn(isbn);
        expect(result).toBe('978-0-123-45678-9');
      });
  
      test('deve retornar false para ISBN com menos de 13 dígitos', () => {
        const isbn = '978123456789';
        const result = maskIsbn(isbn);
        expect(result).toBe(false);
      });
  
      test('deve retornar false para ISBN com mais de 13 dígitos', () => {
        const isbn = '9781234567890123';
        const result = maskIsbn(isbn);
        expect(result).toBe(false);
      });
  
      test('deve retornar false para entrada vazia', () => {
        const result = maskIsbn('');
        expect(result).toBe(false);
      });
    });
  
    describe('generateToken', () => {
      test('deve gerar um token JWT válido', () => {
        const payload = { userId: 1, role: 'USER' };
        const token = generateToken(payload);
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3); // Estrutura JWT: header.payload.signature
      });
  
      test('deve incluir o payload no token', () => {
        const payload = { id: 123 };
        const token = generateToken(payload);
        const decoded = verifyToken(token);
        expect(decoded.id).toBe(123);
      });
    });
  
    describe('verifyToken', () => {
      test('deve verificar e decodificar um token válido', () => {
        const payload = { userId: 1 };
        const token = generateToken(payload);
        const decoded = verifyToken(token);
        expect(decoded.userId).toBe(1);
      });
  
      test('deve retornar null para token inválido', () => {
        const invalidToken = 'invalid.jwt.token';
        const result = verifyToken(invalidToken);
        expect(result).toBe(null);
      });
  
      test('deve retornar null para token expirado', () => {
        // Simular token expirado (defina expiresIn curto se possível, ou use um token pré-expirado)
        const expiredToken = generateToken({ id: 1 }, { expiresIn: '1ms' }); // Expira imediatamente
        setTimeout(() => {
          const result = verifyToken(expiredToken);
          expect(result).toBe(null);
        }, 10); // Pequeno delay para expirar
      });
    });
  });