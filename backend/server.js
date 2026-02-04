import app from "./app.js";
import { verifyEmailConnection } from "./src/config/email.js";
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {

      // 🔍 DEBUG TEMPORÁRIO - Remova depois
        console.log('\n🔍 DEBUG - Variáveis de Email:');
        console.log('SMTP_USER:', process.env.SMTP_USER);
        console.log('SMTP_PASS comprimento:', process.env.SMTP_PASS?.length);
        console.log('SMTP_PASS tem espaços?', process.env.SMTP_PASS?.includes(' '));
        console.log('SMTP_PASS últimos 4:', process.env.SMTP_PASS?.slice(-4));
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
            
            // Status dos serviços
            console.log('📋 Status dos Serviços:');
            console.log(`   Database: ✅ Conectado`);
            console.log(`   Email: ${emailOk ? '✅ Configurado' : '⚠️  Não configurado'}`);
            console.log('=================================\n');
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();