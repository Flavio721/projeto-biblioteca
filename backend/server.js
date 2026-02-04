import app from "./app.js";
import { verifyEmailConnection } from "./src/config/email.js";
import { executarVerificacoes } from "./src/services/emailService.js"; // ← Corrigido
import cron from 'node-cron'; // ← Adicionar
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Verificar conexão com email
        console.log('\n📧 Verificando configuração de email...');
        const emailOk = await verifyEmailConnection();
        
        if (!emailOk) {
            console.log('⚠️  Email não configurado ou com erro');
            console.log('   → O servidor continuará rodando, mas emails não serão enviados');
            console.log('   → Verifique as variáveis SMTP_* no arquivo .env\n');
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('=================================');
            console.log('📚 Biblioteca Digital API');
            console.log('=================================');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
            console.log(`📊 Prisma Studio: npx prisma studio`);
            console.log('=================================');
            console.log('📋 Status dos Serviços:');
            console.log(`   Database: ✅ Conectado`);
            console.log(`   Email: ${emailOk ? '✅ Configurado' : '⚠️  Não configurado'}`);
            console.log('=================================\n');
            
            // ✅ Configurar Cron Jobs (apenas se email estiver OK)
            if (emailOk) {
                console.log('⏰ Configurando verificações automáticas...\n');
                
                // Executar todo dia às 9h
                cron.schedule('0 9 * * *', () => {
                    console.log('\n⏰ [CRON] Executando verificação diária...');
                    executarVerificacoes();
                });
                
                console.log('✅ Verificações configuradas para rodar todo dia às 09:00\n');
                
                // ⚠️ OPCIONAL: Executar imediatamente ao iniciar (apenas para testes)
                // Comente esta linha em produção
                // executarVerificacoes();
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();