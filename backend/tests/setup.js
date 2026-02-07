// tests/setup.js
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Carregar .env.test
dotenv.config({ path: '.env.test' });

console.log('🧪 Configurando ambiente de teste...');

// Verificar se DATABASE_URL está apontando para banco de teste
if (!process.env.DATABASE_URL.includes('biblioteca_test')) {
  console.error('❌ ERRO: DATABASE_URL não está apontando para banco de teste!');
  console.error('   Esperado: biblioteca_test');
  console.error('   Atual:', process.env.DATABASE_URL);
  process.exit(1);
}

console.log('✅ Banco de teste configurado:', process.env.DATABASE_URL.split('@')[1]);

// (Opcional) Aplicar migrations automaticamente
// Descomente se quiser rodar migrations toda vez que executar testes
// try {
//   console.log('🔄 Aplicando migrations...');
//   execSync('npx prisma migrate deploy', { stdio: 'inherit' });
//   console.log('✅ Migrations aplicadas!');
// } catch (error) {
//   console.error('❌ Erro ao aplicar migrations');
// }